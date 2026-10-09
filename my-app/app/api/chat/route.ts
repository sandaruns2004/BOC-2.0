import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/firebase';
import { collection, doc, getDocFromServer, getDocsFromServer, query, where } from 'firebase/firestore';
import { chat, validateChatInput } from '@/lib/chat-service';
import { companyForTenant } from '@/lib/demo-config';
export const maxDuration = 60;
export async function POST(req: Request) {
  const session = await getSession();
  if (session?.role !== 'user' || !session.tenantId) return NextResponse.json({ error: 'Please sign in to chat.' }, { status: 401 });
  try {
    const customer = await getDocFromServer(doc(db, 'users', session.userId));
    if (!customer.exists() || customer.data().tenantId !== session.tenantId || customer.data().isActive !== true) return NextResponse.json({ error: 'Your customer account is disabled or unavailable.' }, { status: 403 });
  } catch { return NextResponse.json({ error: 'Unable to verify your customer account.' }, { status: 503 }); }
  let input;
  try {
    const body = await req.json();
    if (body.expectedCustomerId && body.expectedCustomerId !== session.userId) return NextResponse.json({ error: 'Your account changed in another tab. Select your customer again.' }, { status: 409 });
    input = validateChatInput(body);
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Invalid request.' }, { status: 400 }); }
  const stream = new ReadableStream({ async start(controller) {
    const emit = (data: unknown) => controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`));
    try { const result = await chat(input, { tenantId: session.tenantId!, userId: session.userId, email: session.email, name: session.name }, name => emit({ type: 'agent', name })); emit({ type: 'text', content: result.reply }); emit({ type: 'result', ...result }); }
    catch (error) { console.error('Chat failed:', error); emit({ type: 'error', message: 'Unable to complete that request. Please check the service connection and try again.' }); }
    finally { controller.close(); }
  } });
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform' } });
}
export async function GET() {
  const session = await getSession();
  if (session?.role !== 'user' || !session.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const result = await getDocsFromServer(query(collection(db, 'chat_history'), where('userId', '==', session.userId), where('tenantId', '==', session.tenantId)));
    const history = result.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => String((b as Record<string, unknown>).createdAt).localeCompare(String((a as Record<string, unknown>).createdAt)));
    return NextResponse.json({ history, company: companyForTenant(session.tenantId)?.name });
  } catch { return NextResponse.json({ error: 'Unable to load chat history.' }, { status: 500 }); }
}
