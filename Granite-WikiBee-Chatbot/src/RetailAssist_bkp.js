import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_URL } from "./config.js"; // Ensure to define your API_URL in config.js
import "./Metaverse.css";

// Utility to log messages to the backend server
const logToServer = async (message) => {
  console.log(message); // Log to browser console
  try {
    await axios.post(`${API_URL}/api/log`, { message }); // Adjust URL based on backend configuration
  } catch (error) {
    console.error("Error sending log to server:", error);
  }
};

const RetailAssist = () => {
  const [selectedFeature, setSelectedFeature] = useState("chat"); // Default feature
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(""); // Handle error states
  const chatEndRef = useRef(null);

  const featureModelMap = {
    chat: "granite3.1-dense:8b",
    recommendation: "granite3-guardian:8b",
    forecast: "granite3.1-moe:3b",
    inventory: "granite3.1-moe:1b",
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFeatureChange = (feature) => {
    setSelectedFeature(feature);
    logToServer(`Feature changed to: ${feature}`);
  };

  const sendMessage = async () => {
    if (!userInput.trim()) {
      setError("Please enter a valid query.");
      return;
    }

    // Add user's message to the chat
    setMessages((prev) => [...prev, { sender: "User", text: userInput }]);
    setIsLoading(true);
    setError("");

    const modelId = featureModelMap[selectedFeature];
    logToServer(`Sending message with Feature=${selectedFeature}, Model=${modelId}`);

    try {
      const response = await axios.post(`${API_URL}/api/chat`, {
        feature: selectedFeature,
        modelId,
        prompt: userInput,
      });

      const botMessage = response.data.reply || "No response received.";
      setMessages((prev) => [...prev, { sender: "Bot", text: botMessage }]);
    } catch (err) {
      const fallbackMessage = err.response?.data?.reply || "Error processing your request.";
      setMessages((prev) => [...prev, { sender: "Bot", text: fallbackMessage }]);
      setError("An error occurred while fetching data. Please try again later.");
    } finally {
      setIsLoading(false);
      setUserInput(""); // Clear input field
    }
  };

  return (
    <div className="metaverse-container">
      {/* Title */}
      <div className="metaverse-assistant-title">Retail Assistant</div>

      {/* Feature selection buttons */}
      <div className="button-container">
        <div className="button chat-button">
          <button onClick={() => handleFeatureChange("chat")}>Chat</button>
        </div>
        <div className="button forecast-button">
          <button onClick={() => handleFeatureChange("forecast")}>Forecast</button>
        </div>
        <div className="button inventory-button">
          <button onClick={() => handleFeatureChange("inventory")}>Inventory</button>
        </div>
        <div className="button recommendation-button">
          <button onClick={() => handleFeatureChange("recommendation")}>Recommendations</button>
        </div>
      </div>

      {/* Display messages */}
      <div className="chat-body">
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-message ${msg.sender.toLowerCase()}`}>
            <strong>{msg.sender}:</strong> {msg.text}
          </div>
        ))}

        {/* Loading state */}
        {isLoading && <div className="loading-message">Loading...</div>}

        {/* Error state */}
        {error && <div className="error-message">{error}</div>}

        {/* Scroll to bottom of chat */}
        <div ref={chatEndRef}></div>
      </div>

      {/* Input and Send button */}
      <div className="chat-input-area">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Type your query here ..."
        />
        <button onClick={sendMessage} disabled={isLoading}>
          {isLoading ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
};

export default RetailAssist;