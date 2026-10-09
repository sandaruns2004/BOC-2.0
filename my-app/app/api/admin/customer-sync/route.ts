import { doc, getDocFromServer, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getSession } from '@/lib/session';
import { customerSyncSettings, syncCompanyCustomers, validateCustomerSync } from '@/lib/customer-sync';

export const maxDuration = 60;
async function adminTenant() {
  const session = await getSession();
  if (!session || session.role !== 'admin' || !session.tenantId) return null;
  const admin = (await getDocFromServer(doc(db, 'business_admins', session.userId))).data();
  return admin?.isActive === true && admin.tenantId === session.tenantId ? session.tenantId : null;
}
export async function GET() {
  const tenantId = await adminTenant();
  if (!tenantId) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { settings, config } = await customerSyncSettings(tenantId);
    const state = (await getDocFromServer(doc(db, 'customer_sync_state', tenantId))).data();
    return Response.json({ config, connected: Boolean(settings?.databaseConfig?.firebaseConfig?.projectId), state: state ? { status: state.status, lastSyncedAt: state.lastSyncedAt, importedCount: state.importedCount, error: state.error } : null }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return Response.json({ error: 'Unable to load customer sync settings.' }, { status: 503 }); }
}
export async function POST(req: Request) {
  const tenantId = await adminTenant();
  if (!tenantId) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    if (body.action !== 'sync') {
      const config = validateCustomerSync(body.config);
      const { settings } = await customerSyncSettings(tenantId);
      if (config.enabled && !settings?.databaseConfig?.firebaseConfig?.projectId) return Response.json({ error: 'Save the company Firebase connection first.' }, { status: 400 });
      if (config.enabled && settings?.databaseConfig?.firebaseConfig?.projectId === process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && config.collection === 'users') return Response.json({ error: 'Choose a separate client customer collection. AgentForge users cannot be their own sync source.' }, { status: 400 });
      if (config.enabled && settings?.databaseConfig?.firebaseConfig?.projectId === process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && !config.tenantField) return Response.json({ error: 'A company filter is required for the platform Firebase project.' }, { status: 400 });
      await setDoc(doc(db, 'tenant_settings', tenantId), { customerSync: config }, { merge: true });
      await setDoc(doc(db, 'customer_sync_state', tenantId), { completedAt: 0 }, { merge: true });
      return Response.json({ config });
    }
    return Response.json({ sync: await syncCompanyCustomers(tenantId, true) });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : 'Unable to sync customers.' }, { status: 400 }); }
}
