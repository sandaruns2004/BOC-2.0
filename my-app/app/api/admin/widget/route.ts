import { getSession } from '@/lib/session';
import { db } from '@/lib/firebase';
import { doc, getDocFromServer, setDoc } from 'firebase/firestore';
import { defaultWidget, getWidgetConfig, validateWidget } from '@/lib/widget-config';
async function admin() {
  const session = await getSession();
  if (session?.role !== 'admin' || !session.tenantId) return null;
  const record = (await getDocFromServer(doc(db, 'business_admins', session.userId))).data();
  if (record?.tenantId !== session.tenantId || record.isActive !== true) return null;
  return { tenantId: session.tenantId, company: String(record.company || 'Company') };
}
export async function GET() {
  try {
    const identity = await admin();
    if (!identity) return Response.json({ error: 'Company admin access required.' }, { status: 401 });
    const settings = (await getDocFromServer(doc(db, 'tenant_settings', identity.tenantId))).data();
    const widget = settings?.widgetConfig ? await getWidgetConfig(identity.tenantId) : defaultWidget(identity.tenantId, `${settings?.companyName || identity.company} Assistant`);
    return Response.json({ companyId: identity.tenantId, widget }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return Response.json({ error: 'Unable to load website widget settings.' }, { status: 503 }); }
}
export async function POST(req: Request) {
  try {
    const identity = await admin();
    if (!identity) return Response.json({ error: 'Company admin access required.' }, { status: 401 });
    let widget;
    try { widget = validateWidget((await req.json()).widget); } catch (error) { return Response.json({ error: error instanceof Error ? error.message : 'Invalid widget settings.' }, { status: 400 }); }
    await setDoc(doc(db, 'tenant_settings', identity.tenantId), { widgetConfig: widget }, { merge: true });
    return Response.json({ success: true, widget });
  } catch { return Response.json({ error: 'Unable to save website widget settings.' }, { status: 503 }); }
}
