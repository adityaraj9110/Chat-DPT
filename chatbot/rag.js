import { parsePDF } from "./prepare.js";
import { pipeline } from '@xenova/transformers';

let embedder;


export async function getEmbedder() {
  if (!embedder) {
    embedder = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );
  }
  return embedder;
}

export async function createEmbedding(text) {
  const model = await getEmbedder();

  const output = await model(text, {
    pooling: 'mean',
    normalize: true,
  });
  return Array.from(output.data); 
}



export async function vectorEmbedder(){
    const docs = await parsePDF();
    const embeddings = await Promise.all(
    docs.map(doc => createEmbedding(doc))
  );
 return embeddings;
}

export async function vectorUploadDataGenerator(){

  const docs = await parsePDF();
  const embeddings = await vectorEmbedder();

  const preparedVectorsData = embeddings.map((embedding, index)=>{
    return{
      id: `doc-${index}`,
      values: embedding,
      metadata: {
        text: docs[index],
      },
    }
  })

  return preparedVectorsData;
}
