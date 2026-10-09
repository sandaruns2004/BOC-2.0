import { NextResponse } from 'next/server';
import { doc, getDocFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createSession } from '@/lib/session';
import { demoCompanies, demoEnabled, DemoCompany } from '@/lib/demo-config';
export async function POST(req: Request) {
  if (!demoEnabled()) return NextResponse.json({ error: 'Demo account selection is disabled.' }, { status: 403 });
  try {
    const { company, customerId } = await req.json();
    if (typeof company !== 'string' || !Object.hasOwn(demoCompanies, company)) return NextResponse.json({ error: 'Unknown company.' }, { status: 400 });
    const configuration = demoCompanies[company as DemoCompany];
    if (!configuration.customers.some(c => c.id === customerId)) return NextResponse.json({ error: 'Unknown demo customer.' }, { status: 403 });
    const user = await getDocFromServer(doc(db, 'users', customerId));
    if (!user.exists() || user.data().isDemo !== true || user.data().tenantId !== configuration.tenantId || !user.data().isActive) return NextResponse.json({ error: 'Demo data is not ready. Run the setup script.' }, { status: 409 });
    await createSession({ userId: user.id, role: 'user', tenantId: configuration.tenantId, email: user.data().email, name: user.data().name });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: 'Unable to select the demo account.' }, { status: 500 }); }
}
