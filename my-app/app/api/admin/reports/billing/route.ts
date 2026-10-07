import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const tenantId = session.tenantId;

    const keysQ = query(collection(db, 'api_keys'), where('tenantId', '==', tenantId));
    const keysSnap = await getDocs(keysQ);
    
    const chatQ = query(collection(db, 'chat_history'), where('tenantId', '==', tenantId));
    const chatSnap = await getDocs(chatQ);

    let csvContent = 'Date,Type,Description,Tokens Consumed\n';
    
    // In a real app we would iterate through actual timestamped usage logs.
    // Here we aggregate the totals from keys and chats.
    const now = new Date().toISOString().split('T')[0];

    keysSnap.forEach(doc => {
      const data = doc.data();
      csvContent += `${now},API Key,Key: ${data.key.substring(0,8)}...,${data.usageCount || 0}\n`;
    });

    let totalChatTokens = chatSnap.docs.length;
    csvContent += `${now},Chat UI,End User Web Portal,${totalChatTokens}\n`;

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="billing_report_${tenantId}.csv"`
      }
    });
  } catch (error: any) {
    console.error('Error generating billing report:', error);
    return new Response('Failed to generate report', { status: 500 });
  }
}
