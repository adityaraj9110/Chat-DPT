# ChatDPT - Agentic AI Chatbot with RAG

ChatDPT is a highly intelligent, agentic chatbot powered by **Groq** and **Retrieval-Augmented Generation (RAG)**. It is capable of web searching via Tavily and answering personal/domain-specific questions by referencing embedded documents (like a Resume) from a **Pinecone Vector Database**.

## How to Start the Server

To start the backend server, run the following command from the root directory:

```bash
node --env-file=.env server/server.js
```

---

## The RAG (Retrieval-Augmented Generation) Architecture Flow

The system operates in two main phases: **Data Ingestion** and **Retrieval & Response**.

### Phase 1: Data Ingestion (Preparing the Vector Database)
Before the chatbot can answer questions about your custom documents, the data must be prepared and stored:

1. **Load the PDF**: The system reads the source document (e.g., `Aditya_REACT_GENAI_Resume.pdf`) using LangChain's PDF Loader.
2. **Chunking**: The document is split into smaller, meaningful text chunks using a `RecursiveCharacterTextSplitter`. This ensures we only retrieve the exact relevant context later.
3. **Embedding**: Each chunk is passed through a local HuggingFace embedding model (`Xenova/all-MiniLM-L6-v2` via Transformers.js) to convert the text into numerical vectors (embeddings).
4. **Vector DB Upload**: These embeddings, along with their original text as metadata, are upserted into the **Pinecone Vector Database**.

### Phase 2: Retrieval & Chatbot Response (Real-time Flow)
When a user asks the chatbot a question that triggers the vector search tool:

1. **Take Chatbot Query**: The LLM determines it needs more context and triggers the `getVectorSearch` tool with the user's query.
2. **Convert to Embedding**: The system takes that specific search query and converts it into an embedding using the exact same model used in Phase 1.
3. **Similarity Search in Vector DB**: The query embedding is sent to Pinecone to perform a similarity search against all stored document chunks.
4. **Return Closest Values**: Pinecone returns the top-k nearest vectors. The system extracts the text (metadata) associated with those vectors.
5. **Context Injection**: This highly relevant text context is fed back into the LLM's prompt.
6. **Chatbot Reply**: Finally, the LLM reads the provided context and synthesizes a highly accurate, grounded response back to the user.
