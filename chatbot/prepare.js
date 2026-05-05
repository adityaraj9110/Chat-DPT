// Load or index the document file like pdf

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";



export async function parsePDF(path = "./Aditya_REACT_GENAI_Resume.pdf"){

    const loader = new PDFLoader(path,{
        splitPages:false
    });

    const docs = await loader.load();

    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 300,
        chunkOverlap: 150,
    })

    const splitDocs = await splitter.splitText(docs[0].pageContent)
    return splitDocs
}
