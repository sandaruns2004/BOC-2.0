import { NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import crypto from 'crypto';
import { embedText, embeddingModelId } from '@/lib/ai';

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

    // 1. Vectorize the document with the configured embedding model (768 dimensions)
    const vector = await embedText(content);
    if (!vector.length) {
      return NextResponse.json({ error: 'Embedding failed' }, { status: 502 });
    }
    const id = crypto.createHash('md5').update(title + tenantId).digest('hex');

    // 2. Upsert to Pinecone with tenant isolation
    const index = pc.index(process.env.PINECONE_INDEX_NAME);
    await index.upsert({
      records: [{
        id,
        values: vector,
        metadata: {
          tenantId,
          title,
          content,
          embeddingModel: embeddingModelId
        }
      }]
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('[KB API] Failed to upload document:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
