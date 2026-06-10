const { PineconeStore } = require("@langchain/pinecone");
const { Pinecone } = require("@pinecone-database/pinecone");
const { PINECONE_API_KEY, PINECONE_INDEX } = require("./serverConfig");
const { embeddings } = require("../rag/createEmbeddings");

const pineconeClient = new Pinecone({
  apiKey: PINECONE_API_KEY, // ✅ direct import
});

const pineconeIndex = pineconeClient.Index(PINECONE_INDEX);

async function vectorEmbeddingsStore() {
  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex,
    maxConcurrency: 5,
  });

  return vectorStore; // ✅ return karna zaroori
}

module.exports = { vectorEmbeddingsStore };
