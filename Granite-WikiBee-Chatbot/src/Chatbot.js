import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_URL } from "./config.js";
import "./Chatbot.css";

const Chatbot = () => {
  const [selectedModel, setSelectedModel] = useState("granite3.1-dense:8b"); // Default model
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Function to send message and interact with the bot
  const sendMessage = async () => {
    if (!userInput.trim()) {
      setError("Message cannot be empty.");
      return;
    }

    setError(null);
    setIsLoading(true);

    // Add user's message to the chat
    setMessages((prev) => [...prev, { sender: "User", text: userInput }]);

    try {
      const response = await axios.post(API_URL, { prompt: userInput }, {
        timeout: 100000, // Timeout set to 100 seconds
      });

      const botMessage = response.data.reply || "No response received.";
      setMessages((prev) => [...prev, { sender: "Bot", text: botMessage }]);
    } catch (err) {
      console.error("Error in API call:", err);

      // Handling specific error types
      let errorMessage = "Error: Unable to fetch response.";
      if (err.response) {
        // Server responded with an error
        errorMessage = err.response?.data?.error || "Server error.";
      } else if (err.request) {
        // No response from server
        errorMessage = "No response from the server. Please try again later.";
      } else if (err.code === 'ECONNABORTED') {
        // Request timeout
        errorMessage = "Request timed out. Please try again.";
      } else {
        // Network or other errors
        errorMessage = "Network error. Please check your connection.";
      }

      // Add the error message to chat
      setMessages((prev) => [...prev, { sender: "Bot", text: errorMessage }]);
    } finally {
      setIsLoading(false);
      setUserInput("");
    }
  };

  return (
    <div className="chatbot-container">
      <h1 className="chat-header">Granite WikiBee Chatbot</h1>
      <div className="model-selector">
        <label htmlFor="modelSelect" style={{ fontWeight: "bold", marginRight: "10px" }}>
          Select Model:
        </label>
      <select
      id="modelSelect"
      className="model-dropdown"
      value={selectedModel}
      onChange={(e) => setSelectedModel(e.target.value)}
    >
      <option value="granite3.1-dense:8b">Granite 3.1 Dense:8b (Default)</option>
      <option value="granite3.1-dense:2b">Granite 3.1 Dense:2b</option>
      <option value="granite3.1-moe:3b">Granite 3.1 MOE:3b</option>
      <option value="granite3.1-moe:1b">Granite 3.1 MOE:1b</option>
      <option value="granite3-guardian:8b">Granite 3.0 Guardian:8b</option>
      <option value="granite3-guardian:2b">Granite 3.0 Guardian:2b</option>
      <option value="llama3.1:latest">LLAMA 3.1:Latest</option>
      <option value="phi3:latest">PHI 3:latest</option>
      <option value="basic-wiki">Basic Wiki Search</option>
      
      {/* Add more options as needed */}
    </select>
  </div>
      <div className="chat-body">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`chat-message ${msg.sender.toLowerCase()}`}
          >
            <div className={`chat-bubble ${msg.sender.toLowerCase()}`}>
              <strong>{msg.sender}:</strong> {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="chat-message bot">
            <div className="chat-bubble bot">Bot is typing...</div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {error && <div style={{ color: "red", textAlign: "center" }}>{error}</div>}

      <div className="chat-input-area">
        <input
          type="text"
          className="chat-input"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <button
          className="chat-button"
          onClick={sendMessage}
          disabled={isLoading}
        >
          {isLoading ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
};

export default Chatbot;