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

    // Fetch real token usage to anchor today's data
    const keysQ = query(collection(db, 'api_keys'), where('tenantId', '==', tenantId));
    const keysSnap = await getDocs(keysQ);
    let apiUsage = 0;
    keysSnap.forEach(doc => { apiUsage += (doc.data().usageCount || 0); });
    
    const chatQ = query(collection(db, 'chat_history'), where('tenantId', '==', tenantId));
    const chatSnap = await getDocs(chatQ);

    // Initialize 7-day timeline with 0s
    const timeline = [];
    const now = new Date();
    
    // Create an object to quickly map date strings to their index in the timeline
    const dateMap: Record<string, number> = {};

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      timeline.push({
        date: dateStr,
        tokens: 0,
        chats: 0
      });
      dateMap[dateStr] = 6 - i;
    }

    // Bucket real chat history by date
    chatSnap.forEach(doc => {
      const data = doc.data();
      if (data.createdAt) {
        const d = new Date(data.createdAt);
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (dateMap[dateStr] !== undefined) {
          const idx = dateMap[dateStr];
          timeline[idx].chats += 1;
          timeline[idx].tokens += 1; // 1 token per chat interaction placeholder
        }
      }
    });

    // Add API key usage (which lacks historical timestamps) entirely to today's token bucket
    const todayStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (dateMap[todayStr] !== undefined) {
      timeline[dateMap[todayStr]].tokens += apiUsage;
    }

    return NextResponse.json({ timeline });
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}