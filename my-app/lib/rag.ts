import { Pinecone } from '@pinecone-database/pinecone';
import { generateText as generateWithModel, isStepCount, tool, type ToolSet } from 'ai';
import { z } from 'zod';
import { chatModel, embeddingModelId } from './ai';
import * as ToolImplementations from './tools';

export { embedText } from './ai';

const pc = process.env.PINECONE_API_KEY ? new Pinecone({ apiKey: process.env.PINECONE_API_KEY, fetchApi: fetch }) : null;

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
      filter: { tenantId: { $eq: tenantId }, embeddingModel: { $eq: embeddingModelId } }
    });

    return queryResponse.matches || [];
  } catch (e) {
    console.error('[RAG] Failed to search vectors:', e);
    return [];
  }
}

const TOOL_NAMES = ['sendEmail', 'generateReport', 'escalateToHuman', 'checkSystemStatus', 'queryDatabase'] as const;
const MAX_TOOL_ROUNDS = 5;

function buildTools(tenantId: string, userId: string | undefined, track: (name: string) => void): ToolSet {
  const blocked = { success: false, error: 'Use the explicit email or report workflow to authorize this action.' };
  return {
    sendEmail: tool({
      description: 'Drafts and sends an email to a specific recipient.',
      inputSchema: z.object({
        to: z.string().describe('The email address of the recipient.'),
        subject: z.string().describe('The subject of the email.'),
        body: z.string().describe('The body content of the email.'),
      }),
      execute: async () => { track('sendEmail'); return blocked; },
    }),
    generateReport: tool({
      description: 'Generates a PDF report on a specific topic based on details provided and returns a download link.',
      inputSchema: z.object({
        topic: z.string().describe('The title or topic of the report.'),
        details: z.string().describe('The full content and details to include in the report.'),
      }),
      execute: async () => { track('generateReport'); return blocked; },
    }),
    escalateToHuman: tool({
      description: 'Escalates the current issue to a human operator when the AI cannot resolve it.',
      inputSchema: z.object({
        reason: z.string().describe('The reason for the escalation.'),
        urgency: z.string().describe('The urgency level: low, medium, or high.'),
      }),
      execute: async ({ reason }) => { track('escalateToHuman'); return ToolImplementations.escalateToHuman({ tenantId, userId, reason, urgency: 'high' }); },
    }),
    checkSystemStatus: tool({
      description: 'Checks the overall system status, uptime, and latency.',
      inputSchema: z.object({}),
      execute: async () => { track('checkSystemStatus'); return ToolImplementations.checkSystemStatus(); },
    }),
    queryDatabase: tool({
      description: 'Queries the tenant-specific Firebase database to retrieve data records.',
      inputSchema: z.object({
        collectionName: z.string().describe('The name of the database collection to query (e.g., sales, inventory).'),
        searchQuery: z.string().describe('A natural language query for logging.'),
      }),
      execute: async ({ collectionName, searchQuery }) => { track('queryDatabase'); return ToolImplementations.queryDatabase({ tenantId, userId: userId || '', collectionName, searchQuery }); },
    }),
  };
}

export async function generateText(prompt: string, tenantId?: string, userId?: string, onAgentUsed?: (agent: string) => void, options: { systemInstruction?: string; allowedTools?: string[] } = {}): Promise<{ text: string; agentsUsed: string[] }> {
  const agentsUsed: string[] = [];
  const track = (name: string) => { if (!agentsUsed.includes(name)) { agentsUsed.push(name); onAgentUsed?.(name); } };
  const allTools = buildTools(tenantId || '', userId, track);
  const tools = Object.fromEntries(TOOL_NAMES.filter(name => !options.allowedTools || options.allowedTools.includes(name)).map(name => [name, allTools[name]]));
  const result = await generateWithModel({
    model: chatModel(),
    instructions: options.systemInstruction || 'You are a company assistant. Never invent operational data or claim an action succeeded when its tool failed.',
    prompt,
    ...(Object.keys(tools).length ? { tools, stopWhen: isStepCount(MAX_TOOL_ROUNDS + 1) } : {}),
    // Retries cover failed model calls only; tool actions are never re-run, so emails or tickets cannot duplicate.
    timeout: { stepMs: 20000 },
  });
  if (result.finishReason === 'tool-calls') throw new Error('The assistant reached its action limit. Please ask a simpler question.');
  return { text: result.text, agentsUsed };
}
