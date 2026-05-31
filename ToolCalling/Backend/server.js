import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { generate } from "./ChatBot.js";

const app = express();

dotenv.config();

const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "*",
    credentials: true,
  }),
);

app.get("/", (req, res) => {
  res.json({ message: "OK" });
});

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
