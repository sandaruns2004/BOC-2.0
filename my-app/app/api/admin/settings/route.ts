import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/firebase';
import { doc, getDocFromServer, runTransaction } from 'firebase/firestore';
import { assertCustomerSyncConnection, validateDatabaseConfig } from '@/lib/database-access';

class InvalidSettings extends Error {}
async function adminTenant() {
  const session = await getSession();
  if (session?.role !== 'admin' || !session.tenantId) return null;
  const admin = (await getDocFromServer(doc(db, 'business_admins', session.userId))).data();
  return admin?.isActive === true && admin.tenantId === session.tenantId ? session.tenantId : null;
}

export async function GET() {
  try {
    const tenantId = await adminTenant();
    if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const settings = await getDocFromServer(doc(db, 'tenant_settings', tenantId));
    return NextResponse.json(settings.exists() ? settings.data() : {
      databaseConfig: { allowedCollections: 'demo_orders', ordersCollection: 'demo_orders', dataSchemaDescription: '', firebaseConfig: null },
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Unable to load company settings.' }, { status: 503 });
  }
}

export async function POST(req: Request) {
  try {
    const tenantId = await adminTenant();
    if (!tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    let databaseConfig;
    try { databaseConfig = validateDatabaseConfig((await req.json()).databaseConfig); }
    catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid database configuration.' }, { status: 400 }); }
    const ref = doc(db, 'tenant_settings', tenantId);
    await runTransaction(db, async transaction => {
      const current = (await transaction.get(ref)).data();
      try { assertCustomerSyncConnection(databaseConfig, current?.customerSync, process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID); }
      catch (error) { throw new InvalidSettings(error instanceof Error ? error.message : 'Invalid customer sync connection.'); }
      // Replace the map so a changed project cannot retain old connection fields.
      // The independently saved widget and customer sync settings are preserved.
      transaction.set(ref, { databaseConfig }, { mergeFields: ['databaseConfig'] });
    });
    return NextResponse.json({ success: true, databaseConfig });
  } catch (error) {
    return NextResponse.json({ error: error instanceof InvalidSettings ? error.message : 'Unable to save company settings.' }, { status: error instanceof InvalidSettings ? 400 : 503 });
  }
}
