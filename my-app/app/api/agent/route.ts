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
import { isRecord, isText, parseTenantId } from '@/lib/request-validation';

// GET — Load the active agent config for a tenant
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = parseTenantId(searchParams.get('tenantId'));

  if (!tenantId) {
    return NextResponse.json({ error: 'Invalid tenantId.' }, { status: 400 });
  }

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
        guardrailRules: { blockInjections: true, scrubPii: true },
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

  const tenantId = parseTenantId(body.tenantId);

  if (!tenantId) {
    return NextResponse.json({ error: 'Invalid tenantId.' }, { status: 400 });
  }

  if (body.systemPrompt !== undefined && !isText(body.systemPrompt, 8_000)) {
    return NextResponse.json(
      { error: 'systemPrompt must be between 1 and 8,000 characters.' },
      { status: 400 }
    );
  }

  if (body.modelPreference !== undefined && !['flash', 'pro'].includes(body.modelPreference)) {
    return NextResponse.json({ error: 'Invalid modelPreference.' }, { status: 400 });
  }

  if (
    body.refundLimit !== undefined &&
    (!Number.isFinite(body.refundLimit) || body.refundLimit < 0 || body.refundLimit > 100_000)
  ) {
    return NextResponse.json({ error: 'refundLimit must be between 0 and 100,000.' }, { status: 400 });
  }

  if (
    body.allowedTools !== undefined &&
    (!Array.isArray(body.allowedTools) || body.allowedTools.length > 20 || !body.allowedTools.every((tool) => isText(tool, 100)))
  ) {
    return NextResponse.json({ error: 'allowedTools must contain up to 20 valid tool names.' }, { status: 400 });
  }

  if (body.guardrailRules !== undefined && !isRecord(body.guardrailRules)) {
    return NextResponse.json({ error: 'guardrailRules must be an object.' }, { status: 400 });
  }

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
      scrubPii: true,
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
