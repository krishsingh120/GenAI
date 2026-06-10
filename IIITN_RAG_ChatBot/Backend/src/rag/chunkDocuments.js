const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
const { loadJSON } = require("./loadDocuments");
const { cleanDocuments } = require("./cleanDocuments");
const path = require("path");
const { chunkedData } = require("../config/saveChunkedData");

const filePath = path.join(process.cwd(), "data", "raw", "knowledge.json");
const storeChunkedDataFilePath = path.join(
  process.cwd(),
  "data",
  "processed",
  "chunks.json",
);

async function chunkDocuments() {
  try {
    // loadDocuments
    const rawData = loadJSON(filePath);

    // Clean documents
    const docs = cleanDocuments(rawData);

    // console.log("data after cleaning: ", docs);

    // Initialize the splitter
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200, // Helps maintain context between chunks
    });

    // Split a list of documents
    const chunks = await splitter.splitDocuments(docs);

    // save chunked data
    await chunkedData(storeChunkedDataFilePath, chunks);

    // console.log(chunks.length);
    // console.log(chunks[0]);

    return chunks;
  } catch (err) {
    console.error("Error during text Chunking", err);
  }
}

module.exports = { chunkDocuments };
