import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { embedText, generateText } from '@/lib/rag';
import { Pinecone } from '@pinecone-database/pinecone';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

const pc = process.env.PINECONE_API_KEY ? new Pinecone({ apiKey: process.env.PINECONE_API_KEY }) : null;

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'user') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { message, history } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    let contextText = '';

    // RAG: Retrieve context from Pinecone with Tenant Isolation
    if (pc && process.env.PINECONE_INDEX_NAME) {
      try {
        const index = pc.index(process.env.PINECONE_INDEX_NAME);
        const queryEmbedding = await embedText(message);
        
        if (queryEmbedding.length > 0) {
          const queryResponse = await index.query({
            vector: queryEmbedding,
            topK: 3,
            includeMetadata: true,
            // CRITICAL: Tenant Isolation Filter
            filter: {
              tenantId: { $eq: session.tenantId }
            }
          });

          if (queryResponse.matches && queryResponse.matches.length > 0) {
            contextText = queryResponse.matches
              .map(match => match.metadata?.content)
              .join('\n\n');
          }
        }
      } catch (pineconeErr) {
        console.warn('Pinecone query failed, skipping vector search:', pineconeErr);
        // Continue without RAG context so agents can still work
      }
    }

    // Prepare prompt
    const systemPrompt = `You are a helpful and polite AI assistant for a specific tenant within the AgentForge platform.
Your task is to answer the user's questions based primarily on the provided Knowledge Base context.
If the answer is not in the context, you can use your general knowledge, but state that you are answering outside the specific company knowledge base.
If the user asks you to generate a report or send an email and you don't have enough data, please invent reasonable mock data to fulfill their request and demonstrate your agent capabilities.
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
    const reply = await generateText(conversation, session.tenantId, session.userId);

    try {
      await addDoc(collection(db, 'chat_history'), {
        userId: session.userId,
        tenantId: session.tenantId,
        message: message,
        reply: reply,
        createdAt: new Date().toISOString()
      });
    } catch (dbErr) {
      console.error('Failed to save history:', dbErr);
    }
    
    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'user') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { getDocs, query, where } = await import('firebase/firestore');
    const q = query(
      collection(db, 'chat_history'),
      where('userId', '==', session.userId)
    );
    const snapshot = await getDocs(q);
    const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
    
    // Sort in memory to avoid requiring a composite index in Firestore
    history.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    return NextResponse.json({ history });
  } catch (error: any) {
    console.error('Failed to fetch history:', error);
    // If index is missing, return empty array gracefully
    return NextResponse.json({ history: [] });
  }
}
