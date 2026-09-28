// ============================================================
// AgentForge — Escalation Decision API
// PATCH /api/escalation/[id]  — Approve or Reject an escalation
// GET   /api/escalation/[id]  — Get a single escalation's details
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { isText } from '@/lib/request-validation';

// GET — Fetch a single escalation by its escalationId (e.g. ESC-9082)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // First try to find by escalationId field
    const q = query(
      collection(db, 'escalations'),
      where('escalationId', '==', id)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return NextResponse.json(
        { error: `Escalation ${id} not found.` },
        { status: 404 }
      );
    }

    const docData = snapshot.docs[0];
    return NextResponse.json({
      id: docData.id,
      ...docData.data(),
      createdAt: docData.data().createdAt?.toDate?.()?.toISOString() ?? null,
      decidedAt: docData.data().decidedAt?.toDate?.()?.toISOString() ?? null,
    });
  } catch (error) {
    console.error('[Escalation API] GET by ID failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch escalation.' },
      { status: 500 }
    );
  }
}

// PATCH — Approve or Reject an escalation
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: {
    decision: 'approved' | 'rejected';
    adminId?: string;
    adminNote?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { decision, adminId = 'admin@agentforge.ai', adminNote = '' } = body;

  if (!['approved', 'rejected'].includes(decision)) {
    return NextResponse.json(
      { error: "Decision must be either 'approved' or 'rejected'." },
      { status: 400 }
    );
  }

  if (!isText(adminId, 320) || !isText(adminNote, 2_000)) {
    return NextResponse.json(
      { error: 'A valid adminId and a review note of up to 2,000 characters are required.' },
      { status: 400 }
    );
  }

  try {
    // Find the document by escalationId field
    const q = query(
      collection(db, 'escalations'),
      where('escalationId', '==', id)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return NextResponse.json(
        { error: `Escalation ${id} not found.` },
        { status: 404 }
      );
    }

    const docRef = doc(db, 'escalations', snapshot.docs[0].id);

    await updateDoc(docRef, {
      status: decision,
      adminId,
      adminNote,
      decidedAt: serverTimestamp(),
    });

    return NextResponse.json({
      escalationId: id,
      status: decision,
      adminId,
      message: `Escalation ${id} has been ${decision}.`,
    });
  } catch (error) {
    console.error('[Escalation API] PATCH failed:', error);
    return NextResponse.json(
      { error: 'Failed to update escalation.' },
      { status: 500 }
    );
  }
}
