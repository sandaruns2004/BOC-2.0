import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
export const dynamic = 'force-dynamic';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function GET() {
  const session = await getSession();
  
  if (session && session.userId) {
    try {
      let docData = null;
      if (session.role === 'user') {
        const userDoc = await getDoc(doc(db, 'users', session.userId));
        if (userDoc.exists()) docData = userDoc.data();
      } else if (session.role === 'admin') {
        const adminDoc = await getDoc(doc(db, 'business_admins', session.userId));
        if (adminDoc.exists()) docData = adminDoc.data();
      }

      if (docData) {
        const mergedUser = { 
          ...session, 
          name: docData.name || session.name, 
          email: docData.email || session.email,
          tenantId: docData.tenantId || session.tenantId 
        };
        console.log('Merged session user:', mergedUser);
        return NextResponse.json({ user: mergedUser });
      }
    } catch (e) {
      console.error('Error fetching fresh user data for session:', e);
    }
  }
  
  console.log('Returning stale session:', session);
  return NextResponse.json({ user: session });
}