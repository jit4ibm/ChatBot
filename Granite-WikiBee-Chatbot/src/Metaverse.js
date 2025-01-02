import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_URL } from "./config.js";
import "./Metaverse.css";


const Metaverse = () => {
  const [selectedFeature, setSelectedFeature] = useState("chat"); // Default feature
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!userInput.trim()) return;

    setMessages((prev) => [...prev, { sender: "User", text: userInput }]);
    setIsLoading(true);

    try {
      const response = await axios.post(API_URL, {
        feature: selectedFeature,
        prompt: userInput,
      });
      const botMessage = response.data.reply || "No response received.";
      setMessages((prev) => [...prev, { sender: "Bot", text: botMessage }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: "Bot", text: "Error processing your request." },
      ]);
    } finally {
      setIsLoading(false);
      setUserInput("");
    }
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

export default Metaverse;