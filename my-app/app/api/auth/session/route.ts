import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
export const dynamic = 'force-dynamic';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function GET() {
  const session = await getSession();
  
  if (session && session.userId && session.role === 'user') {
    try {
      const userDoc = await getDoc(doc(db, 'users', session.userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const mergedUser = { 
          ...session, 
          name: userData.name || session.name, 
          email: userData.email || session.email 
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