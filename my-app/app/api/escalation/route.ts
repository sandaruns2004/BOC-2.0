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
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { isRecord, isText, parseTenantId } from '@/lib/request-validation';

// GET — Fetch the escalation queue for a tenant
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = parseTenantId(searchParams.get('tenantId'));
  const status = searchParams.get('status') ?? 'pending';

  if (!tenantId || !['pending', 'approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Invalid tenantId or status.' }, { status: 400 });
  }

  try {
    // Simplified query to avoid requiring Firestore composite indexes for the MVP
    const q = query(
      collection(db, 'escalations'),
      where('tenantId', '==', tenantId)
    );

    const snapshot = await getDocs(q);
    
    // Filter and sort in memory
    const allEscalations = snapshot.docs.map((doc): Record<string, unknown> & {
      status?: string;
      createdAt?: string | null;
    } => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() ?? null,
      decidedAt: doc.data().decidedAt?.toDate?.()?.toISOString() ?? null,
    }));

    const escalations = allEscalations
      .filter((e) => e.status === status)
      .sort((a, b) => {
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
    const tenantId = parseTenantId(body.tenantId);
    const { toolName, toolParameters, riskLevel, userMessage } = body;

    if (!tenantId || !isText(toolName, 100) || (userMessage !== undefined && !isText(userMessage, 8_000))) {
      return NextResponse.json(
        { error: 'tenantId and toolName are required; userMessage must be at most 8,000 characters.' },
        { status: 400 }
      );
    }

    if (toolParameters !== undefined && !isRecord(toolParameters)) {
      return NextResponse.json({ error: 'toolParameters must be an object.' }, { status: 400 });
    }

    if (riskLevel !== undefined && !['low', 'high', 'critical'].includes(riskLevel)) {
      return NextResponse.json({ error: 'Invalid riskLevel.' }, { status: 400 });
    }

    const escalationId = `ESC-${Math.floor(Math.random() * 9000) + 1000}`;

    const docRef = await addDoc(collection(db, 'escalations'), {
      escalationId,
      tenantId,
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
