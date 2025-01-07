import React, { useState } from "react";
import axios from "axios";
import "./DocAssistant.css";

function DocumentAssist() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [documents, setDocuments] = useState([]);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
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

    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/upload-document", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 200) {
        const { markdown_path } = response.data;
        setDocuments((prev) => [...prev, { name: fileName, path: markdown_path }]);
        alert(`File uploaded successfully!`);
      } else {
        alert(response.data.error);
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      alert("An error occurred during upload.");
    } finally {
      setLoading(false);
      setFile(null);
      setFileName("");
    }
  };

  const handleAskQuestion = async () => {
    if (!selectedDocuments.length || !question) {
      alert("Please select/upload documents and enter a question.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/ask-question", {
        markdown_path: selectedDocuments[0].path, // Assuming selecting one document for now
        question: question,
      });

      if (response.status === 200) {
        setAnswer(response.data.answer);
      } else {
        alert(response.data.error);
      }
    } catch (error) {
      console.error("Error asking question:", error);
      alert("Error asking question.");
    } finally {
      setLoading(false);
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
      {loading && <div className="spinner-overlay"><div className="spinner"></div></div>}
      <h2 className="header-title">Document QA Chatbot</h2>
      <div className="upload-section">
        <input
          type="file"
          id="fileUpload"
          style={{ display: "none" }}
          onChange={handleFileChange}
          disabled={loading || selectedDocuments.length > 0}
        />
        <label htmlFor="fileUpload" className={`upload-button ${loading || selectedDocuments.length > 0 ? "disabled" : ""}`}>
          Choose File
        </label>
        <button
          className="upload-submit-button"
          onClick={handleFileUpload}
          disabled={loading || selectedDocuments.length > 0 || !file}
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
            {documents.map((document, index) => (
              <tr key={index}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedDocuments.some((doc) => doc.path === document.path)}
                    onChange={() => toggleDocumentSelection(document)}
                  />
                </td>
                <td>{document.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="qa-section">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question..."
          className="question-input"
        ></textarea>
        <button
          className="ask-question-button"
          onClick={handleAskQuestion}
          disabled={loading || !question}
        >
          Ask Question
        </button>
      </div>

      <div className="answer-section">
        {answer && (
          <div>
            <h3>Answer:</h3>
            <p>{answer}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default DocumentAssist;