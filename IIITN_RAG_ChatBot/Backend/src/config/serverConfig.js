const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  PORT: process.env.PORT,
  QDRANT_URL: process.env.QDRANT_URL,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  PINECONE_API_KEY: process.env.PINECONE_API_KEY,
  PINECONE_INDEX: process.env.PINECONE_INDEX,

  GROQ_API_KEY: process.env.GROQ_API_KEY,
  TAVILY_API_KEY: process.env.TAVILY_API_KEY,
  DEBUG: process.env.DEBUG,
};
