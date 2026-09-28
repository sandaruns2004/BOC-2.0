// ============================================================
// AgentForge — Escalation Queue API
// GET  /api/escalation        — List all pending escalations
// POST /api/escalation        — Create a manual escalation
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';

// GET — Fetch the escalation queue for a tenant
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') ?? 'acme_corp';
  const status = searchParams.get('status') ?? 'pending';

  try {
    // Simplified query to avoid requiring Firestore composite indexes for the MVP
    const q = query(
      collection(db, 'escalations'),
      where('tenantId', '==', tenantId)
    );

    const snapshot = await getDocs(q);
    
    // Filter and sort in memory
    const allEscalations = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() ?? null,
      decidedAt: doc.data().decidedAt?.toDate?.()?.toISOString() ?? null,
    }));

    const escalations = allEscalations
      .filter((e: any) => e.status === status)
      .sort((a: any, b: any) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA; // Descending
      });

    return NextResponse.json({ escalations, count: escalations.length });
  } catch (error) {
    console.error('[Escalation API] GET failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch escalations.' },
      { status: 500 }
    );
  }
}

// POST — Manually create an escalation (e.g. from admin dashboard)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantId, toolName, toolParameters, riskLevel, userMessage } = body;

    const escalationId = `ESC-${Math.floor(Math.random() * 9000) + 1000}`;

    const docRef = await addDoc(collection(db, 'escalations'), {
      escalationId,
      tenantId: tenantId ?? 'acme_corp',
      toolName,
      toolParameters,
      riskLevel: riskLevel ?? 'high',
      userMessage,
      status: 'pending',
      adminId: null,
      adminNote: null,
      decidedAt: null,
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({ escalationId, docId: docRef.id }, { status: 201 });
  } catch (error) {
    console.error('[Escalation API] POST failed:', error);
    return NextResponse.json(
      { error: 'Failed to create escalation.' },
      { status: 500 }
    );
  }
}
