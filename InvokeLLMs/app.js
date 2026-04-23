import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

// console.log(process.env.GROQ_API_KEY);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const systemPrompt = `You are Jarvis, a smart review grader. Your task is to analyse given review and return the sentiment. Classify the review as positive, neutral or negative. You must return in valid JSON structure.
          example: {"Sentiment": Positive}
          `;

const userPrompt = `Review: These headphones arrived quickly and look great, but the left earcup stopped working after a week.
         Sentiment: `;

async function main() {
  const response = await groq.chat.completions.create({
    temperature: 1,
    // top_p: 0.2, // alternative to temp
    // stop: "11", // set string on the basis of string invoking llm stop.
    // max_completion_tokens: 1000, // use for limiting pricing.
    // frequency_penalty: 1,  // used for to give penalty to llm models for using negative words.
    // presence_penalty: 1, // used for generating new or diverse words.

    response_format: { type: "json_object" }, // used for structured output

    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ],
  });

  const output = response.choices[0].message?.content;

  console.log("Reply: ", JSON.parse(output));
}

/**
 * Ways to generate structured output
 * 1. add example in prompt.
 * 2. set parameter -> response_format: { type: "json_object" },
 * 3. use instructor/ai library.
 * 4. latest method -> type json_schema
 */

main();
