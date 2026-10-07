import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { embedText, generateText } from '@/lib/rag';
import { Pinecone } from '@pinecone-database/pinecone';

const pc = process.env.PINECONE_API_KEY ? new Pinecone({ apiKey: process.env.PINECONE_API_KEY }) : null;

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    // Validate API key
    const q = query(collection(db, 'api_keys'), where('key', '==', token));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    const keyDoc = snapshot.docs[0];
    const keyData = keyDoc.data();

    if (!keyData.isActive) {
      return NextResponse.json({ error: 'API key is inactive' }, { status: 401 });
    }

    const tenantId = keyData.tenantId;

    // Update usage
    await updateDoc(doc(db, 'api_keys', keyDoc.id), {
      usageCount: (keyData.usageCount || 0) + 1,
      lastUsed: new Date().toISOString()
    });

    const body = await req.json();
    const { message, history } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    let contextText = '';

    // RAG: Retrieve context from Pinecone with Tenant Isolation
    if (pc && process.env.PINECONE_INDEX_NAME) {
      const index = pc.index(process.env.PINECONE_INDEX_NAME);
      const queryEmbedding = await embedText(message);
      
      if (queryEmbedding.length > 0) {
        const queryResponse = await index.query({
          vector: queryEmbedding,
          topK: 3,
          includeMetadata: true,
          // CRITICAL: Tenant Isolation Filter
          filter: {
            tenantId: { $eq: tenantId }
          }
        });

        if (queryResponse.matches && queryResponse.matches.length > 0) {
          contextText = queryResponse.matches
            .map(match => match.metadata?.content)
            .join('\n\n');
        }
      }
    }

    // Prepare prompt
    const systemPrompt = `You are a helpful and polite AI assistant for a specific tenant within the AgentForge platform.
Your task is to answer the user's questions based primarily on the provided Knowledge Base context.
If the answer is not in the context, you can use your general knowledge, but state that you are answering outside the specific company knowledge base.
Do not mention "tenant", "Pinecone", or "AgentForge" in your responses to the user.

KNOWLEDGE BASE CONTEXT:
${contextText || "No specific company knowledge base documents found."}
`;

    // Flatten history for basic LLM call
    let conversation = systemPrompt + "\n\n--- Conversation History ---\n";
    if (history && history.length > 0) {
      history.slice(-5).forEach((msg: any) => {
        conversation += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
      });
    }
    conversation += `User: ${message}\nAssistant:`;

    // Call Gemini Model with function calling
    const reply = await generateText(conversation, tenantId);

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('API v1 Chat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
