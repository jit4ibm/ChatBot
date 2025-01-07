import React, { useState } from 'react';
import axios from 'axios';
import "./DocAssistant.css";

function DocumentAssist() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [documents, setDocuments] = useState([]); // List of uploaded documents
  const [selectedDocument, setSelectedDocument] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const handleFileUpload = async () => {
    if (!file) {
      alert("Please select a file before uploading.");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true); // Show loading indicator
    try {
      const response = await axios.post('http://localhost:5000/upload-document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.status === 200) {
        const { markdown_path } = response.data;
        setDocuments((prev) => [...prev, markdown_path]);
        setSelectedDocument(markdown_path); // Automatically select the newly uploaded document
        alert(`File uploaded successfully!`);
      } else {
        console.error("Error:", response.data.error);
        alert(response.data.error);
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      alert("An error occurred during upload. Please check the console for details.");
    } finally {
      setLoading(false); // Hide loading indicator
    }
  };

  const handleAskQuestion = async () => {
    if (!selectedDocument || !question) {
      alert("Please select/upload a document and enter a question.");
      return;
    }

    setLoading(true); // Show loading indicator
    try {
      const response = await axios.post('http://localhost:5000/ask-question', {
        markdown_path: selectedDocument,
        question: question,
      });

      if (response.status === 200) {
        setAnswer(response.data.answer);
      } else {
        alert(response.data.error);
      }
    } catch (error) {
      console.error('Error asking question:', error);
      alert("Error asking question. Please check the console for details.");
    } finally {
      setLoading(false); // Hide loading indicator
    }
  };

  return (
    <div className="document-assist-container">
      <h2 className="header-title">Document QA Chatbot</h2>

      <div className="upload-section">
        <input
          type="file"
          id="fileUpload"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <label htmlFor="fileUpload" className="upload-button">
          Choose File
        </label>
        <button className="upload-submit-button" onClick={handleFileUpload} disabled={loading}>
          {loading ? 'Uploading...' : 'Upload Document'}
        </button>
      </div>
      {fileName && <p className="file-name">Selected: {fileName}</p>}

      <div className="document-selection-section">
        <label htmlFor="document-select">Select a Document:</label>
        <select
          id="document-select"
          className="document-select"
          value={selectedDocument}
          onChange={(e) => setSelectedDocument(e.target.value)}
          disabled={loading}
        >
          <option value="">-- Select a Document --</option>
          {documents.map((doc, index) => (
            <option key={index} value={doc}>
              {doc.split('/').pop()}
            </option>
          ))}
          <option value="upload">Upload New Document</option>
        </select>
      </div>

      <div className="question-section">
        <input
          type="text"
          className="question-input"
          placeholder="Ask a question..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={!selectedDocument || loading}
        />
        <button
          className="ask-question-button"
          onClick={handleAskQuestion}
          disabled={!selectedDocument || loading}
        >
          {loading ? 'Loading...' : 'Ask Question'}
        </button>
      </div>

      <div className="answer-section">
        <h3>Answer:</h3>
        <p>{answer || 'No answer available yet.'}</p>
      </div>
    </div>
  );
}

export default DocumentAssist;