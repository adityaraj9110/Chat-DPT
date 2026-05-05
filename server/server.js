import express from "express";
import {  getGroqChatCompletionServerSide } from "../chatbot/ChatBot.js";

const app = express();

app.use(express.json());

// white list the origin to disable cores
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});



app.post("/chat", async (req, res) => {
  const messages = req.body.messages;
  try {
    const result = await getGroqChatCompletionServerSide(messages);
    res.json({ message: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});