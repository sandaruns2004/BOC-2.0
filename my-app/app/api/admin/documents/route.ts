import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/firebase';
import { collection, getDocsFromServer, doc, getDocFromServer, query, where, deleteDoc } from 'firebase/firestore';
import { extractDocument, indexDocument } from '@/lib/knowledge';
import { Pinecone } from '@pinecone-database/pinecone';

export const runtime = 'nodejs';
export const maxDuration = 60;
export async function GET() {
  const session = await getSession();
  if (session?.role !== 'admin' || !session.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const snapshot = await getDocsFromServer(query(collection(db, 'documents'), where('tenantId', '==', session.tenantId)));
    const documents = snapshot.docs.map(d => { const { text, ...data } = d.data(); void text; return { id: d.id, ...data }; });
    documents.sort((a, b) => String((b as Record<string, unknown>).createdAt).localeCompare(String((a as Record<string, unknown>).createdAt)));
    return NextResponse.json({ documents });
  } catch { return NextResponse.json({ error: 'Unable to load documents.' }, { status: 500 }); }
}
export async function POST(req: Request) {
  const session = await getSession();
  if (session?.role !== 'admin' || !session.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
    const text = await extractDocument(file);
    const document = await indexDocument({ id: crypto.randomUUID(), tenantId: session.tenantId, adminId: session.userId, title: String(form.get('title') || file.name).slice(0, 200), filename: file.name, fileSize: file.size, text });
    return NextResponse.json({ success: true, document });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Document upload failed.' }, { status: 400 }); }
}
export async function DELETE(req: Request) {
  const session = await getSession();
  if (session?.role !== 'admin' || !session.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Document ID required.' }, { status: 400 });
    const reference = doc(db, 'documents', id);
    const document = await getDocFromServer(reference);
    if (!document.exists() || document.data().tenantId !== session.tenantId) return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
    if (process.env.PINECONE_API_KEY && process.env.PINECONE_INDEX_NAME) {
      await new Pinecone({ apiKey: process.env.PINECONE_API_KEY, fetchApi: fetch }).index(process.env.PINECONE_INDEX_NAME).deleteMany({ filter: { docId: id, tenantId: session.tenantId } });
    }
    await deleteDoc(reference);
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: 'Unable to delete document.' }, { status: 500 }); }
}
