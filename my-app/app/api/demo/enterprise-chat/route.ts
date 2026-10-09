import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { demoCompanies } from '@/lib/demo-config';
import { validateChatInput } from '@/lib/chat-service';
import { db } from '@/lib/firebase';
import { doc, getDocFromServer } from 'firebase/firestore';
export const maxDuration = 60;
export async function POST(req: Request) {
  const session = await getSession();
  if (session?.role !== 'user' || session.tenantId !== demoCompanies.nova.tenantId) return NextResponse.json({ error: 'Select a Nova customer to use this company interface.' }, { status: 401 });
  try {
    let apiKey = process.env.NOVA_DEMO_API_KEY;
    if (!apiKey) {
      // This fictional company's dedicated seeded key stays on its server.
      const seededKey = await getDocFromServer(doc(db, 'api_keys', 'nova_demo_key'));
      const data = seededKey.data();
      if (data?.tenantId === demoCompanies.nova.tenantId && data.isActive === true && typeof data.key === 'string') apiKey = data.key;
    }
    if (!apiKey) return NextResponse.json({ error: 'The Nova demo integration key is unavailable.' }, { status: 503 });
    const body = await req.json();
    if (body.expectedCustomerId && body.expectedCustomerId !== session.userId) return NextResponse.json({ error: 'Your account changed in another tab. Select your customer again.' }, { status: 409 });
    const input = validateChatInput(body);
    const baseUrl = process.env.DEMO_API_BASE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://127.0.0.1:3000');
    const endpoint = new URL('/api/v1/chat', baseUrl);
    const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ ...input, customerId: session.userId }), signal: AbortSignal.timeout(50000), cache: 'no-store' });
    return NextResponse.json(await response.json(), { status: response.status });
  } catch (error) { console.error('Nova integration failed:', error); return NextResponse.json({ error: 'Nova could not reach its AgentForge API integration.' }, { status: 502 }); }
}
