const { chunkDocuments } = require("./chunkDocuments");

/**
 * flow :
 *   scrap data -> load data -> clean data -> chunk data -> generate embeddings -> upsert to Pinecone
 */

async function ingestion() {
  try {
    // Step 1: Chunk karo
    const chunks = await chunkDocuments();
    console.log("Total chunks:", chunks.length);

    // Validate chunk contents
    const validChunks = chunks.filter(
      (chunk) => chunk.pageContent && chunk.pageContent.trim().length > 0,
    );
    console.log("Valid chunks (non-empty):", validChunks.length);
    console.log("Invalid chunks:", chunks.length - validChunks.length);

    if (validChunks.length === 0) {
      console.error("❌ No valid chunks to store!");
      return;
    }

    // Step 2: Connect to Pinecone directly
    const { Pinecone } = require("@pinecone-database/pinecone");
    const {
      PINECONE_API_KEY,
      PINECONE_INDEX,
    } = require("../config/serverConfig");
    const { embeddings } = require("./createEmbeddings");

    const pineconeClient = new Pinecone({
      apiKey: PINECONE_API_KEY,
    });

    // Try getting index with namespace
    const index = pineconeClient.Index(PINECONE_INDEX, "");
    console.log("✅ Pinecone index connected");
    console.log("Index name:", PINECONE_INDEX);

    // Step 3: Test with just 1 chunk first
    const testChunk = validChunks[0];
    console.log("\n📌 Testing with 1 chunk first...");
    console.log("Generating embedding for test chunk...");

    const vector = await embeddings.embedQuery(testChunk.pageContent);
    console.log("✅ Embedding generated, dimensions:", vector.length);

    // Create record for Pinecone
    const record = {
      id: `chunk_${Date.now()}_0`,
      values: vector,
      metadata: {
        source: testChunk.metadata?.url || "unknown",
        title: testChunk.metadata?.title || "unknown",
      },
    };

    console.log("Record to be upserted:");
    console.log("  - ID:", record.id);
    console.log("  - Values length:", record.values.length);
    console.log("  - Values type:", typeof record.values);
    console.log("  - Values is array:", Array.isArray(record.values));
    console.log("  - First 5 values:", record.values.slice(0, 5));
    console.log("  - Metadata:", JSON.stringify(record.metadata));

    console.log("\nAttempting upsert with array wrapper...");
    const recordsToUpsert = [record];
    console.log("Array to upsert:");
    console.log("  - Length:", recordsToUpsert.length);
    console.log("  - Record[0] keys:", Object.keys(recordsToUpsert[0]));
    console.log(
      "  - Full record JSON:",
      JSON.stringify(recordsToUpsert[0], null, 2),
    );

    try {
      // First try: minimal record without metadata
      console.log("\n🔹 Test 1: Minimal record (id + values only)...");
      const minimalRecord = {
        id: `chunk_test_${Date.now()}`,
        values: vector,
      };

      console.log("Minimal record:", {
        id: minimalRecord.id,
        valuesLength: minimalRecord.values.length,
        keys: Object.keys(minimalRecord),
      });

      await index.upsert([minimalRecord]);
      console.log("✅ Minimal record upserted successfully!");
    } catch (minimalError) {
      console.error("❌ Minimal upsert failed:", minimalError.message);
      console.error("Full error:", minimalError);

      // Second try: with metadata
      console.log("\n🔹 Test 2: Record with metadata...");
      try {
        const upsertResponse = await index.upsert([record], {
          namespace: "",
        });
        console.log("✅ Record with metadata upserted successfully!");
        console.log("Response:", upsertResponse);
      } catch (metadataError) {
        console.error("❌ Metadata record also failed:", metadataError.message);
        throw metadataError;
      }
    }

    // Step 4: If test successful, process more chunks
    console.log("\n📌 Processing more chunks in batches...");
    const batchSize = 100;
    const chunkBatches = [];

    for (let i = 0; i < validChunks.length; i += batchSize) {
      chunkBatches.push(validChunks.slice(i, i + batchSize));
    }

    console.log(
      `Will process ${chunkBatches.length} batches of ${batchSize} chunks`,
    );

    for (let batchIndex = 0; batchIndex < chunkBatches.length; batchIndex++) {
      const batch = chunkBatches[batchIndex];
      console.log(
        `\nProcessing batch ${batchIndex + 1}/${chunkBatches.length} (${batch.length} chunks)...`,
      );

      // Generate embeddings for all chunks in batch
      const vectors = [];
      for (let i = 0; i < batch.length; i++) {
        const chunk = batch[i];
        const vec = await embeddings.embedQuery(chunk.pageContent);

        vectors.push({
          id: `chunk_${Date.now()}_${batchIndex}_${i}`,
          values: vec,
          metadata: {
            url: chunk.metadata?.url || "unknown",
            title: chunk.metadata?.title || "unknown",
            content_preview: chunk.pageContent.substring(0, 200),
          },
        });

        if ((i + 1) % 10 === 0) {
          console.log(`  - Generated ${i + 1}/${batch.length} embeddings`);
        }
      }

      // Upsert batch
      console.log(`Upserting ${vectors.length} vectors to Pinecone...`);
      try {
        await index.upsert(vectors);
        console.log(`✅ Batch ${batchIndex + 1} upserted successfully!`);
      } catch (batchError) {
        console.error(`❌ Batch ${batchIndex + 1} failed:`);
        console.error("Message:", batchError.message);
        throw batchError;
      }
    }

    console.log("\n✅ All chunks ingested successfully!");
  } catch (error) {
    console.error("\n❌ Error during RAG ingestion:");
    console.error(error);
    process.exit(1);
  }
}

ingestion();
