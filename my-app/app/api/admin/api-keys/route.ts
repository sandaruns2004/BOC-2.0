import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, query, where, orderBy, deleteDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const q = query(collection(db, 'api_keys'), where('tenantId', '==', session.tenantId));
    const snapshot = await getDocs(q);
    const keys = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    keys.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ keys });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name } = await req.json();
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const keyId = uuidv4();
    const rawKey = `af_${crypto.randomBytes(24).toString('hex')}`;
    // In production we should hash this, but we need to display it once, or just hash it for verification later.
    // For demo, we store it in plaintext but warn the user.
    const keyData = {
      name,
      key: rawKey,
      tenantId: session.tenantId,
      createdBy: session.userId,
      isActive: true,
      lastUsed: null,
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'api_keys', keyId), keyData);

    return NextResponse.json({ success: true, key: { id: keyId, ...keyData } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const keyId = searchParams.get('id');

    if (!keyId) {
      return NextResponse.json({ error: 'Key ID is required' }, { status: 400 });
    }

    await deleteDoc(doc(db, 'api_keys', keyId));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}