/**
 * Implementation plan
 * Stage 1: Indexing
 * 1. Load the document - pdf, text, data cleaning
 * 2. Chunk the document
 * 3. Generate vector embeddings
 * 4. Store the vector embeddings - Vector database
 *
 * Stage 2: Using the chatbot
 * 1. Setup LLM
 * 2. Add retrieval step
 * 3. Pass input + relevant information to LLM
 * 4. Congratulations
 */

// Express server for chatBot

const express = require("express");
const app = express();
const cors = require("cors");

const { PORT } = require("./config/serverConfig");

async function startServer() {
  try {
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(
      cors({
        origin: "*",
        credentials: true,
      }),
    );

    app.get("/health", (req, res) => {
      res.status(200).json({ message: "OK", status: true });
    });


    // ChatBot post req
    app.post("/chat", async (req, res) => {
      console.log(req.body);

      const { message, threadId } = req.body;
      // todo: validate above fields

      if (!message || !threadId) {
        res.status(400).json({ message: "All fields are required!" });
        return;
      }

      console.log("Message", message);

      const result = await generate(message, threadId);

      return res.status(201).json({
        message: "Successful!!",
        status: true,
        data: result,
      });
    });

    app.listen(PORT, () => {
      console.log(`Server is listening on port ${PORT}`);
    });
  } catch (error) {
    throw new Error("Error during express server start: ", error);
    process.exit(1);
  }
}

startServer();
