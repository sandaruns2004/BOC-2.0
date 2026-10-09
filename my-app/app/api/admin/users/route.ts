import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/firebase';
import { collection, getDocs, getDocFromServer, doc, setDoc, query, where, limit } from 'firebase/firestore';
import { companyDatabase } from '@/lib/tools';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const q = query(collection(db, 'users'), where('tenantId', '==', session.tenantId));
    const snapshot = await getDocs(q);
    const users = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name, email: doc.data().email, isActive: doc.data().isActive, createdAt: doc.data().createdAt, isDemo: doc.data().isDemo === true, source: 'AgentForge' }));
    users.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const settings = await getDocFromServer(doc(db, 'tenant_settings', session.tenantId!));
    const directory = settings.data()?.customerDirectory;
    let connectedUsers: { id: string; name: string; email: string; isActive: boolean; source: string }[] = [];
    let connectionError = '';
    if (directory?.collectionName && /^[a-zA-Z0-9_-]{1,80}$/.test(directory.collectionName)) {
      try {
        const target = await companyDatabase(session.tenantId!);
        const records = await getDocs(query(collection(target, directory.collectionName), where('tenantId', '==', session.tenantId), limit(100)));
        connectedUsers = records.docs.map(record => ({ id: record.id, name: String(record.data().name || record.data().displayName || 'Customer'), email: String(record.data().email || ''), isActive: record.data().isActive !== false, source: directory.collectionName }));
      } catch { connectionError = 'Unable to read the customer collection. Check the company Firebase configuration and read permissions.'; }
    }
    return NextResponse.json({ users, connectedUsers, customerCollection: directory?.collectionName || '', connectionError });
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
    const body = await req.json();
    if (body.action === 'connectDirectory') {
      if (typeof body.collectionName !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(body.collectionName)) return NextResponse.json({ error: 'Enter a single customer collection name.' }, { status: 400 });
      await setDoc(doc(db, 'tenant_settings', session.tenantId!), { customerDirectory: { collectionName: body.collectionName } }, { merge: true });
      return NextResponse.json({ success: true });
    }
    const { email, password, name } = body;
    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userId = uuidv4();

    const userData = {
      email,
      passwordHash,
      name,
      tenantId: session.tenantId,
      isActive: true,
      createdAt: new Date().toISOString(),
      lastLogin: null
    };

    await setDoc(doc(db, 'users', userId), userData);
    const { passwordHash: _, ...safeUserData } = userData;

    return NextResponse.json({ success: true, user: { id: userId, ...safeUserData } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { userId, isActive } = await req.json();
    if (typeof userId !== 'string' || !userId || userId.includes('/') || typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existing = await getDocFromServer(doc(db, 'users', userId));
    if (!existing.exists() || existing.data().tenantId !== session.tenantId) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    await setDoc(doc(db, 'users', userId), { isActive }, { merge: true });

    return NextResponse.json({ success: true, isActive });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
