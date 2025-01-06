import React, { useState } from 'react';
import axios from 'axios';

function DocumentAssist() {
  const [file, setFile] = useState(null);
  const [markdownPath, setMarkdownPath] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  const handleFileUpload = async () => {
    if (!file) {
        alert("Please select a file before uploading.");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:5000/upload-document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.status === 200) {
        setMarkdownPath(response.data.markdown_path);
        alert(`File uploaded successfully! Markdown path: ${response.data.markdown_path}`);
        console.log("Upload Response:", response.data);
      } else {
        console.error("Error:", response.data.error);
        alert(response.data.error);
      }

    } catch (error) {
      console.error('Error uploading document:', error);
      alert("An error occurred during upload. Please check the console for details.");
    }
  };

  const handleAskQuestion = async () => {
    if (!markdownPath || !question) {
        alert("Please upload a document first and ask a question.");
        return;
    }
    else
    {
        console.log("Sending question:", question);
        console.log("Sending markdown_path:", markdownPath);
    }
    
    try {
      const response = await axios.post('http://localhost:5000/ask-question', {
     // markdown_content: markdownContent,           // Send the markdown path (or content)
        markdown_path: markdownPath,                 // Use the correct key
        question: question,
      });
      console.log("Ask Question Response:", response.data);
      if (response.status === 200) {
        setAnswer(response.data.answer);
      } else {
        alert(response.data.error);
      }

    } catch (error) {
      console.error('Error asking question:', error);
      alert("Error asking question. Please check the console for details.");
    }
  };

  return (
    <div>
      <h1>Document QA Chatbot</h1>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleFileUpload}>Upload Document</button>
      <br />
      <input
        type="text"
        placeholder="Ask a question..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />
      <button onClick={handleAskQuestion}>Ask Question</button>
      <h2>Answer:</h2>
      <p>{answer}</p>
    </div>
  );
}

export default DocumentAssist;
