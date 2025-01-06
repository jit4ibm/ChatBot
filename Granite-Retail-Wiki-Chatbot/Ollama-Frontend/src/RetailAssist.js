import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_URL } from "./config.js";
import "./Metaverse.css";

const RetailAssist = () => {
  const [selectedFeature, setSelectedFeature] = useState("chat"); // Default feature
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(""); // Track error messages
  const chatEndRef = useRef(null);

  // Map features to model IDs
  const featureModelMap = {
    chat: "granite3.1-dense:8b",
    recommendation: "granite3-guardian:8b",
    forecast: "granite3.1-moe:3b",
    inventory: "granite3.1-moe:1b",
    default: "granite3.1-dense:2b",
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  const sendMessage = async () => {
    // Check if the user input is just a space
    if (!userInput.trim()) {
      setErrorMessage("Input cannot be empty or just spaces.");                  // Set the error message
      setMessages((prev) => [
        ...prev,
        { sender: "Bot", text: "Error: Input cannot be empty or just spaces." },
      ]);
      return;
    }

    // Clear error message if input is valid
    setErrorMessage("");
  
    const modelId = featureModelMap[selectedFeature];
    if (!modelId) {
      setMessages((prev) => [
        ...prev,
        { sender: "Bot", text: "Invalid feature selected. Please try again." },
      ]);
      return;
    }
  
    setMessages((prev) => [...prev, { sender: "User", text: userInput }]);
    setIsLoading(true);
  
    try {
      const response = await axios.post(API_URL, {
        feature: selectedFeature,
        modelId,
        prompt: userInput,
      });
  
      const botMessage = response.data.reply || "No response received.";
      setMessages((prev) => [...prev, { sender: "Bot", text: botMessage }]);
    } catch (err) {
      console.error("Error sending message:", err);
      const errorMessage = err.response?.data?.message || "Error processing your request.";
      setMessages((prev) => [
        ...prev,
        { sender: "Bot", text: errorMessage },
      ]);
    } finally {
      setIsLoading(false);
      setUserInput("");
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const exportChat = () => {
    const chatData = messages.map((msg) => `${msg.sender}: ${msg.text}`).join("\n");
    const blob = new Blob([chatData], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "chat_history.txt";
    link.click();
  };

  return (
    <div className="metaverse-container">
      <div className="metaverse-assistant-title">Retail Assistant</div>
  
      <div className="button-container">
        <div className="shared-button chat-button">
          <button onClick={() => setSelectedFeature("chat")}>CHAT</button>
        </div>
        <div className="shared-button forecast-button">
          <button onClick={() => setSelectedFeature("forecast")}>FORECAST</button>
        </div>
        <div className="shared-button inventory-button">
          <button onClick={() => setSelectedFeature("inventory")}>INVENTORY</button>
        </div>
        <div className="shared-button recommendation-button">
          <button onClick={() => setSelectedFeature("recommendation")}>
            RECOMMEND
          </button>
        </div>
      </div>
  
      {errorMessage && (
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <div className="error-message">{errorMessage}</div>
        </div>
      )}
  
      <div className="chat-body">
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-message ${msg.sender.toLowerCase()}`}>
            <strong>{msg.sender}:</strong> {msg.text}
          </div>
        ))}
        {isLoading && <div className="loading-message">Loading...</div>}
        <div ref={chatEndRef}></div>
      </div>
  
      <div className="chat-input-container">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Type your message here..."
          className="chat-input"
        />
        <button className="send-button" onClick={sendMessage} disabled={isLoading}>
          {isLoading ? "Sending..." : "Send"}
        </button>
      </div>
  
      <div className="clear-export-container">
        <button className="clear-button" onClick={clearChat}>
          Clear Chat
        </button>
        <button className="export-button" onClick={exportChat}>
          Export Chat
        </button>
      </div>
    </div>
  );  
};

export default RetailAssist;