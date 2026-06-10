const { vectorStore } = require("../config/qdrant");

async function retrievalData(query, k) {
  try {
    const results = await vectorStore.similaritySearch(query, 5);

    return results;
  } catch (error) {
    console.error("Error during data retrieval:", error.message);
  }
}

// retrievalData();

module.exports = { retrievalData };
