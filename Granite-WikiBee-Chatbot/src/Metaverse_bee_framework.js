import express from "express";
import cors from "cors";
import { createWikipediaRetrievalTool, wikipediaRetrivalTool } from "./helpers/wikipediaTool.js";
import { BeeAgent } from "bee-agent-framework/agents/bee/agent";
import { OllamaChatLLM } from "bee-agent-framework/adapters/ollama/chat";
import { TokenMemory } from "bee-agent-framework/memory/tokenMemory";

const app = express();
app.use(express.json());
app.use(cors()); // Enable cross-origin requests

// Initialize the Wikipedia tools
const advancedWikipediaTool = createWikipediaRetrievalTool(400, 50, 3);
const basicWikipediaTool = wikipediaRetrivalTool(3, 5000, 2);

// Initialize LLM and agent for advanced Wikipedia tool
const llm = new OllamaChatLLM({
  modelId: "granite3.1-dense:8b",
  parameters: {
    temperature: 0,
    num_predict: 2048,
  },
});

const agent = new BeeAgent({
  llm,
  memory: new TokenMemory({ llm }),
  tools: [advancedWikipediaTool],
});

// Helper function to determine tool type
function isBasicPrompt(prompt) {
  const basicKeywords = ["summary", "short", "quick"]; // Define basic keywords
  return basicKeywords.some((keyword) => prompt.toLowerCase().includes(keyword));
}

// Unified API endpoint for Wikipedia retrieval and additional features
app.post("/api/chat", async (req, res) => {
  const { prompt, feature } = req.body;

  if (!prompt || typeof prompt !== "string") {
    return res
      .status(400)
      .json({ error: "Invalid input. 'prompt' is required and must be a string." });
  }

  try {
    let result;

    switch (feature) {
      case "forecast":
        result = await getSalesForecast(prompt);
        break;
      case "inventory":
        result = await checkInventory(prompt);
        break;
      case "recommendation":
        result = await getProductRecommendations(prompt);
        break;
      default:
        if (isBasicPrompt(prompt)) {
          try {
            result = await basicWikipediaTool.execute(prompt);
          } catch (error) {
            console.error("Error with basicWikipediaTool:", error);
            result = "Sorry, I couldn't fetch a summary at the moment.";
          }
        } else {
          try {
            const response = await agent.run(
              { prompt },
              {
                execution: {
                  maxIterations: 8,
                  maxRetriesPerStep: 3,
                  totalMaxRetries: 3,
                },
              }
            );
            result = response?.result?.text || "Sorry, no valid response from the agent.";
          } catch (error) {
            console.error("Error with advanced tool or agent:", error);
            result = "An error occurred while processing your request. Please try again.";
          }
        }
        break;
    }

    res.json({ reply: result });
  } catch (error) {
    console.error("Error in processing:", error);
    res.status(500).json({ error: "An error occurred while processing your request." });
  }
});

// Forecasting Logic
const getSalesForecast = async (query) => {
  console.log("Generating sales forecast for query:", query);
  // Simulated forecasting logic
  const data = {
    query,
    forecast: [
      { date: "2025-01-01", sales: 500 },
      { date: "2025-01-02", sales: 520 },
      { date: "2025-01-03", sales: 530 },
      { date: "2025-01-04", sales: 400 },
      { date: "2025-01-05", sales: 830 },
      { date: "2025-01-06", sales: 630 },
      { date: "2025-01-07", sales: 930 },
    ],
  };
  return `Sales Forecast for '${query}': ${JSON.stringify(data.forecast)}`;
};

// Inventory Database Lookup
const checkInventory = async (query) => {
  console.log("Checking inventory for query:", query);
  // Simulated inventory lookup
  const inventoryData = [
    { product: "Garments", stock: 200 },
    { product: "Electronics", stock: 50 },
    { product: "Consumer Product", stock: 0 },
  ];
  const filtered = inventoryData.filter((item) =>
    item.product.toLowerCase().includes(query.toLowerCase())
  );
  return filtered.length
    ? `Inventory Details for '${query}': ${JSON.stringify(filtered)}`
    : `No inventory found for '${query}'.`;
};

// Recommendation Engine Logic
const getProductRecommendations = async (query) => {
  console.log("Generating product recommendations for query:", query);
  // Simulated recommendation logic
  const recommendations = [
    { product: "Allen Solly", score: 9.5 },
    { product: "Sony", score: 8.8 },
    { product: "Godrej", score: 8.3 },
  ];
  return `Recommended products for '${query}': ${JSON.stringify(recommendations)}`;
};

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Metaverse server running at http://localhost:${PORT}`);
});