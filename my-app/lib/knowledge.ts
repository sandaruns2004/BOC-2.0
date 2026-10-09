import { Pinecone } from '@pinecone-database/pinecone';
import { collection, doc, getDocsFromServer, query, setDoc, where } from 'firebase/firestore';
import { db } from './firebase';
import { embedText } from './rag';

export async function extractDocument(file: File) {
  if (!file.size || file.size > 4 * 1024 * 1024) throw new Error('Upload a non-empty PDF or TXT smaller than 4 MB.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (file.name.toLowerCase().endsWith('.txt')) return new TextDecoder().decode(bytes);
  if (!file.name.toLowerCase().endsWith('.pdf')) throw new Error('Please upload a PDF or TXT file.');
  // Load the native canvas polyfills before PDF.js, and only for PDF uploads.
  // Chat and knowledge retrieval must not depend on the PDF parser starting up.
  const workerImport = await import('pdf-parse/worker');
  const mainImport = await import('pdf-parse');
  console.log('Worker Import:', Object.keys(workerImport));
  console.log('Main Import:', Object.keys(mainImport));
  const workerDefault = (workerImport as typeof workerImport & { default?: Partial<typeof workerImport> }).default;
  const mainDefault = (mainImport as typeof mainImport & { default?: Partial<typeof mainImport> | typeof mainImport.PDFParse }).default;
  const CanvasFactory = workerImport.CanvasFactory || workerDefault?.CanvasFactory;
  const getData = workerImport.getData || workerDefault?.getData;
  const PDFParse = mainImport.PDFParse || (typeof mainDefault === 'function' ? mainDefault : mainDefault?.PDFParse);
  if (!CanvasFactory || !getData || !PDFParse) throw new Error('The PDF parser could not be loaded.');

  PDFParse.setWorker(getData());
  const parser = new PDFParse({ data: bytes, CanvasFactory });
  try { return (await parser.getText()).text; }
  finally { await parser.destroy(); }
}

export function chunkText(text: string) {
  const clean = text.replace(/\r/g, '').trim();
  if (!clean) throw new Error('No readable text found. Use a PDF with selectable text; scanned PDFs need OCR.');
  if (clean.length > 80000) throw new Error('Use a shorter document for this demo (maximum 80,000 characters).');
  const chunks: string[] = [];
  for (let start = 0; start < clean.length; start += 1100) chunks.push(clean.slice(start, start + 1300));
  return chunks;
}

export async function indexDocument(input: { id: string; tenantId: string; adminId: string; title: string; filename: string; text: string; fileSize: number }) {
  if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX_NAME) throw new Error('Pinecone settings are missing.');
  const chunks = chunkText(input.text);
  const records = [];
  for (let i = 0; i < chunks.length; i++) {
    const values = await embedText(chunks[i]);
    if (!values.length) throw new Error('Embedding failed. The document has not been marked indexed.');
    records.push({ id: `${input.id}_chunk_${i}`, values, metadata: { tenantId: input.tenantId, docId: input.id, title: input.title, content: chunks[i] } });
  }
  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY, fetchApi: fetch });
  await pc.index(process.env.PINECONE_INDEX_NAME).upsert({ records });
  const data = { tenantId: input.tenantId, adminId: input.adminId, title: input.title, filename: input.filename, fileSize: input.fileSize, chunkCount: records.length, status: 'indexed', text: input.text.trim(), createdAt: new Date().toISOString() };
  await setDoc(doc(db, 'documents', input.id), data);
  return { id: input.id, ...data, text: undefined };
}

export async function retrieveKnowledge(tenantId: string, message: string) {
  const snapshot = await getDocsFromServer(query(collection(db, 'documents'), where('tenantId', '==', tenantId)));
  const documents = new Map(snapshot.docs.filter(d => d.data().status === 'indexed').map(d => [d.id, d.data()]));
  if (!documents.size) return { text: '', sources: [] as string[] };
  if (process.env.PINECONE_API_KEY && process.env.PINECONE_INDEX_NAME) {
    try {
      const vector = await embedText(message);
      if (!vector.length) throw new Error('Embedding unavailable.');
      const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY, fetchApi: fetch });
      const result = await pc.index(process.env.PINECONE_INDEX_NAME).query({ vector, topK: 5, includeMetadata: true, filter: { tenantId: { $eq: tenantId } } });
      // Orphan vectors never override the company's current indexed documents.
      const matches = result.matches.filter(m => typeof m.metadata?.docId === 'string' && documents.has(m.metadata.docId));
      if (matches.length) return { text: matches.map(m => String(m.metadata?.content || '')).join('\n\n'), sources: [...new Set(matches.map(m => String(m.metadata?.title || documents.get(String(m.metadata?.docId))?.title || 'Company policy')))] };
    } catch { console.warn('Policy search unavailable; using the company’s stored indexed document text.'); }
  }
  // Small-company fallback uses real persisted text, with a bounded prompt size.
  // Disabled/deleted documents and documents from another company are excluded.
  const selected: { title: string; text: string }[] = [];
  let remaining = 20000;
  for (const data of [...documents.values()].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))) {
    if (typeof data.text !== 'string' || !data.text.trim() || remaining <= 0) continue;
    const text = data.text.slice(0, remaining); remaining -= text.length;
    selected.push({ title: String(data.title || 'Company policy'), text });
  }
  return { text: selected.map(d => d.text).join('\n\n'), sources: [...new Set(selected.map(d => d.title))] };
}
