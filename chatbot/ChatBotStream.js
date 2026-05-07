import Groq from "groq-sdk";
import  {tavily}  from "@tavily/core";
import { createEmbeddingAndVectorSearch } from "./vectorDB.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY });

const baseMessage =  [
  
  {
    role:"system",
    content:`Your name is MIVI AI. An AI bot which helps people with there problems. Be Polite and kind. You have access to the web search tool to get the latest information from the web search (internet).
    there is a tool which is called webSearch. You can use this tool to get the latest information from the web search (internet).
    there is a tool which is called getOwnerName. You can use this tool to get the owner name.
    ### tool description ###
    webSearch:
    - name: webSearch
    - description: Get the latest information from the web search (internet)
    - parameters:
      - query: string
      - query: string
    webSearch({query}:{query:string}) -> string
    getOwnerName:
    - name: getOwnerName
    - description: Get the owner name
    getOwnerName() -> string

    ### RAG BASED SYSTEM ###
    this system is for the use when user ask about there personal information like there company name, there designation there salary , filed of works skills, etc.
    there is a tool which is called getVectorSearch. You can use this tool to get the information from the vector database.
    getVectorSearch({query}:{query:string}) -> string
    `,
  },
  
]


export async function getGroqChatCompletionServerSideStreamData(messages, onEvent) {
  const newMessages = [...baseMessage, ...messages];

  // Preventing infinite loop
  let maxIterations = 5;
  let count = 0;

  while(true){
    count++;
    if(count === maxIterations){
      if(onEvent) onEvent("error", { message: "I'm sorry, I'm unable to answer your question. Please try again later." });
      return;
    }
    const chatCompletion = await getGroqChatCompletion(newMessages);

    let content = "";
    let tool_calls = [];
    let reasoning = "";

    for await (const chunk of chatCompletion) {
      const delta = chunk.choices[0]?.delta || {};
      
      if (delta.reasoning) {
        if(onEvent) onEvent("thinking", { content: delta.reasoning });
        reasoning += delta.reasoning;
      }
      
      if (delta.content) {
        content += delta.content;
        if(onEvent) onEvent("data", { content: delta.content });
      }

      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          const index = tc.index;
          const functionName = tc.function.name;
          const functionId = tc.id;
          const functionArguments = tc.function?.arguments;
          if (!tool_calls[index]) {
            tool_calls[index] = {
              id: functionId,
              type: "function",
              function: { name: functionName || "", arguments: "" }
            };
          }
          if(functionArguments){
            tool_calls[index].function.arguments += functionArguments;
          }
        }
      }
    }
    if(tool_calls.length === 0){
      return; // finished
    }

    // Filter out empty tool calls if any
    tool_calls = tool_calls.filter(Boolean);


    newMessages.push({
      role: "assistant",
      reasoning: reasoning || null,
      tool_calls: tool_calls
    });

    for(const tool_call of tool_calls){
      const functionName= tool_call.function.name;
      const functionArguments = tool_call.function.arguments;
      const funtionId = tool_call.id;
      
      if(onEvent) onEvent("thinking", { content: `\n[Using tool: ${functionName}]\n` });

      if(functionName === "webSearch"){
        const result = await webSearch(JSON.parse(functionArguments));
        newMessages.push({
          role: "tool",
          name: functionName,
          content: result,
          tool_call_id: funtionId,
        });
      }

      if(functionName === "getOwnerName"){
        const result = await getOwnerName();
        newMessages.push({
          role: "tool",
          name: functionName,
          content: result,
          tool_call_id: funtionId,
        });
      }

      if(functionName === "getVectorSearch"){
        const result = await getVectorSearch(JSON.parse(functionArguments));
        newMessages.push({
          role: "tool",
          name: functionName,
          content: result,
          tool_call_id: funtionId,
        });
      }
    }
  }
}

export async function getGroqChatCompletion(messages) {
  return groq.chat.completions.create({
    messages,
    model: "openai/gpt-oss-20b",
    tools:[
      {
        "type": "function",
        "function": {
          "name": "webSearch",
          "description": "Get the latest information from the web search (internet)",
          "parameters": {
            // JSON Schema object
            "type": "object",
            "properties": {
              "query": {
                "type": "string",
                "description": "this query is used to search the web"
              },
            
            },
            "required": ["query"]
          }
        }
      },
      {
        "type": "function",
        "function": {
          "name": "getVectorSearch",
          "description": `Get the information about the user. Like if user ask about what is the skills he/she have or which company \
                          he is currently into. what are the project he has done like all information which is related to the user.
                          `,
          "parameters": {
            // JSON Schema object
            "type": "object",
            "properties": {
              "query": {
                "type": "string",
                "description": "this query is used to search the user information from the vector database"
              },
            
            },
            "required": ["query"]
          }
        }
      },
      {
        "type": "function",
        "function": {
          "name": "getOwnerName",
          "description": "To fetch the infomation of owner. there is no need to pass any query",
        }
      }
    ],
    tool_choice:"auto",
    temperature: 0.7,
    stream:true
  });
}


async function webSearch({query}) {
  console.log("Tool Call: Web search",query)
  const result = await tavilyClient.search(query);
  console.log(result,"this is result");
  return result.results.map(result => result.content).join("\n\n");
}

async function getOwnerName() {
  console.log("calling owner name tool")
  return `Owner name is Aditya`;
}


async function getVectorSearch({query}){
  console.log("Tool Call: Vector Search",query)
  // get embedding of the query and search the embedding from pinecone vector database using vector search
  const result = await createEmbeddingAndVectorSearch({query});
  const contextForAi = result.matches.map(match => match.metadata.text).join("\n\n");
  return contextForAi;
}

