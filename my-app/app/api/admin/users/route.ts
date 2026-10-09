import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/firebase';
import { collection, getDocsFromServer, getDocFromServer, doc, setDoc, query, where } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { syncCompanyCustomers } from '@/lib/customer-sync';

export const maxDuration = 60;

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const admin = (await getDocFromServer(doc(db, 'business_admins', session.userId))).data();
    if (!session.tenantId || admin?.isActive !== true || admin.tenantId !== session.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    let sync;
    try { sync = await syncCompanyCustomers(session.tenantId); }
    catch { sync = { enabled: true, status: 'error', error: 'Customer sync failed. Check Company Settings. Previously imported users are still shown.' }; }
    const q = query(collection(db, 'users'), where('tenantId', '==', session.tenantId));
    const snapshot = await getDocsFromServer(q);
    const users = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name, email: doc.data().email, isActive: doc.data().isActive, createdAt: doc.data().createdAt, isDemo: doc.data().isDemo === true, source: doc.data().source || 'AgentForge', externalCustomerId: doc.data().externalCustomerId || null }));
    users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ users, sync }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to load users.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();

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
    const safeUserData = { email, name, tenantId: session.tenantId, isActive: true, createdAt: userData.createdAt, lastLogin: null };

    return NextResponse.json({ success: true, user: { id: userId, ...safeUserData } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to create user.' }, { status: 500 });
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
    const imported = existing.data().source === 'Company database';
    const effectiveActive = imported ? isActive && existing.data().externalActive === true : isActive;
    await setDoc(doc(db, 'users', userId), { isActive: effectiveActive, ...(imported ? { accessDisabled: !isActive } : {}) }, { merge: true });

    return NextResponse.json({ success: true, isActive: effectiveActive });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to update user.' }, { status: 500 });
  }
}
