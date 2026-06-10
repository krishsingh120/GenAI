const { QdrantVectorStore } = require("@langchain/qdrant");

const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
  url: QDRANT_URL,
  collectionName: "iiitn-chatbot",
});

module.exports = { vectorStore };
