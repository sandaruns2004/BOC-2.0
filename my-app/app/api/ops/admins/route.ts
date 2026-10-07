import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, query, orderBy } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'ops') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const q = query(collection(db, 'business_admins'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const admins = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), passwordHash: undefined })); // hide password hash
    return NextResponse.json({ admins });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'ops') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { email, password, name, company } = await req.json();
    if (!email || !password || !name || !company) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const tenantId = `tnt_${uuidv4().split('-')[0]}`;
    const adminId = uuidv4();

    const adminData = {
      email,
      passwordHash,
      name,
      company,
      tenantId,
      createdBy: session.userId,
      isActive: true,
      createdAt: new Date().toISOString(),
      lastLogin: null
    };

    await setDoc(doc(db, 'business_admins', adminId), adminData);

    // Return without password hash
    const { passwordHash: _, ...safeAdminData } = adminData;

    return NextResponse.json({ success: true, admin: { id: adminId, ...safeAdminData } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'ops') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, isActive } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Missing admin ID' }, { status: 400 });
    }

    const { updateDoc } = await import('firebase/firestore');
    await updateDoc(doc(db, 'business_admins', id), {
      isActive
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}