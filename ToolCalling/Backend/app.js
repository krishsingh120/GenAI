import readline from "node:readline/promises";
import Groq from "groq-sdk";
import dotenv from "dotenv";
import { tavily } from "@tavily/core";

dotenv.config();

/**
 * Flow:
 * User → LLM → Tool → LLM → Final Answer
 */

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const systemPrompt = `You are a smart assistant. You can use tools if needed.
Available tool:
- webSearch({query}) : Search latest info from internet
current Date and Time: ${new Date().toUTCString()}
`;

const userPrompt = `What is the current weather in Nagpur?`;

// ✅ Defined before use — cleaner and avoids any hoisting confusion
async function webSearch({ query }) {
  console.log("Web search Calling....");
  const response = await tvly.search(query);

  // ✅ Guard against undefined results
  if (!response?.results?.length) {
    return "No results found.";
  }

  return response.results.map((r) => r.content).join("\n\n");
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const messages = [
    { role: "system", content: systemPrompt },
    // { role: "user", content: userPrompt },
  ];

  while (true) {
    const question = await rl.question("You: ");

    if (question == "quit") {
      break;
    }

    messages.push({
      role: "user",
      content: question,
    });

    while (true) {
      // Step 1: LLM decides tool or not
      const response1 = await groq.chat.completions.create({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages,
        tools: [
          {
            type: "function",
            function: {
              name: "webSearch",
              description: "Search latest info from internet",
              parameters: {
                type: "object",
                properties: {
                  query: { type: "string" },
                },
                required: ["query"],
              },
            },
          },
        ],
        tool_choice: "auto",
      });

      const message = response1.choices[0].message;
      messages.push(message);

      const toolCalls = message.tool_calls;

      // Handle both undefined and empty array (some models return [])
      if (!toolCalls || toolCalls.length === 0) {
        console.log("Assistant:", message.content);
        break;
      }

      // Step 2: Execute tools
      for (const tool of toolCalls) {
        const functionName = tool.function.name;

        // Wrap JSON.parse in try/catch — malformed args won't crash the app
        let args;
        try {
          args = JSON.parse(tool.function.arguments);
        } catch (e) {
          console.error(
            `Failed to parse arguments for tool "${functionName}":`,
            e,
          );
          continue;
        }

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

  // console.log("Final Answer:\n", response2.choices[0].message.content);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
