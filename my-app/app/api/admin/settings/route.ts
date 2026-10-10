import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { orderCollection, parseAllowedCollections } from '@/lib/database-access';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin' || !session.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const docRef = doc(db, 'tenant_settings', session.tenantId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return NextResponse.json(docSnap.data());
    } else {
      // Default empty settings
      return NextResponse.json({
        databaseConfig: {
          allowedCollections: 'demo_orders',
          ordersCollection: 'demo_orders',
          dataSchemaDescription: ''
        }
      });
    }
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin' || !session.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    let databaseConfig;
    try {
      const input = body?.databaseConfig;
      if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Database configuration is required.');
      const allowedCollections = parseAllowedCollections(input.allowedCollections).join(', ');
      const ordersCollection = orderCollection(input);
      if (typeof input.dataSchemaDescription !== 'string' || input.dataSchemaDescription.length > 5000) throw new Error('Collection notes must be no longer than 5,000 characters.');
      if (input.firebaseConfig !== null && (typeof input.firebaseConfig !== 'object' || Array.isArray(input.firebaseConfig) || typeof input.firebaseConfig?.projectId !== 'string' || !input.firebaseConfig.projectId.trim() || typeof input.firebaseConfig?.apiKey !== 'string' || !input.firebaseConfig.apiKey.trim())) throw new Error('Firebase config must include a projectId and apiKey, or be empty to use the platform database.');
      databaseConfig = { allowedCollections, ordersCollection, dataSchemaDescription: input.dataSchemaDescription.trim(), firebaseConfig: input.firebaseConfig };
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid database configuration.' }, { status: 400 });
    }
    const docRef = doc(db, 'tenant_settings', session.tenantId);
    
    // Using setDoc with merge: true to avoid overwriting other settings
    await setDoc(docRef, { databaseConfig }, { merge: true });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
