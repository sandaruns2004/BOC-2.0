import { NextResponse } from 'next/server';
import { createSession } from '@/lib/session';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  }

  try {
    const q = query(collection(db, 'users'), where('email', '==', email), where('isActive', '==', true));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return NextResponse.json({ error: 'Invalid credentials or disabled account' }, { status: 401 });
    }

    const userDoc = snapshot.docs[0];
    const user = userDoc.data();

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    await createSession({
      userId: userDoc.id,
      role: 'user',
      tenantId: user.tenantId,
      email: user.email,
      name: user.name
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}