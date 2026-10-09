import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocsFromServer, doc, getDocFromServer, updateDoc, increment } from 'firebase/firestore';
import { chat, validateChatInput } from '@/lib/chat-service';
export const maxDuration = 60;
export async function POST(req: Request) {
  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) return NextResponse.json({ error: 'Bearer API key required.' }, { status: 401 });
    const snapshot = await getDocsFromServer(query(collection(db, 'api_keys'), where('key', '==', authorization.slice(7))));
    const key = snapshot.docs[0];
    if (!key || key.data().isActive !== true) return NextResponse.json({ error: 'Invalid or inactive API key.' }, { status: 401 });
    const tenantId = key.data().tenantId;
    if (typeof tenantId !== 'string' || !tenantId) return NextResponse.json({ error: 'API key has no company mapping.' }, { status: 401 });
    const body = await req.json();
    let input;
    try { input = validateChatInput(body); } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Invalid input.' }, { status: 400 }); }
    let userId: string | undefined; let email: string | undefined;
    // Only a trusted company backend holding the secret API key can supply its verified customer mapping.
    if (body.customerId !== undefined) {
      if (typeof body.customerId !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(body.customerId)) return NextResponse.json({ error: 'Invalid customer identity.' }, { status: 400 });
      const user = await getDocFromServer(doc(db, 'users', body.customerId));
      if (!user.exists() || user.data().tenantId !== tenantId || user.data().isActive !== true) return NextResponse.json({ error: 'Customer is not authorized for this company.' }, { status: 403 });
      userId = body.customerId; email = user.data().email;
    }
    const result = await chat(input, { tenantId, userId, email });
    try { await updateDoc(doc(db, 'api_keys', key.id), { usageCount: increment(1), lastUsed: new Date().toISOString() }); }
    catch { console.error('API usage logging failed after the request completed.'); }
    return NextResponse.json({ ...result, requestId: input.requestId });
  } catch (error) { console.error('Enterprise chat failed:', error); return NextResponse.json({ error: 'Unable to complete the API request.' }, { status: 500 }); }
}
