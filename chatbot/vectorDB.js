import { Pinecone } from '@pinecone-database/pinecone';
import { createEmbedding, vectorUploadDataGenerator } from './rag.js';

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const index = pc.index(process.env.PINECONE_INDEX_NAME);

export async function pineconeUpload(){
    const vectorDbData = await vectorUploadDataGenerator();
    try {
        await index.upsert({ records: vectorDbData });
        console.log("Data uploaded successfully ✅")
    } catch (error) {
        console.error("Error Name:", error.name);
        console.error("Error Message:", error.message);
    }
}


export async function createEmbeddingAndVectorSearch({query}){
    const embedding = await createEmbedding(query);
    const result = await index.query({
        vector: embedding,
        topK: 3,
        includeMetadata: true
    });
    return result;
}



