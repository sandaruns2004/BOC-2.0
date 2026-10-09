import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { getSession } from '@/lib/session';
import { collection, query, where, getDocsFromServer, doc, getDocFromServer, updateDoc } from 'firebase/firestore';
export async function GET(req: Request) {
  const session = await getSession();
  if (session?.role !== 'admin' || !session.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const url = new URL(req.url);
  if (url.searchParams.has('tenantId') && url.searchParams.get('tenantId') !== session.tenantId) return NextResponse.json({ error: 'Company access denied.' }, { status: 403 });
  try {
    const snapshot = await getDocsFromServer(query(collection(db, 'escalations'), where('tenantId', '==', session.tenantId)));
    const toDate = (value: unknown) => typeof value === 'string' ? value : (value as { toDate?: () => Date })?.toDate?.().toISOString() || null;
    const matching = snapshot.docs.filter(d => d.data().status === (url.searchParams.get('status') || 'pending')).sort((a, b) => String(b.data().createdAt).localeCompare(String(a.data().createdAt))).slice(0, 100);
    const escalations = await Promise.all(matching.map(async d => {
      const data = d.data();
      const customer = typeof data.userId === 'string' && !data.userId.includes('/') ? await getDocFromServer(doc(db, 'users', data.userId)) : null;
      const profile = customer?.data();
      return { ...data, id: d.id, createdAt: toDate(data.createdAt), decidedAt: toDate(data.decidedAt), customerName: profile && profile.tenantId === session.tenantId ? profile.name : null, customerEmail: profile && profile.tenantId === session.tenantId ? profile.email : null };
    }));
    return NextResponse.json({ escalations, count: escalations.length });
  } catch { return NextResponse.json({ error: 'Unable to load escalations.' }, { status: 500 }); }
}
export async function PATCH(req: Request) {
  const session = await getSession();
  if (session?.role !== 'admin' || !session.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id, decision, adminNote } = await req.json();
    if (typeof id !== 'string' || id.includes('/') || !['approved', 'rejected'].includes(decision)) return NextResponse.json({ error: 'Valid ticket ID and decision required.' }, { status: 400 });
    const reference = doc(db, 'escalations', id); const ticket = await getDocFromServer(reference);
    if (!ticket.exists() || ticket.data().tenantId !== session.tenantId) return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 });
    if (ticket.data().status !== 'pending') return NextResponse.json({ error: 'This ticket was already reviewed.' }, { status: 409 });
    await updateDoc(reference, { status: decision, adminId: session.userId, adminNote: typeof adminNote === 'string' ? adminNote.slice(0, 1000) : '', decidedAt: new Date().toISOString() });
    return NextResponse.json({ success: true, id, decision });
  } catch { return NextResponse.json({ error: 'Unable to update ticket.' }, { status: 500 }); }
}
