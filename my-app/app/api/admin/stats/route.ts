import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/firebase';
import { collection, query, where, getCountFromServer, getAggregateFromServer, sum } from 'firebase/firestore';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const tenantId = session.tenantId;

    // 1. Total End Users
    const usersQ = query(collection(db, 'users'), where('tenantId', '==', tenantId));
    const usersSnap = await getCountFromServer(usersQ);
    const totalUsers = usersSnap.data().count;

    // 2. Knowledge Base Docs
    const docsQ = query(collection(db, 'documents'), where('tenantId', '==', tenantId));
    const docsSnap = await getCountFromServer(docsQ);
    const totalDocs = docsSnap.data().count;

    // 3. Token Usage Approximation (API keys + Chat history invocations)
    const keysQ = query(collection(db, 'api_keys'), where('tenantId', '==', tenantId));
    const keysSnap = await getAggregateFromServer(keysQ, { totalUsage: sum('usageCount') });
    
    const chatQ = query(collection(db, 'chat_history'), where('tenantId', '==', tenantId));
    const chatSnap = await getCountFromServer(chatQ);
    
    const tokenUsage = (keysSnap.data().totalUsage || 0) + chatSnap.data().count;

    // 4. Escalations
    const escQ = query(collection(db, 'escalations'), where('tenantId', '==', tenantId));
    const escSnap = await getCountFromServer(escQ);
    const totalEscalations = escSnap.data().count;

    return NextResponse.json({
      totalUsers,
      totalDocs,
      tokenUsage,
      totalEscalations
    });
  } catch (error: any) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
