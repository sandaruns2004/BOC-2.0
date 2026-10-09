import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/firebase';
import { doc, getDocFromServer } from 'firebase/firestore';
import { PATCH as decide } from '../route';
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.tenantId || !['admin', 'user'].includes(session.role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  if (id.includes('/')) return NextResponse.json({ error: 'Invalid ID.' }, { status: 400 });
  try {
    const ticket = await getDocFromServer(doc(db, 'escalations', id));
    if (!ticket.exists() || ticket.data().tenantId !== session.tenantId || (session.role === 'user' && ticket.data().userId !== session.userId)) return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 });
    return NextResponse.json({ id, status: ticket.data().status, reason: ticket.data().reason, adminNote: ticket.data().adminNote || '' });
  } catch { return NextResponse.json({ error: 'Unable to load ticket.' }, { status: 500 }); }
}
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  return decide(new Request(req.url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, id }) }));
}
