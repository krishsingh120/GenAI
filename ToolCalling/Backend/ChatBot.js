import Groq from "groq-sdk";
import dotenv from "dotenv";
import { tavily } from "@tavily/core";
import NodeCache from "@cacheable/node-cache";

dotenv.config();

/**
 * Flow:
 * User → LLM → Tool → LLM → Final Answer
 */

const NodeCacheOptions = {
  stdTTL: 60 * 60 * 24, // 24 hours
};

const tvly = tavily({
  apiKey: process.env.TAVILY_API_KEY,
});

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const cache = new NodeCache(NodeCacheOptions);

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

/**
 * TOOL
 */
async function webSearch({ query }) {
  console.log("🔍 Web search calling...");

  try {
    const response = await tvly.search(query);

    if (!response?.results?.length) {
      return "No results found.";
    }

    return response.results.map((r) => r.content).join("\n\n");
  } catch (err) {
    console.error("Tavily Error:", err);

    return "Failed to fetch real-time data.";
  }
}

/**
 * MAIN GENERATE FUNCTION
 */
export async function generate(userPrompt, threadId) {
  /**
   * STEP 1:
   * Load previous messages from cache
   */

  let messages = await cache.get(threadId);

  /**
   * If no cache exists,
   * initialize conversation
   */

  if (!messages) {
    messages = [
      {
        role: "system",
        content: systemPrompt,
      },
    ];
  }

  /**
   * STEP 2:
   * Add latest user message
   */

  messages.push({
    role: "user",
    content: userPrompt,
  });

  const MAX_RETRIES = 10;
  const count = 0;

  while (true) {
    /**
     * STEP 2:
     * Preventing infinite loop
     */

    if (count > MAX_RETRIES) {
      return "I could not find the result, please try again.";
    }

    count++;

    /**
     * STEP 3:
     * Send conversation to LLM
     */

    const response = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",

      messages,

      tools: [
        {
          type: "function",

          function: {
            name: "webSearch",

            description: "Search latest information from internet",

            parameters: {
              type: "object",

              properties: {
                query: {
                  type: "string",
                },
              },

              required: ["query"],
            },
          },
        },
      ],

      tool_choice: "auto",
    });

    const message = response.choices[0].message;

    /**
     * STEP 4:
     * Save assistant/tool-call response
     */

    messages.push(message);

    const toolCalls = message.tool_calls;

    /**
     * STEP 5:
     * If no tool needed,
     * save conversation and return answer
     */

    if (!toolCalls || toolCalls.length === 0) {
      await cache.set(threadId, messages);

      console.log("✅ Cache updated");

      return message.content;
    }

    /**
     * STEP 6:
     * Execute tool calls
     */

    for (const tool of toolCalls) {
      const functionName = tool.function.name;

      let args;

      try {
        args = JSON.parse(tool.function.arguments);
      } catch (err) {
        console.error(`JSON parse error for ${functionName}:`, err);

        continue;
      }

      /**
       * WEB SEARCH TOOL
       */

      if (functionName === "webSearch") {
        const result = await webSearch(args);

        messages.push({
          role: "tool",

          tool_call_id: tool.id,

          content: result,
        });
      }
    }
  }
}
