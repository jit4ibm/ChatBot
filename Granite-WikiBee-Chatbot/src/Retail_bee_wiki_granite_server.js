import express from "express";
import cors from "cors";
import { wikipediaRetrivalTool } from "./helpers/wikipediaTool.js";
import { BeeAgent } from "bee-agent-framework/agents/bee/agent";
import { OllamaChatLLM } from "bee-agent-framework/adapters/ollama/chat";
import { TokenMemory } from "bee-agent-framework/memory/tokenMemory";

// Create an Express app
const app = express();
app.use(express.json());
app.use(cors());

// Initialize the Wikipedia tool
const basicWikipediaTool = wikipediaRetrivalTool(3, 5000, 2);

// Cache for initialized LLMs
let llmCache = {};

// Initialize the LLM
const initializeLLM = (modelId) => {
  if (!llmCache[modelId]) {
    llmCache[modelId] = new OllamaChatLLM({
      modelId,
      parameters: {
        temperature: 0,
        num_predict: 2048,
      },
    });
  }
  return llmCache[modelId];
};

// Check if the prompt is basic
const isBasicPrompt = (prompt) => {
  const basicKeywords = ["summary", "short", "quick", "tell me"];
  return basicKeywords.some((keyword) => prompt.toLowerCase().includes(keyword));
};

// Initialize the BeeAgent
const initializeAgent = (llm) => {
  return new BeeAgent({
    llm,
    memory: new TokenMemory({ llm }),
    tools: [], // Add tools if required
  });
};

// Retry logic for agent execution
const runWithRetry = async (agent, prompt, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await agent.run({ prompt });
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      if (attempt === retries) throw error;
    }
  }
};

// Generate fallback demo data
const generateDemoData = (feature) => {
  switch (feature) {
    case "forecast":
      return `Sales Forecast for the next week:\n` +
        [
          { date: "2025-01-01", sales: 500, growth: 2.5, comment: "New Year's Day sales spike." },
          { date: "2025-01-02", sales: 520, growth: 4.0, comment: "Post-New Year sale period." },
          { date: "2025-01-03", sales: 530, growth: 3.0, comment: "Continued sale." },
          { date: "2025-01-04", sales: 400, growth: -5.0, comment: "Slower sales post-holiday." },
          { date: "2025-01-05", sales: 830, growth: 10.0, comment: "Weekend sales." },
        ]
          .map(({ date, sales, growth, comment }) => 
            `Date: ${date.padEnd(12)} | Sales: ${String(sales).padEnd(8)} units | Growth: ${growth.toFixed(1).padEnd(4)}% | Comment: ${comment}`
          ).join("\n");

    case "inventory":
      return `Inventory Details:\n` +
        "-----------------------------------------------------------\n" +
        "| Product             | Stock       | Unit    | Restock Due   |\n" +
        "-----------------------------------------------------------\n" +
        "| Garments            | 200         | pieces  | 2025-01-10    |\n" +
        "| Electronics          | 50          | items   | 2025-01-12    |\n" +
        "| Consumer Product     | 10          | items   | 2025-01-15    |\n" +
        "-----------------------------------------------------------";

    case "recommendation":
      return `Recommended Products:\n` +
        "--------------------------------------------------------------\n" +
        "| Product              | Category       | Rating   | Price    |\n" +
        "--------------------------------------------------------------\n" +
        "| Allen Solly Shirts   | Apparel        | 9.5/10   | $30      |\n" +
        "| Sony TV              | Electronics    | 8.8/10   | $500     |\n" +
        "| Godrej Refrigerator  | Appliances     | 9.3/10   | $600     |\n" +
        "--------------------------------------------------------------";

    case "chat":
      return "Hello! I'm just a program, but I'm doing great. How can I assist you today?";

    default:
      return "Sorry, no data available. Please try again later.";
  }
};

// API endpoint
app.post("/api/chat", async (req, res) => {
  const { feature, modelId, prompt } = req.body;

  if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
    return res.status(400).json({ error: "'prompt' is required and must not be blank." });
  }

  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({ error: "Request Timeout. The operation took too long." });
    }
  }, 100000); // Timeout of 100 seconds

  try {

    let responseText;

    // Handle simpler prompts (such as summary)
    if (isBasicPrompt(prompt)) {
      // Using Wikipedia tool to retrieve summary based on the query
      // feature :  "summary"
      // modelId : "basic-wiki"
      // console.log(`Request received: Feature=${feature}, ModelId=${modelId}, Prompt=${prompt}`);
      const toolResponse = await basicWikipediaTool.execute(prompt);
      //console.log("Tool Response:", toolResponse);

      // Check if result exists and extract the correct field (adjust based on response structure)
      responseText = toolResponse || "No summary available for this prompt.";
      //responseText = toolResponse?.result || "No summary available for this topic of your query.";

    } else {
      // Handle more complex prompts using LLM and Agent
      console.log(`Request received: Feature=${feature}, ModelId=${modelId}, Prompt=${prompt}`);
      const llm = initializeLLM(modelId);
      const agent = initializeAgent(llm);
      const agentResponse = await runWithRetry(agent, prompt);
      responseText = agentResponse?.result?.text || generateDemoData(feature);
    }

    clearTimeout(timeout);

    console.log(`Response: ${responseText}`);
    res.json({ reply: responseText });

  } catch (error) {
    console.error("Error processing request:", error);
    clearTimeout(timeout);
    const fallback = generateDemoData(feature || "default");
    res.status(500).json({ reply: fallback });
  }
});

// Start the server
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});