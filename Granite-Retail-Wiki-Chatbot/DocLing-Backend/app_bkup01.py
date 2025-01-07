from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import tempfile
import shutil
import nltk
from pathlib import Path
from pypdfium2 import PdfDocument, PdfiumError
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions, TesseractCliOcrOptions
from docling.document_converter import DocumentConverter, PdfFormatOption, WordFormatOption, SimplePipeline
from langchain_community.document_loaders import UnstructuredMarkdownLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_ollama import OllamaEmbeddings, OllamaLLM
from langchain_community.vectorstores import FAISS
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory


# Ensure NLTK resources are available
nltk.download('punkt')
nltk.download('averaged_perceptron_tagger')

app = Flask(__name__)
CORS(app)

def get_document_format(file_path) -> InputFormat:
    """Determine the document format based on file extension"""
    format_map = {
        '.pdf': InputFormat.PDF,
        '.docx': InputFormat.DOCX,
        '.pptx': InputFormat.PPTX,
        '.html': InputFormat.HTML,
        '.htm': InputFormat.HTML
    }

    try:
        extension = os.path.splitext(file_path)[1].lower()
        print(f"File extension detected: {extension}")
        
        # Add supported formats here
        if extension in ['.pdf', '.docx', '.html', '.pptx']:
            return format_map.get(extension)
        else:
            print(f"Unsupported file extension: {extension}")
            return None
    except Exception as e:
        print(f"Error in get_document_format: {str(e)}")
        return None                                    # Return None if format is unsupported
    
def validate_pdf(file_path):
    """Validate if the PDF is readable."""
    try:
        pdf = PdfDocument(file_path)  # Ensure PdfDocument is initialized properly
        #page_count = pdf.get_page_count()
        page_count = len(pdf)  # Use len(pdf) to get the number of pages

        if page_count == 0:
            raise ValueError("The PDF has no readable pages.")
        print(f"PDF validated successfully with {page_count} pages.")
    except PdfiumError as pdf_error:
        raise ValueError(f"PDF validation error: {pdf_error}")
    except Exception as e:
        raise ValueError(f"Unexpected PDF validation error: {e}")

def convert_document_to_markdown(doc_path) -> str:
    """Convert document to Markdown using Docling."""
    input_path = os.path.abspath(doc_path)
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_input = os.path.join(temp_dir, os.path.basename(input_path))
        os.makedirs(temp_dir, exist_ok=True)
        shutil.copy2(input_path, temp_input)

        pipeline_options = PdfPipelineOptions(do_ocr=False, do_table_structure=True)

        converter = DocumentConverter(
            allowed_formats=[InputFormat.PDF, InputFormat.DOCX, InputFormat.HTML, InputFormat.PPTX],
            format_options={
                InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options),
                InputFormat.DOCX: WordFormatOption(pipeline_cls=SimplePipeline)
            }
        )
        try:
            print(f"Attempting to convert document: {temp_input}")
            conv_result = converter.convert(temp_input)
            if not conv_result or not conv_result.document:
                raise ValueError("Document conversion failed with no output.")
            print("Conversion successful.")
            return conv_result.document.export_to_markdown()
        except PdfiumError as pdf_error:
            print(f"PDF loading error: {pdf_error}")
            raise ValueError("The uploaded PDF could not be processed. Please try another file.") from pdf_error
        except Exception as e:
            print(f"Error during document conversion: {e}")
            raise

def setup_qa_chain(markdown_file_path, embeddings_model_name="nomic-embed-text:latest", model_name="granite3.1-dense:8b"):
    """Set up the QA chain."""

    print(f"Setting up QA chain with content: {markdown_file_path[:200]}...")  # Log the first 200 characters

    # loader = UnstructuredMarkdownLoader.from_content(markdown_content)
    # documents = loader.load()

    # Here we should load the markdown file from the path.
    # loader = UnstructuredMarkdownLoader.from_file(markdown_content)  # Use from_file to load the markdown
    # documents = loader.load()

    # Use UnstructuredMarkdownLoader to load markdown content from file
    # Load the markdown content from the file
    loader = UnstructuredMarkdownLoader(markdown_file_path)
    documents = loader.load()

    # Split the documents into smaller chunks
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    texts = text_splitter.split_documents(documents)

    # Create embeddings and vectorstore
    embeddings = OllamaEmbeddings(model=embeddings_model_name)
    vectorstore = FAISS.from_documents(texts, embeddings)

    # Set up the LLM
    llm = OllamaLLM(model=model_name, temperature=0)

    # Initialize memory for conversational retrieval
    memory = ConversationBufferMemory(
        memory_key="chat_history",
        output_key="answer",
        return_messages=True
    )

    # Create and return the QA chain
    qa_chain = ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=vectorstore.as_retriever(search_kwargs={"k": 10}),
        memory=memory,
        return_source_documents=True
    )
    return qa_chain


@app.route('/upload-document', methods=['POST'])
def upload_document():
    """Endpoint to upload a document."""
    if 'file' not in request.files:
        # Log the file name and path
        print(f"File uploaded: {file.filename}")
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files['file']
    if file.filename == '':
        # Log the file name and path
        print(f"File uploaded: {file.filename}")
        return jsonify({"error": "No file selected"}), 400
    
    temp_file_path = None
    temp_dir = tempfile.mkdtemp()
    temp_file_path = os.path.join(temp_dir, file.filename)

    try:
        # temp_file_path = tempfile.NamedTemporaryFile(delete=False).name
        # temp_file_path = os.path.join(temp_dir, os.path.basename(file.filename))
        file.save(temp_file_path)

        # Log the file name and path
        print(f"File uploaded: {file.filename}, saved as: {temp_file_path}")

        # Determine document format
        doc_format = get_document_format(temp_file_path)

        if not doc_format:
            print(f"Unsupported file format: {os.path.splitext(temp_file_path)[1]}")
            return jsonify({"error": "Unsupported document format"}), 400
        
        if doc_format == InputFormat.PDF:
            try:
                validate_pdf(temp_file_path)
            except ValueError as e:
                print(f"Validation error: {e}")
                return jsonify({"error": str(e)}), 400

        # Convert document to markdown
        markdown_content = convert_document_to_markdown(temp_file_path)
        print(f"Markdown content successfully generated.")

        # Save markdown to a persistent location
        persistent_dir = os.path.join(os.getcwd(), "uploads")
        os.makedirs(persistent_dir, exist_ok=True)
        markdown_path = os.path.join(persistent_dir, f"{file.filename}.md")

        #markdown_path = f"{temp_file_path}.md"
        with open(markdown_path, "w", encoding="utf-8") as md_file:
            md_file.write(markdown_content)

        print(f"Markdown file saved at: {markdown_path}")
        print(f"Response to frontend: {jsonify({'markdown_content': markdown_content, 'markdown_path': markdown_path})}")
        
        return jsonify({
            "markdown_content": markdown_content,  # If you want the actual content
            "markdown_path": markdown_path         # If you want the saved path
        }), 200
    
    except Exception as e:
        print(f"Error during file upload or processing: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        if temp_file_path and os.path.exists(temp_file_path):
            print(f"File saved successfully: {temp_file_path}")
            os.remove(temp_file_path)
        shutil.rmtree(temp_dir, ignore_errors=True)

@app.route('/ask-question', methods=['POST'])
def ask_question():
    """Endpoint to ask a question."""
    data = request.json

    # Check for missing required fields
    # markdown_content = data.get('markdown_content')
    # question = data.get('question')

    markdown_file_path = data.get('markdown_path')  # Use markdown_path passed from frontend
    question = data.get('question')

    print(f"Request data received: {data}")
    print(f"Markdown path: {markdown_file_path}, Question: {question}")

    if not markdown_file_path or not question:
        print(f"Missing data: markdown_content = {markdown_file_path}, question = {question}")
        return jsonify({"error": "Invalid request, markdown_content and question are required"}), 400
    
    try:
        # Proceed with the QA logic
        qa_chain = setup_qa_chain(markdown_file_path)
        print(f"Received markdown_path: {markdown_file_path}, question: {question}")
        
        # generate Answer
        result = qa_chain.invoke({"question": question})
        return jsonify({"answer": result["answer"]}), 200
    except Exception as e:
        print(f"Error during QA processing: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
