TO start file
node --env-file=.env ChatBot.js

For RAG Based System

Load the document which you have
Split it into chunks
Create embedding of each chunk
Store it in vector database
User question -> embed it -> search in vector database (similarity search) -> get top k chunks -> pass it to LLM
