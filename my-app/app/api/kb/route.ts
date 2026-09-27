import { NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI } from '@google/generative-ai';
import crypto from 'crypto';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const pc = process.env.PINECONE_API_KEY ? new Pinecone({ apiKey: process.env.PINECONE_API_KEY }) : null;

export async function POST(req: Request) {
  if (!pc || !process.env.PINECONE_INDEX_NAME) {
    return NextResponse.json({ error: 'Pinecone not configured' }, { status: 500 });
  }

  try {
    const { tenantId, title, content } = await req.json();

    if (!tenantId || !title || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Vectorize the document using Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-2' });
    const result = await model.embedContent(content);
    
    // 2. Slice to 768 dimensions for our index
    const vector = result.embedding.values.slice(0, 768);
    const id = crypto.createHash('md5').update(title + tenantId).digest('hex');

    // 3. Upsert to Pinecone with tenant isolation
    const index = pc.index(process.env.PINECONE_INDEX_NAME);
    await index.upsert({
      records: [{
        id,
        values: vector,
        metadata: {
          tenantId,
          title,
          content
        }
      }]
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('[KB API] Failed to upload document:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
