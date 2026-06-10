const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
const { GEMINI_API_KEY } = require("../config/serverConfig.js");

const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-2",
  apiKey: process.env.GEMINI_API_KEY,
});

async function test() {
  const vector = await embeddings.embedQuery("Hello World");

  console.log(vector.length);
  console.log(vector);
}

// test();

module.exports = { embeddings };
