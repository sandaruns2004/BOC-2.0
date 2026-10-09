import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI, FunctionDeclaration, SchemaType } from '@google/generative-ai';
import * as ToolImplementations from './tools';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms))
  ]);
};

const pc = process.env.PINECONE_API_KEY ? new Pinecone({ apiKey: process.env.PINECONE_API_KEY }) : null;

export async function embedText(text: string): Promise<number[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-2' });
    const result = await model.embedContent(text);
    return result.embedding.values.slice(0, 768);
  } catch (e) {
    console.error('[RAG] Failed to embed text:', e);
    return [];
  }
}

export async function searchVectors(queryVector: number[], tenantId: string) {
  if (!pc || !process.env.PINECONE_INDEX_NAME) {
    console.warn('[RAG] Pinecone not configured. Skipping vector search.');
    return [];
  }

  try {
    const index = pc.index(process.env.PINECONE_INDEX_NAME);
    const queryResponse = await index.query({
      vector: queryVector,
      topK: 5,
      includeMetadata: true,
      filter: { tenantId: { $eq: tenantId } }
    });
    
    return queryResponse.matches || [];
  } catch (e) {
    console.error('[RAG] Failed to search vectors:', e);
    return [];
  }
}

// Define the tools schema
const sendEmailDeclaration: FunctionDeclaration = {
  name: "sendEmail",
  description: "Drafts and sends an email to a specific recipient.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      to: { type: SchemaType.STRING, description: "The email address of the recipient." },
      subject: { type: SchemaType.STRING, description: "The subject of the email." },
      body: { type: SchemaType.STRING, description: "The body content of the email." }
    },
    required: ["to", "subject", "body"]
  }
};

const generateReportDeclaration: FunctionDeclaration = {
  name: "generateReport",
  description: "Generates a PDF report on a specific topic based on details provided and returns a download link.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      topic: { type: SchemaType.STRING, description: "The title or topic of the report." },
      details: { type: SchemaType.STRING, description: "The full content and details to include in the report." }
    },
    required: ["topic", "details"]
  }
};

const escalateToHumanDeclaration: FunctionDeclaration = {
  name: "escalateToHuman",
  description: "Escalates the current issue to a human operator when the AI cannot resolve it.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      reason: { type: SchemaType.STRING, description: "The reason for the escalation." },
      urgency: { type: SchemaType.STRING, description: "The urgency level: low, medium, or high." }
    },
    required: ["reason", "urgency"]
  }
};

const checkSystemStatusDeclaration: FunctionDeclaration = {
  name: "checkSystemStatus",
  description: "Checks the overall system status, uptime, and latency.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {} // No parameters needed
  }
};

const queryDatabaseDeclaration: FunctionDeclaration = {
  name: "queryDatabase",
  description: "Queries the tenant-specific Firebase database to retrieve data records.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      collectionName: { type: SchemaType.STRING, description: "The name of the database collection to query (e.g., sales, inventory)." },
      searchQuery: { type: SchemaType.STRING, description: "A natural language query for logging." }
    },
    required: ["collectionName", "searchQuery"]
  }
};

const tools = [{
  functionDeclarations: [sendEmailDeclaration, generateReportDeclaration, escalateToHumanDeclaration, checkSystemStatusDeclaration, queryDatabaseDeclaration]
}];

export async function generateText(prompt: string, tenantId?: string, userId?: string, onAgentUsed?: (agent: string) => void): Promise<{ text: string, agentsUsed: string[] }> {
  const modelsToTry = [
    'gemini-flash-lite-latest',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemini-3.5-flash',
    'gemini-2.5-flash',
    'gemini-3.8-flash',
    'gemini-pro-latest'
  ];

  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`[RAG] Attempting to generate text with model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName, tools });
      const chat = model.startChat();
      
      let result = await withTimeout(chat.sendMessage(prompt), 8000);
      let response = result.response;
      
      let agentsUsed: string[] = [];
      let calls = response.functionCalls ? response.functionCalls() : undefined;
      while (calls && calls.length > 0) {
        const call = calls[0];
        const functionName = call.name;
        const args = call.args;
        
        let functionResponse: any;
        console.log(`[RAG] LLM requested function call: ${functionName}`);
        
        if (!agentsUsed.includes(functionName)) {
          agentsUsed.push(functionName);
          if (onAgentUsed) {
            onAgentUsed(functionName);
          }
        }

        try {
          if (functionName === 'sendEmail') {
            functionResponse = await ToolImplementations.sendEmail({ ...args, tenantId: tenantId || 'unknown', userId: userId || 'unknown' } as any);
          } else if (functionName === 'generateReport') {
            functionResponse = await ToolImplementations.generateReport({ ...args, tenantId: tenantId || 'unknown', userId: userId || 'unknown' } as any);
          } else if (functionName === 'queryDatabase') {
            functionResponse = await ToolImplementations.queryDatabase({ ...args, tenantId: tenantId || 'unknown', userId: userId || 'unknown' } as any);
          } else if (functionName === 'escalateToHuman') {
            functionResponse = await ToolImplementations.escalateToHuman({ ...args, tenantId: tenantId || 'unknown' } as any);
          } else if (functionName === 'checkSystemStatus') {
            functionResponse = await ToolImplementations.checkSystemStatus();
          } else {
            functionResponse = { error: `Function ${functionName} not found` };
          }
        } catch (err: any) {
          functionResponse = { error: err.message };
        }
        
        result = await withTimeout(chat.sendMessage([{
          functionResponse: {
            name: functionName,
            response: functionResponse
          }
        }]), 8000);
        response = result.response;
        calls = response.functionCalls ? response.functionCalls() : undefined;
      }
      
      return { text: response.text(), agentsUsed };
    } catch (e: any) {
      console.warn(`[RAG] Model ${modelName} failed:`, e.message);
      lastError = e;
      // loop continues to try the next model
    }
  }

  console.error('[RAG] All text generation models failed. Last error:', lastError);
  return { text: 'I encountered an error while trying to process your request. The AI backend may be temporarily overloaded.', agentsUsed: [] };
}
