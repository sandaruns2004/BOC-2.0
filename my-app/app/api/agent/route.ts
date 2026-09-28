// ============================================================
// AgentForge — Agent Configuration API
// GET  /api/agent?tenantId=xxx  — Load saved agent config
// POST /api/agent               — Save / deploy agent config
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';

// GET — Load the active agent config for a tenant
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') ?? 'acme_corp';

  try {
    const q = query(
      collection(db, 'agents'),
      where('tenantId', '==', tenantId)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // Return safe defaults if no config exists yet
      return NextResponse.json({
        tenantId,
        systemPrompt: `You are a helpful customer service agent for ${tenantId}. Be concise and professional.`,
        modelPreference: 'flash',
        refundLimit: 100,
        allowedTools: ['check_order', 'issue_refund'],
        guardrailRules: { blockInjections: true, scrubbPii: true },
        deployed: false,
      });
    }

    const agentData = snapshot.docs[0].data();
    return NextResponse.json({
      id: snapshot.docs[0].id,
      ...agentData,
      createdAt: agentData.createdAt?.toDate?.()?.toISOString() ?? null,
      updatedAt: agentData.updatedAt?.toDate?.()?.toISOString() ?? null,
    });
  } catch (error) {
    console.error('[Agent API] GET failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent config.' },
      { status: 500 }
    );
  }
}

// POST — Save and deploy an agent configuration
export async function POST(req: NextRequest) {
  let body: {
    tenantId?: string;
    systemPrompt?: string;
    modelPreference?: 'flash' | 'pro';
    refundLimit?: number;
    allowedTools?: string[];
    guardrailRules?: Record<string, unknown>;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const tenantId = body.tenantId ?? 'acme_corp';

  const agentConfig = {
    tenantId,
    systemPrompt:
      body.systemPrompt ??
      `You are a helpful customer service agent for ${tenantId}.`,
    modelPreference: body.modelPreference ?? 'flash',
    refundLimit: body.refundLimit ?? 100,
    allowedTools: body.allowedTools ?? ['check_order'],
    guardrailRules: body.guardrailRules ?? {
      blockInjections: true,
      scrubbPii: true,
    },
    deployed: true,
    updatedAt: serverTimestamp(),
  };

  try {
    // Use tenantId as the document ID so each tenant has one active config
    await setDoc(doc(db, 'agents', tenantId), agentConfig, { merge: true });

    return NextResponse.json({
      message: `Agent for tenant '${tenantId}' deployed successfully.`,
      tenantId,
      deployed: true,
    });
  } catch (error) {
    console.error('[Agent API] POST failed:', error);
    return NextResponse.json(
      { error: 'Failed to save agent config.' },
      { status: 500 }
    );
  }
}
