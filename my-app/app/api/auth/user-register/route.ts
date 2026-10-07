import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { name, email, password, tenantId } = await req.json();

    if (!name || !email || !password || !tenantId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Check if the tenant actually exists
    const adminQuery = query(collection(db, 'business_admins'), where('tenantId', '==', tenantId));
    const adminSnapshot = await getDocs(adminQuery);
    if (adminSnapshot.empty) {
      return NextResponse.json({ error: 'Invalid Organization Tenant ID' }, { status: 400 });
    }

    // 2. Check if a user with this email already exists in this tenant
    const userQuery = query(
      collection(db, 'users'),
      where('tenantId', '==', tenantId),
      where('email', '==', email)
    );
    const userSnapshot = await getDocs(userQuery);
    
    if (!userSnapshot.empty) {
      return NextResponse.json({ error: 'An account with this email already exists in this organization' }, { status: 400 });
    }

    // 3. Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    const userId = uuidv4();

    // 4. Create the user with isActive: false (pending admin verification)
    const userData = {
      email,
      passwordHash,
      name,
      tenantId,
      isActive: false, // Must be verified by the admin
      createdBy: 'self_registered',
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