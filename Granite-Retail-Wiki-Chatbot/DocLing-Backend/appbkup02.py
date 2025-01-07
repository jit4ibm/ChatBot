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
import uuid
import logging

# Initialize logging
logging.basicConfig(level=logging.INFO)

# Ensure NLTK resources are available
nltk.download('punkt')
nltk.download('averaged_perceptron_tagger')

app = Flask(__name__)
CORS(app)

# Max file size limit in MB (e.g., 10MB)
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024

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
        logging.info(f"File extension detected: {extension}")
        if extension in ['.pdf', '.docx', '.html', '.pptx']:
            return format_map.get(extension)
        else:
            logging.warning(f"Unsupported file extension: {extension}")
            return None
    except Exception as e:
        logging.error(f"Error in get_document_format: {str(e)}")
        return None

def validate_pdf(file_path):
    """Validate if the PDF is readable."""
    try:
        pdf = PdfDocument(file_path)  # Ensure PdfDocument is initialized properly
        page_count = len(pdf)  # Use len(pdf) to get the number of pages
        if page_count == 0:
            raise ValueError("The PDF has no readable pages.")
        logging.info(f"PDF validated successfully with {page_count} pages.")
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
            logging.info(f"Attempting to convert document: {temp_input}")
            conv_result = converter.convert(temp_input)
            if not conv_result or not conv_result.document:
                raise ValueError("Document conversion failed with no output.")
            logging.info("Conversion successful.")
            return conv_result.document.export_to_markdown()
        except PdfiumError as pdf_error:
            logging.error(f"PDF loading error: {pdf_error}")
            raise ValueError("The uploaded PDF could not be processed. Please try another file.") from pdf_error
        except Exception as e:
            logging.error(f"Error during document conversion: {e}")
            raise

def setup_qa_chain(markdown_file_path, embeddings_model_name="nomic-embed-text:latest", model_name="granite3.1-dense:8b"):
    """Set up the QA chain."""

    logging.info(f"Setting up QA chain with content: {markdown_file_path[:200]}...")  # Log the first 200 characters

    loader = UnstructuredMarkdownLoader(markdown_file_path)
    documents = loader.load()

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    texts = text_splitter.split_documents(documents)

    embeddings = OllamaEmbeddings(model=embeddings_model_name)
    vectorstore = FAISS.from_documents(texts, embeddings)

    llm = OllamaLLM(model=model_name, temperature=0)

    memory = ConversationBufferMemory(
        memory_key="chat_history",
        output_key="answer",
        return_messages=True
    )

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
        logging.error("No file part in the request")
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files['file']
    if file.filename == '':
        logging.error("No file selected")
        return jsonify({"error": "No file selected"}), 400
    
    temp_file_path = None
    temp_dir = tempfile.mkdtemp()
    temp_file_path = os.path.join(temp_dir, file.filename)

    try:
        file.save(temp_file_path)
        logging.info(f"File uploaded: {file.filename}, saved as: {temp_file_path}")

        doc_format = get_document_format(temp_file_path)
        if not doc_format:
            logging.warning(f"Unsupported file format: {os.path.splitext(temp_file_path)[1]}")
            return jsonify({"error": "Unsupported document format"}), 400

        if doc_format == InputFormat.PDF:
            try:
                validate_pdf(temp_file_path)
            except ValueError as e:
                logging.error(f"Validation error: {e}")
                return jsonify({"error": str(e)}), 400

        markdown_content = convert_document_to_markdown(temp_file_path)
        logging.info("Markdown content successfully generated.")

        persistent_dir = os.path.join(os.getcwd(), "uploads")
        os.makedirs(persistent_dir, exist_ok=True)
        markdown_path = os.path.join(persistent_dir, f"{uuid.uuid4()}.md")

        with open(markdown_path, "w", encoding="utf-8") as md_file:
            md_file.write(markdown_content)

        logging.info(f"Markdown file saved at: {markdown_path}")

        return jsonify({
            "markdown_content": markdown_content,
            "markdown_path": markdown_path
        }), 200
    
    except Exception as e:
        logging.error(f"Error during file upload or processing: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        if temp_file_path and os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        shutil.rmtree(temp_dir, ignore_errors=True)


@app.route('/ask-question', methods=['POST'])
def ask_question():
    """Endpoint to ask a question."""
    data = request.json

    markdown_file_path = data.get('markdown_path')
    question = data.get('question')

    if not markdown_file_path or not question:
        logging.error(f"Missing data: markdown_content = {markdown_file_path}, question = {question}")
        return jsonify({"error": "Invalid request, markdown_content and question are required"}), 400
    
    try:
        qa_chain = setup_qa_chain(markdown_file_path)
        result = qa_chain.invoke({"question": question})
        return jsonify({"answer": result["answer"]}), 200
    except Exception as e:
        logging.error(f"Error during QA processing: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)