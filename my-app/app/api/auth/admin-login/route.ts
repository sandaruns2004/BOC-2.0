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
    const q = query(collection(db, 'business_admins'), where('email', '==', email), where('isActive', '==', true));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return NextResponse.json({ error: 'Invalid credentials or disabled account' }, { status: 401 });
    }

    const adminDoc = snapshot.docs[0];
    const admin = adminDoc.data();

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    await createSession({
      userId: adminDoc.id,
      role: 'admin',
      tenantId: admin.tenantId,
      email: admin.email,
      name: admin.name
    });

    return NextResponse.json({ success: true, tenantId: admin.tenantId });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}