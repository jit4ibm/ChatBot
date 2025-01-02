import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_URL } from "./config.js";  // Assume your API URL is stored in a config file
import "./Metaverse.css";

const RetailAssist = () => {
  const [selectedFeature, setSelectedFeature] = useState("summary"); // Default feature set to "summary"
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Default model ID for summary, other features can be added if needed
  const defaultModelId = "granite3.1-dense:2b"; // Default model ID for the "summary" feature
  
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    // Prevent empty input from being sent
    if (!userInput.trim()) {
      setMessages((prev) => [
        ...prev,
        { sender: "Bot", text: "Please enter a valid query/prompt." },
      ]);
      return;
    }

    // Use the default model ID if no feature is selected
    const modelId = defaultModelId; // Using a single default modelId here

    setMessages((prev) => [...prev, { sender: "User", text: userInput }]);
    setIsLoading(true);

    try {
      // Send request to API
      const response = await axios.post(API_URL, {
        feature: selectedFeature,
        modelId,
        prompt: userInput,
      });

      // Get the bot's response or a fallback message if the response is empty
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
      setUserInput(""); // Reset input field after message is sent
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
        <div className="button chat-button">
          <button onClick={() => setSelectedFeature("chat")}>Chat</button>
        </div>
        <div className="button forecast-button">
          <button onClick={() => setSelectedFeature("forecast")}>Forecast</button>
        </div>
        <div className="button inventory-button">
          <button onClick={() => setSelectedFeature("inventory")}>Inventory</button>
        </div>
        <div className="button recommendation-button">
          <button onClick={() => setSelectedFeature("recommendation")}>
          Recommendations
          </button>
        </div>
      </div>

      <div> {/* Add buttons in the UI */ } </div>
      <div className="button-container">
        <button onClick={clearChat}>Clear Chat</button>
        <button onClick={exportChat}>Export Chat</button>
      </div>

      <div className="chat-body">
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-message ${msg.sender.toLowerCase()}`}>
            <strong>{msg.sender}:</strong> {msg.text}
          </div>
        ))}
        {isLoading && <div>Loading...</div>}
        <div ref={chatEndRef}></div>
      </div>
      <div className="chat-input-area">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Type your query..."
        />
        <button onClick={sendMessage} disabled={isLoading}>
          {isLoading ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
};

export default RetailAssist;