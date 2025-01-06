import React, { useState } from 'react';
import DocumentAssist from './Document/DocumentAssist';  // Assuming you have this component
import RetailAssist from './Retail/RetailAssist';      // Assuming you have this component
import './App.css';  // Ensure to import the CSS file for styling

function App() {
  const [showRetail, setShowRetail] = useState(false); // Track which view to show

  return (
    <div className="app-container">
      <div className="button-container">
      <button
          className={`toggle-button ${!showRetail ? 'active' : ''}`}
          onClick={() => {
            console.log("Document clicked");
            setShowRetail(false);
          }
        }  
        >
          Document Chatbot
        </button>
        
        <button
          className={`toggle-button ${showRetail ? 'active' : ''}`}
          onClick={() => {
            console.log("Retail clicked");
            setShowRetail(true);
          }
        }
        >
          Retail Application Chatbot
        </button>

      </div>

      {/* Conditional rendering based on state */}
      {showRetail ? (
        <div className="retail-app">
          <h2>Retail Chatbot Content</h2>
          <RetailAssist />
        </div>
      ) : (
        <div className="document-app">
          <h2>Document Chatbot Content</h2>
          <DocumentAssist />
        </div>
      )}
    </div>
  );
}

export default App;