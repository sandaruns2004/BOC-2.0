// ============================================================
// AgentForge — Decision Traces API
// GET /api/traces?tenantId=xxx&limit=20  — Fetch trace history
// GET /api/traces?traceId=tr_xxxx        — Fetch one full trace
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  getDocs,
} from 'firebase/firestore';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') ?? 'acme_corp';
  const traceId = searchParams.get('traceId');
  const limitParam = parseInt(searchParams.get('limit') ?? '20', 10);

  try {
    if (traceId) {
      // Fetch all steps of a specific trace (for /replay page)
      const q = query(
        collection(db, 'traces'),
        where('traceId', '==', traceId)
      );
      const snapshot = await getDocs(q);
      const allSteps = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        timestamp: d.data().timestamp?.toDate?.()?.toISOString() ?? null,
      }));
      
      const steps = allSteps.sort((a, b) => (a.stepOrder as number) - (b.stepOrder as number));

      return NextResponse.json({ traceId, steps, stepCount: steps.length });
    }

    // Fetch summary of recent traces for a tenant
    const q = query(
      collection(db, 'trace_summaries'),
      where('tenantId', '==', tenantId)
    );
    const snapshot = await getDocs(q);
    const allTraces = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      timestamp: d.data().timestamp?.toDate?.()?.toISOString() ?? null,
    }));
    
    const traces = allTraces
      .sort((a, b) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeB - timeA;
      })
      .slice(0, limitParam);

    return NextResponse.json({ traces, count: traces.length });
  } catch (error) {
    console.error('[Traces API] GET failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch traces.' },
      { status: 500 }
    );
  }
}
