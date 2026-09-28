// ============================================================
// AgentForge — Escalation Queue API
// GET   /api/escalation  — List all pending escalations
// POST  /api/escalation  — Create a manual escalation
// PATCH /api/escalation  — Approve or reject an escalation
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';

// GET — Fetch the escalation queue for a tenant
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') ?? 'acme_corp';
  const status = searchParams.get('status') ?? 'pending';

  try {
    const q = query(
      collection(db, 'escalations'),
      where('tenantId', '==', tenantId)
    );

    const snapshot = await getDocs(q);

    const allEscalations = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.()?.toISOString() ?? null,
      decidedAt: d.data().decidedAt?.toDate?.()?.toISOString() ?? null,
    }));

    const escalations = allEscalations
      .filter((e: any) => e.status === status)
      .sort((a: any, b: any) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });

    return NextResponse.json({ escalations, count: escalations.length });
  } catch (error) {
    console.error('[Escalation API] GET failed:', error);
    return NextResponse.json({ error: 'Failed to fetch escalations.' }, { status: 500 });
  }
}

// POST — Manually create an escalation
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
    return NextResponse.json({ error: 'Failed to create escalation.' }, { status: 500 });
  }
}

// PATCH — Approve or reject a pending escalation
// Body: { id: string, decision: 'approved' | 'rejected', adminNote?: string, adminId?: string }
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, decision, adminNote, adminId } = body;

    if (!id || !decision) {
      return NextResponse.json(
        { error: 'Missing required fields: id and decision.' },
        { status: 400 }
      );
    }

    if (!['approved', 'rejected'].includes(decision)) {
      return NextResponse.json(
        { error: 'decision must be "approved" or "rejected".' },
        { status: 400 }
      );
    }

    const escalationRef = doc(db, 'escalations', id);

    await updateDoc(escalationRef, {
      status: decision,
      adminNote: adminNote ?? null,
      adminId: adminId ?? 'admin',
      decidedAt: serverTimestamp(),
    });

    console.log(`[Escalation API] ${id} → ${decision}`);

    return NextResponse.json({
      success: true,
      id,
      decision,
      message: `Escalation ${decision} successfully.`,
    });
  } catch (error) {
    console.error('[Escalation API] PATCH failed:', error);
    return NextResponse.json(
      { error: 'Failed to update escalation decision.' },
      { status: 500 }
    );
  }
}
