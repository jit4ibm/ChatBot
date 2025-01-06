import { WikipediaTool } from "bee-agent-framework/tools/search/wikipedia";
import { SimilarityTool } from "bee-agent-framework/tools/similarity";
import { OllamaLLM } from "bee-agent-framework/adapters/ollama/llm";
import { cosineSimilarityMatrix } from "bee-agent-framework/internals/helpers/math";
import { splitString } from "bee-agent-framework/internals/helpers/string";
import { z } from "zod";

// Function to clean the query and generate the correct Wikipedia URL
function generateWikipediaURL(query) {
  // Define a list of prefixes to remove
  const prefixesToRemove = [
    "tell me about ",
    "tell me ",
    "overview of ",
    "short information on ",
    "short of ",
    "quick details of ",
    "what is ",
    "explain the ",
    "explain ",
    "summary of ",
    "summary on ",
    "details about ",
    "details on ",
    "details ",
    "info about ",
    "info on ",
    "info of ",
    "info ",
    "information about ",
    "information on ",
    "information of ",
    "information ",
  ];

  // Normalize query to trim spaces
  let normalizedQuery = query.trim();

  // Remove any prefix
  for (const prefix of prefixesToRemove) {
    if (normalizedQuery.toLowerCase().startsWith(prefix.toLowerCase())) {
      normalizedQuery = normalizedQuery.substring(prefix.length).trim();
      break;
    }
  }

  // Ensure the query is not empty after removing prefixes
  if (normalizedQuery === "") {
    throw new Error("Query is too vague after removing prefixes.");
  }

  // Capitalize each word except for certain conjunctions and prepositions
  const words = normalizedQuery.split(" ");
  const formattedQuery = words
    .map((word, index) => {
      if (word.toLowerCase() === "and" && index !== 0) {
        return word.toLowerCase(); // Keep "and" lowercase
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(); // Capitalize the rest
    })
    .join("_");

  // Generate the Wikipedia API URL
  return `https://en.wikipedia.org/api/rest_v1/page/summary/${formattedQuery}`;
}

export function createWikipediaRetrievalTool(passageSize, overlap, maxResults) {
  const embeddingLLM = new OllamaLLM({
    modelId: "nomic-embed-text",
  });

  const charsPerToken = 4;

  const similarity = new SimilarityTool({
    maxResults: maxResults,
    provider: async (input) => {
      const embeds = await embeddingLLM.embed([
        input.query,
        ...input.documents.map((doc) => doc.text),
      ]);
      const similarities = cosineSimilarityMatrix(
        [embeds.embeddings[0]],
        embeds.embeddings.slice(1)
      )[0];
      if (!similarities) {
        throw new Error("Missing similarities");
      }
      return similarities.map((score) => ({ score }));
    },
  });

  const wikipedia = new WikipediaTool();

  return wikipedia
    .extend(
      z.object({
        page: z
          .string()
          .describe("The Wikipedia page to search, e.g., 'New York'. This field is required.")
          .min(1)
          .max(128),
        query: z
          .string()
          .describe(
            "A specific search query to lookup within the Wikipedia page. Use a descriptive phrase or sentence. This field is required."
          ),
      }),
      (newInput) => ({ query: newInput.page })
    )
    .pipe(similarity, (input, output) => ({
      query: input.query,
      documents: output.results.flatMap((document) =>
        Array.from(
          splitString(document.fields.markdown, {
            size: passageSize * charsPerToken,
            overlap: overlap * charsPerToken,
          })
        ).map((chunk) => ({
          text: chunk,
        }))
      ),
    }));
}

export function wikipediaRetrivalTool(maxResults, timeout, retries = 3) {
  return {
    name: "wikipedia-retrieval",
    description: "Retrieve information from Wikipedia",
    execute: async (query) => {
      let attempt = 0;
      let response;

      while (attempt < retries) {
        try {
          // Generate the correct Wikipedia URL using the helper function
          const url = generateWikipediaURL(query);

          // Log the page name being queried for debugging purposes
          console.log(`Requesting Wikipedia URL: ${url}`);

          // Make the request
          response = await fetch(url, { timeout });

          if (!response.ok) {
            console.error(`Wikipedia retrieval failed: ${response.statusText}`);
            throw new Error(`Wikipedia retrieval failed: ${response.statusText}`);
          }

          const data = await response.json();
          return data.extract || "No relevant information found.";
        } catch (err) {
          attempt++;
          console.error(`Attempt ${attempt} failed: ${err.message}`);
          if (attempt >= retries) {
            throw new Error(`Failed after ${retries} attempts: ${err.message}`);
          }
        }
      }
    },
    parameters: { maxResults, retries },
  };
}