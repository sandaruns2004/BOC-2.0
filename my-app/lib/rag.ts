import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI, FunctionDeclaration, SchemaType } from '@google/generative-ai';
import * as ToolImplementations from './tools';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([promise, new Promise<T>((_, reject) => { timer = setTimeout(() => reject(new Error('AI response timed out. Please try again.')), ms); })]).finally(() => clearTimeout(timer));
};

const pc = process.env.PINECONE_API_KEY ? new Pinecone({ apiKey: process.env.PINECONE_API_KEY, fetchApi: fetch }) : null;

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
  description: "Reads the signed-in customer's orders from the company's configured and allowed order collection. Other collections cannot be queried.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      collectionName: { type: SchemaType.STRING, description: "The company's configured customer order collection (demo_orders by default)." },
      searchQuery: { type: SchemaType.STRING, description: "A natural language query for logging." }
    },
    required: ["collectionName", "searchQuery"]
  }
};

const tools = [{
  functionDeclarations: [sendEmailDeclaration, generateReportDeclaration, escalateToHumanDeclaration, checkSystemStatusDeclaration, queryDatabaseDeclaration]
}];

export async function generateText(prompt: string, tenantId?: string, userId?: string, onAgentUsed?: (agent: string) => void, options: { systemInstruction?: string; allowedTools?: string[] } = {}): Promise<{ text: string; agentsUsed: string[] }> {
  const declarations = tools[0].functionDeclarations.filter(t => !options.allowedTools || options.allowedTools.includes(t.name));
  const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-flash-lite-latest', ...(declarations.length ? { tools: [{ functionDeclarations: declarations }] } : {}), systemInstruction: options.systemInstruction || 'You are a company assistant. Never invent operational data or claim an action succeeded when its tool failed.' });
  const chat = model.startChat();
  let result = await withTimeout(chat.sendMessage(prompt), 20000);
  const agentsUsed: string[] = [];
  for (let round = 0; round < 5; round++) {
    const calls = result.response.functionCalls();
    if (!calls?.length) return { text: result.response.text(), agentsUsed };
    const responses = [];
    for (const call of calls) {
      if (!declarations.some(d => d.name === call.name)) throw new Error('Requested tool is not allowed.');
      let response: unknown;
      const args = call.args as Record<string, unknown>;
      if (call.name === 'queryDatabase') response = await ToolImplementations.queryDatabase({ tenantId: tenantId || '', userId: userId || '', collectionName: String(args.collectionName || ''), searchQuery: String(args.searchQuery || '') });
      else if (call.name === 'escalateToHuman') response = await ToolImplementations.escalateToHuman({ tenantId: tenantId || '', userId, reason: String(args.reason || ''), urgency: 'high' });
      else if (call.name === 'checkSystemStatus') response = await ToolImplementations.checkSystemStatus();
      else response = { success: false, error: 'Use the explicit email or report workflow to authorize this action.' };
      if (!agentsUsed.includes(call.name)) { agentsUsed.push(call.name); onAgentUsed?.(call.name); }
      responses.push({ functionResponse: { name: call.name, response: response as object } });
    }
    // Do not retry the entire conversation after a tool action: that could duplicate emails or tickets.
    result = await withTimeout(chat.sendMessage(responses), 20000);
  }
  throw new Error('The assistant reached its action limit. Please ask a simpler question.');
}
