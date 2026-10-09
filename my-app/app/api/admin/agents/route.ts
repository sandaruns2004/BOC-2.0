import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const q = query(
      collection(db, 'agent_actions'),
      where('tenantId', '==', session.tenantId)
    );
    const snapshot = await getDocs(q);
    const actions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
    
    actions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Analytics processing
    let totalEmails = 0;
    let totalReports = 0;
    let successfulActions = 0;
    let failedActions = 0;

    actions.forEach(action => {
      if (action.agentType === 'email') totalEmails++;
      if (action.agentType === 'report') totalReports++;
      if (action.status === 'success') successfulActions++;
      if (action.status === 'error') failedActions++;
    });

    return NextResponse.json({
      actions,
      stats: {
        totalEmails,
        totalReports,
        successfulActions,
        failedActions
      }
    });
  } catch (error: any) {
    console.error('Failed to fetch agent actions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
