import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
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
          allowedCollections: '',
          dataSchemaDescription: ''
        }
      });
    }
  } catch (error: any) {
    console.error('Failed to fetch settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const docRef = doc(db, 'tenant_settings', session.tenantId);
    
    // Using setDoc with merge: true to avoid overwriting other settings
    await setDoc(docRef, body, { merge: true });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to save settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
