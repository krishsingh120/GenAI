const { chunkDocuments } = require("./chunkDocuments");
const { vectorStore } = require("../config/qdrant");

/**
 * flow :
 *   scrap data -> load data -> clean data -> chunk data -> generate embeddings -> upsert to Pinecone
 */

async function ingestion() {
  try {
    const chunks = await chunkDocuments();
    console.log("Total chunks:", chunks.length);


    // add data into the vector DB
    await vectorStore.addDocuments(documents);

    console.log("🎉 All chunks ingested successfully!");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

ingestion();
