import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocsFromServer } from 'firebase/firestore';
export async function GET() {
  const session = await getSession();
  if (session?.role !== 'admin' || !session.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const records = await getDocsFromServer(query(collection(db, 'chat_history'), where('tenantId', '==', session.tenantId)));
    const dateFormat = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Colombo', year: 'numeric', month: 'short', day: 'numeric' });
    const timeline = Array.from({ length: 7 }, (_, index) => ({ date: dateFormat.format(new Date(Date.now() - (6 - index) * 86400000)), chats: 0 }));
    const buckets = new Map(timeline.map(entry => [entry.date, entry]));
    for (const record of records.docs) {
      const createdAt = record.data().createdAt;
      const date = typeof createdAt === 'string' ? new Date(createdAt) : createdAt?.toDate?.();
      if (date && !Number.isNaN(date.getTime())) { const bucket = buckets.get(dateFormat.format(date)); if (bucket) bucket.chats += 1; }
    }
    return NextResponse.json({ timeline });
  } catch { return NextResponse.json({ error: 'Unable to load recorded chats.' }, { status: 500 }); }
}
