import express from "express";
import { getGroqChatCompletionServerSideStreamData } from "../chatbot/ChatBotStream.js";

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
  
  // Set headers for Server-Sent Events (SSE)
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Callback to send events to the client
  const onEvent = (eventName, data) => {
    res.write(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    // Pass the callback to the chatbot logic
    await getGroqChatCompletionServerSideStreamData(messages, onEvent);
    res.end(); // Close the stream when done
  } catch (error) {
    onEvent("error", { message: error.message });
    res.end();
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});