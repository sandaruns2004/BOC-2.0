import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, query, where, orderBy } from 'firebase/firestore';
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
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), passwordHash: undefined }));
    users.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ users });
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
    const { email, password, name } = await req.json();
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
    if (!userId || typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await setDoc(doc(db, 'users', userId), { isActive }, { merge: true });

    return NextResponse.json({ success: true, isActive });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}