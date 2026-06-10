const readline = require("node:readline/promises");
const Groq = require("groq-sdk");
const { tavily } = require("@tavily/core");
const NodeCache = require("@cacheable/node-cache");

const { TAVILY_API_KEY, GROQ_API_KEY } = require("../config/serverConfig");
const { retrievalData } = require("../rag/retrieval");

/**
 *
 * Flow:
 *
 *
 *
 *
 */

const NodeCacheOptions = {
  stdTTL: 60 * 60 * 24, // 24 hours
};

const tvly = tavily({
  apiKey: TAVILY_API_KEY,
});

const groq = new Groq({
  apiKey: GROQ_API_KEY,
});

// const cache = new NodeCache(NodeCacheOptions);

const systemPrompt = `
You are a smart personal assistant.

If you know the answer to a question,
answer it directly in plain English.

If the answer requires real-time,
local, or up-to-date information,
use the available tools.

Available tool:
- webSearch(query: string)

Do not mention tools unless needed.

Current date and time:
${new Date().toUTCString()}
`;

async function chat() {
  try {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    while (true) {
      const question = await rl.question("You: ");

      if (question == "quit") {
        break;
      }

      console.log(question);

      // retrieval step
      let topResults = 5;
      const relevantChunks = retrievalData(question, topResults);

      const context = relevantChunks
        .map((chunk) => chunk.pageContent)
        .join("\n\n");

      // prepare final user prompt
      const userPrompt = `Question: ${question} 

      Relevant Context: ${context}

      Answer: 
      `;

      const completion = await groq.chat.completions.create({
        messages: [
          // Set an optional system message. This sets the behavior of the
          // assistant and can be used to provide specific instructions for
          // how it should behave throughout the conversation.
          {
            role: "system",
            content: systemPrompt,
          },
          // Set a user message for the assistant to respond to.
          {
            role: "user",
            content: userPrompt,
          },
        ],
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
      });

      console.log(completion.choices[0].message.content);
    }

    rl.close();
  } catch (error) {
    console.error("Error during chat: ", error.message);
  }
}

chat();

module.exports = { chat };
