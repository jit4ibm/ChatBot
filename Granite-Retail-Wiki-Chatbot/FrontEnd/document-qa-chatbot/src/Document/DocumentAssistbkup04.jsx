import React, { useState } from "react";
import axios from "axios";
import "./DocAssistant.css";

function DocumentAssist() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [documents, setDocuments] = useState([]); // List of uploaded documents
  const [selectedDocuments, setSelectedDocuments] = useState([]); // Selected documents
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
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
    formData.append("file", file);

    setLoading(true); // Show spinner
    try {
      const response = await axios.post("http://localhost:5000/upload-document", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 200) {
        const { markdown_path } = response.data;
        setDocuments((prev) => [...prev, { name: fileName, path: markdown_path }]);
        alert(`File uploaded successfully!`);
      } else {
        console.error("Error:", response.data.error);
        alert(response.data.error);
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      alert("An error occurred during upload. Please check the console for details.");
    } finally {
      setLoading(false); // Hide spinner
      setFile(null); // Clear selected file
      setFileName("");
    }
  };

  const handleAskQuestion = async () => {
    if (!selectedDocuments.length || !question) {
      alert("Please select/upload documents and enter a question.");
      return;
    }

    setLoading(true); // Show spinner
    try {
      const response = await axios.post("http://localhost:5000/ask-question", {
        markdown_paths: selectedDocuments.map((doc) => doc.path), // Send selected document paths
        question: question,
      });

      if (response.status === 200) {
        setAnswer(response.data.answer);
      } else {
        alert(response.data.error);
      }
    } catch (error) {
      console.error("Error asking question:", error);
      alert("Error asking question. Please check the console for details.");
    } finally {
      setLoading(false); // Hide spinner
    }
  };

  const toggleDocumentSelection = (document) => {
    setSelectedDocuments((prev) =>
      prev.some((doc) => doc.path === document.path)
        ? prev.filter((doc) => doc.path !== document.path)
        : [...prev, document]
    );
  };

  return (
    <div className="document-assist-container">
      {loading && (
        <div className="spinner-overlay">
          <div className="spinner"></div>
        </div>
      )}
      <h2 className="header-title">Document QA Chatbot</h2>

      <div className="upload-section">
        <input
          type="file"
          id="fileUpload"
          style={{ display: "none" }}
          onChange={handleFileChange}
          disabled={loading}
        />
        <label htmlFor="fileUpload" className="upload-button">
          Choose File
        </label>
        <button
          className="upload-submit-button"
          onClick={handleFileUpload}
          disabled={loading}
        >
          Upload Document
        </button>
      </div>
      {fileName && <p className="file-name">Selected: {fileName}</p>}

      <div className="document-table-section">
        <h3>Uploaded Documents</h3>
        <table className="document-table">
          <thead>
            <tr>
              <th>Select</th>
              <th>Document Name</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc, index) => (
              <tr key={index}>
                <td>
                  <input
                    type="checkbox"
                    onChange={() => toggleDocumentSelection(doc)}
                    checked={selectedDocuments.some((selected) => selected.path === doc.path)}
                    disabled={loading}
                  />
                </td>
                <td>{doc.name}</td>
              </tr>
            ))}
            {documents.length === 0 && (
              <tr>
                <td colSpan="2">No documents uploaded yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="question-section">
        <input
          type="text"
          className="question-input"
          placeholder="Ask a question..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={!selectedDocuments.length || loading}
        />
        <button
          className="ask-question-button"
          onClick={handleAskQuestion}
          disabled={!selectedDocuments.length || loading}
        >
          Ask Question
        </button>
      </div>

      <div className="answer-section">
        <h3>Answer:</h3>
        <p>{answer || "No answer available yet."}</p>
      </div>
    </div>
  );
}

export default DocumentAssist;