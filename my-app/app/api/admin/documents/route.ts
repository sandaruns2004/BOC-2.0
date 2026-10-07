import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, query, where, orderBy } from 'firebase/firestore';
import { embedText } from '@/lib/rag';
import { Pinecone } from '@pinecone-database/pinecone';
import { v4 as uuidv4 } from 'uuid';


const pc = process.env.PINECONE_API_KEY ? new Pinecone({ apiKey: process.env.PINECONE_API_KEY }) : null;

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const q = query(collection(db, 'documents'), where('tenantId', '==', session.tenantId));
    // Firestore requires an index for where() combined with orderBy(), so we sort in memory for now.
    const snapshot = await getDocs(q);
    const documents = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
    documents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ documents });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!pc || !process.env.PINECONE_INDEX_NAME) {
    return NextResponse.json({ error: 'Pinecone is not configured' }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const docId = uuidv4();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    let textContent = '';

    if (file.name.endsWith('.pdf')) {
      const pdfParse = require('pdf-parse');
      const pdfData = await pdfParse(buffer);
      textContent = pdfData.text;
    } else if (file.name.endsWith('.txt')) {
      textContent = buffer.toString('utf-8');
    } else {
      return NextResponse.json({ error: 'Unsupported file type. Please upload PDF or TXT.' }, { status: 400 });
    }

    // Very basic chunking strategy (split by newlines, group up to 1000 chars)
    const paragraphs = textContent.split(/\n\s*\n/);
    const chunks: string[] = [];
    let currentChunk = '';
    
    for (const p of paragraphs) {
      if ((currentChunk.length + p.length) > 1000 && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      currentChunk += p + '\n\n';
    }
    if (currentChunk.trim().length > 0) chunks.push(currentChunk.trim());

    if (chunks.length === 0) {
      return NextResponse.json({ error: 'Could not extract text from document.' }, { status: 400 });
    }

    // Embed and store in Pinecone
    const index = pc.index(process.env.PINECONE_INDEX_NAME);
    const pineconeRecords = [];
    const pineconeIds = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await embedText(chunk);
      if (embedding.length > 0) {
        const chunkId = `${docId}_chunk_${i}`;
        pineconeIds.push(chunkId);
        pineconeRecords.push({
          id: chunkId,
          values: embedding,
          metadata: {
            tenantId: session.tenantId,
            docId: docId,
            content: chunk
          }
        });
      }
    }

    if (pineconeRecords.length > 0) {
      try {
        // Try the new SDK signature (object with records property)
        await (index.upsert as any)({ records: pineconeRecords });
      } catch (upsertError: any) {
        // Fallback to the older SDK signature (array directly)
        await (index.upsert as any)(pineconeRecords);
      }
    }

    const docData = {
      tenantId: session.tenantId,
      adminId: session.userId,
      title: title || file.name,
      filename: file.name,
      fileSize: file.size,
      chunkCount: pineconeRecords.length,
      status: 'indexed',
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'documents', docId), docData);

    return NextResponse.json({ success: true, document: { id: docId, ...docData } });
  } catch (error: any) {
    console.error('Document upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const docId = searchParams.get('id');

    if (!docId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    // 1. Delete from Firestore
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, 'documents', docId));

    // 2. Delete from Pinecone
    if (pc && process.env.PINECONE_INDEX_NAME) {
      const index = pc.index(process.env.PINECONE_INDEX_NAME);
      try {
        // Try new SDK signature first
        await (index as any).deleteMany({ filter: { docId: docId } });
      } catch (e: any) {
        // Fallback for older SDK signature just in case
        try {
           await (index as any).deleteMany({ docId: docId });
        } catch (e2) {
           console.warn('Could not delete vectors from Pinecone:', e2);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Document delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}