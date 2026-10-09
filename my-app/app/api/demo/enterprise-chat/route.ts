import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { demoCompanies } from '@/lib/demo-config';
import { validateChatInput } from '@/lib/chat-service';
export const maxDuration = 60;
export async function POST(req: Request) {
  const session = await getSession();
  if (session?.role !== 'user' || session.tenantId !== demoCompanies.nova.tenantId) return NextResponse.json({ error: 'Select a Nova customer to use this company interface.' }, { status: 401 });
  if (!process.env.NOVA_DEMO_API_KEY) return NextResponse.json({ error: 'The Nova server API key is not configured.' }, { status: 503 });
  try {
    const body = await req.json();
    if (body.expectedCustomerId && body.expectedCustomerId !== session.userId) return NextResponse.json({ error: 'Your account changed in another tab. Select your customer again.' }, { status: 409 });
    const input = validateChatInput(body);
    const endpoint = `${process.env.DEMO_API_BASE_URL || 'http://127.0.0.1:3000'}/api/v1/chat`;
    const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.NOVA_DEMO_API_KEY}` }, body: JSON.stringify({ ...input, customerId: session.userId }), signal: AbortSignal.timeout(50000), cache: 'no-store' });
    return NextResponse.json(await response.json(), { status: response.status });
  } catch (error) { console.error('Nova integration failed:', error); return NextResponse.json({ error: 'Nova could not reach its AgentForge API integration.' }, { status: 502 }); }
}
