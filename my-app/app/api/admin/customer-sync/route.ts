import { doc, getDocFromServer, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getSession } from '@/lib/session';
import { customerSyncSettings, syncCompanyCustomers, validateCustomerSync } from '@/lib/customer-sync';
import { assertCustomerSyncConnection } from '@/lib/database-access';

export const maxDuration = 60;
async function adminTenant() {
  const session = await getSession();
  if (!session || session.role !== 'admin' || !session.tenantId) return null;
  const admin = (await getDocFromServer(doc(db, 'business_admins', session.userId))).data();
  return admin?.isActive === true && admin.tenantId === session.tenantId ? session.tenantId : null;
}
export async function GET() {
  try {
    const tenantId = await adminTenant();
    if (!tenantId) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { settings, config } = await customerSyncSettings(tenantId);
    const state = (await getDocFromServer(doc(db, 'customer_sync_state', tenantId))).data();
    return Response.json({ config, connected: Boolean(settings?.databaseConfig?.firebaseConfig?.projectId), state: state ? { status: state.status, lastSyncedAt: state.lastSyncedAt, importedCount: state.importedCount, error: state.error } : null }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return Response.json({ error: 'Unable to load customer sync settings.' }, { status: 503 }); }
}
export async function POST(req: Request) {
  let tenantId;
  try { tenantId = await adminTenant(); }
  catch { return Response.json({ error: 'Unable to verify company admin access.' }, { status: 503 }); }
  if (!tenantId) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    if (body.action !== 'sync') {
      const config = validateCustomerSync(body.config);
      await runTransaction(db, async transaction => {
        const ref = doc(db, 'tenant_settings', tenantId);
        const settings = (await transaction.get(ref)).data();
        assertCustomerSyncConnection(settings?.databaseConfig, config, process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
        transaction.set(ref, { customerSync: config }, { mergeFields: ['customerSync'] });
        transaction.set(doc(db, 'customer_sync_state', tenantId), { completedAt: 0 }, { merge: true });
      });
      return Response.json({ config });
    }
    return Response.json({ sync: await syncCompanyCustomers(tenantId, true) });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : 'Unable to sync customers.' }, { status: 400 }); }
}
