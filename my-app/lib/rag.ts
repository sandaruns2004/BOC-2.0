import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const pc = process.env.PINECONE_API_KEY ? new Pinecone({ apiKey: process.env.PINECONE_API_KEY }) : null;

export async function embedText(text: string): Promise<number[]> {
  try {
    // 2026 Model format for embeddings
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-2' });
    const result = await model.embedContent(text);
    return result.embedding.values;
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
      filter: { tenantId: { $eq: tenantId } } // Tenant isolation
    });
    
    return queryResponse.matches || [];
  } catch (e) {
    console.error('[RAG] Failed to search vectors:', e);
    return [];
  }
}
