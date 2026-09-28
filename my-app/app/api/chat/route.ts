// ============================================================
// AgentForge — Main Chat API Endpoint
// POST /api/chat
//
// This is the core "brain" of the MVP monolith.
// It runs the full agent pipeline in a single Cloud Run instance:
//   1. L1 Input Guardrails (injection detection + PII scrubbing)
//   2. LLM Call (Gemini Flash via Google AI Studio)
//   3. L2 Output Guardrails (risk classification)
//   4. L3 Human Escalation (Firestore queue if high-risk)
//   5. Decision Trace logging (async, non-blocking)
// ============================================================

import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import {
  runInputGuardrails,
  runOutputGuardrails,
  detectToolCall,
} from '@/lib/guardrails';
import { logTraceStep, logCompletedTrace } from '@/lib/trace-logger';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { isRecord, isText, parseTenantId } from '@/lib/request-validation';

const MAX_MESSAGE_LENGTH = 8_000;
const MODEL_BY_PREFERENCE = {
  flash: 'gemini-2.5-flash',
  pro: 'gemini-2.5-pro',
} as const;

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const traceId = `tr_${uuidv4().slice(0, 8)}`;

  let requestBody: {
    message: string;
    tenantId?: string;
    sessionId?: string;
    agentConfig?: {
      systemPrompt?: string;
      refundLimit?: number;
      modelPreference?: 'flash' | 'pro';
    };
  };

  try {
    requestBody = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { message, agentConfig = {} } = requestBody;
  const tenantId = parseTenantId(requestBody.tenantId);
  const sessionId = typeof requestBody.sessionId === 'string' && requestBody.sessionId.length <= 128
    ? requestBody.sessionId
    : uuidv4();

  if (!tenantId || !isText(message, MAX_MESSAGE_LENGTH)) {
    return NextResponse.json(
      { error: `Message is required and must be at most ${MAX_MESSAGE_LENGTH.toLocaleString()} characters. Tenant ID must be valid.` },
      { status: 400 }
    );
  }

  if (!isRecord(agentConfig)) {
    return NextResponse.json({ error: 'agentConfig must be an object.' }, { status: 400 });
  }

  if (agentConfig.systemPrompt !== undefined && !isText(agentConfig.systemPrompt, 8_000)) {
    return NextResponse.json({ error: 'systemPrompt must be between 1 and 8,000 characters.' }, { status: 400 });
  }

  if (agentConfig.refundLimit !== undefined && (!Number.isFinite(agentConfig.refundLimit) || agentConfig.refundLimit < 0 || agentConfig.refundLimit > 100_000)) {
    return NextResponse.json({ error: 'refundLimit must be between 0 and 100,000.' }, { status: 400 });
  }

  if (agentConfig.modelPreference !== undefined && !['flash', 'pro'].includes(agentConfig.modelPreference)) {
    return NextResponse.json({ error: 'Invalid modelPreference.' }, { status: 400 });
  }

  const systemPrompt =
    agentConfig.systemPrompt ||
    `You are a helpful, professional customer service agent for ${tenantId}. 
     Be concise, accurate, and empathetic. 
     If asked to do something that requires processing a refund or cancelling a subscription, 
     describe what you would do and the amount involved.`;

  const refundLimit = agentConfig.refundLimit ?? 100;
  const modelName = MODEL_BY_PREFERENCE[agentConfig.modelPreference ?? 'flash'];

  // ────────────────────────────────────────────────────────────────
  // STEP 1 — L1 INPUT GUARDRAILS
  // ────────────────────────────────────────────────────────────────
  const l1Start = Date.now();
  const guardrailResult = runInputGuardrails(message);
  const l1Duration = Date.now() - l1Start;

  // Log this step (fire-and-forget — never blocks the response)
  logTraceStep({
    traceId, sessionId, tenantId,
    stepOrder: 1,
    stepType: 'INPUT_INSPECT',
    durationMs: l1Duration,
    status: guardrailResult.blocked ? 'block' : 'pass',
    details: {
      piiFound: guardrailResult.piiFound,
      piiTypes: guardrailResult.piiTypes,
      injectionDetected: guardrailResult.injectionDetected,
      blocked: guardrailResult.blocked,
      blockReason: guardrailResult.blockReason || null,
    },
  });

  // If injection detected, block immediately — never call the LLM
  if (guardrailResult.blocked) {
    return NextResponse.json(
      {
        error: guardrailResult.blockReason,
        traceId,
        blocked: true,
        guardrail: {
          injectionDetected: guardrailResult.injectionDetected,
          piiFound: guardrailResult.piiFound,
          piiTypes: guardrailResult.piiTypes,
        },
      },
      { status: 400 }
    );
  }

  // ────────────────────────────────────────────────────────────────
  // STEP 2 — LLM CALL (Gemini Flash)
  // ────────────────────────────────────────────────────────────────
  const llmStart = Date.now();
  let llmResponse = '';
  let promptTokens = 0;
  let completionTokens = 0;

  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'The AI engine is not configured. Set GEMINI_API_KEY and restart the service.', traceId },
        { status: 503 }
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: systemPrompt,
    });

    const result = await model.generateContent(guardrailResult.scrubbedMessage);
    llmResponse = result.response.text();

    // Token counts (may not be available in all SDK versions)
    const usage = result.response.usageMetadata;
    promptTokens = usage?.promptTokenCount ?? 0;
    completionTokens = usage?.candidatesTokenCount ?? 0;
  } catch (llmError) {
    console.error('[Chat API] LLM call failed:', llmError);
    return NextResponse.json(
      {
        error: 'The AI engine is temporarily unavailable. Please try again.',
        traceId,
      },
      { status: 503 }
    );
  }

  const llmDuration = Date.now() - llmStart;

  logTraceStep({
    traceId, sessionId, tenantId,
    stepOrder: 2,
    stepType: 'LLM_CALL',
    durationMs: llmDuration,
    status: 'pass',
    details: {
      model: modelName,
      promptTokens,
      completionTokens,
      piiWasScrubbed: guardrailResult.piiFound,
    },
  });

  // ────────────────────────────────────────────────────────────────
  // STEP 3 — L2 OUTPUT GUARDRAILS
  // ────────────────────────────────────────────────────────────────
  const l2Start = Date.now();
  // Evaluate the requested action as well as the model wording. This avoids a
  // safety bypass when a model paraphrases a destructive request without its amount.
  const detectedToolCall = detectToolCall(`${message}\n${llmResponse}`);
  const outputGuardrail = runOutputGuardrails(detectedToolCall, refundLimit);
  const l2Duration = Date.now() - l2Start;

  logTraceStep({
    traceId, sessionId, tenantId,
    stepOrder: 3,
    stepType: 'OUTPUT_GUARDRAIL',
    durationMs: l2Duration,
    status:
      outputGuardrail.action === 'ESCALATE_TO_HUMAN' ? 'escalate' : 'pass',
    details: {
      action: outputGuardrail.action,
      riskLevel: outputGuardrail.riskLevel,
      toolDetected: detectedToolCall?.name ?? null,
      toolParameters: detectedToolCall?.parameters ?? null,
      reason: outputGuardrail.reason ?? null,
    },
  });

  // ────────────────────────────────────────────────────────────────
  // STEP 4 — L3 HUMAN ESCALATION (if needed)
  // ────────────────────────────────────────────────────────────────
  if (outputGuardrail.action === 'ESCALATE_TO_HUMAN') {
    const escalationId = `ESC-${Math.floor(Math.random() * 9000) + 1000}`;

    try {
      await addDoc(collection(db, 'escalations'), {
        escalationId,
        traceId,
        sessionId,
        tenantId,
        toolName: detectedToolCall?.name || null,
        toolParameters: detectedToolCall?.parameters || null,
        riskLevel: outputGuardrail.riskLevel || null,
        riskReason: outputGuardrail.reason || null,
        agentSummary: llmResponse,
        userMessage: guardrailResult.scrubbedMessage,
        status: 'pending',
        adminId: null,
        adminNote: null,
        decidedAt: null,
        createdAt: serverTimestamp(),
      });
    } catch (dbError) {
      console.error('[Chat API] Failed to create escalation:', dbError);
    }

    logTraceStep({
      traceId, sessionId, tenantId,
      stepOrder: 4,
      stepType: 'ESCALATION',
      durationMs: 0,
      status: 'escalate',
      details: { escalationId, riskLevel: outputGuardrail.riskLevel },
    });

    const totalDuration = Date.now() - startTime;

    // Async audit log — never blocks user response
    logCompletedTrace({
      traceId, sessionId, tenantId,
      totalDurationMs: totalDuration,
      modelUsed: modelName,
      promptTokens, completionTokens,
      piiDetected: guardrailResult.piiFound,
      escalated: true, blocked: false,
      toolCalled: detectedToolCall?.name,
    });

    return NextResponse.json({
      response:
        "I've flagged this action for human review. A manager will be notified and will respond shortly. Your session is safely held in memory.",
      traceId,
      sessionId,
      escalated: true,
      escalationId,
      riskLevel: outputGuardrail.riskLevel,
      guardrail: {
        piiFound: guardrailResult.piiFound,
        piiTypes: guardrailResult.piiTypes,
      },
      meta: {
        totalDurationMs: totalDuration,
        model: modelName,
        promptTokens,
        completionTokens,
      },
    });
  }

  // ────────────────────────────────────────────────────────────────
  // STEP 5 — RETURN SUCCESSFUL RESPONSE
  // ────────────────────────────────────────────────────────────────
  const totalDuration = Date.now() - startTime;

  // Async audit log
  logCompletedTrace({
    traceId, sessionId, tenantId,
    totalDurationMs: totalDuration,
    modelUsed: modelName,
    promptTokens, completionTokens,
    piiDetected: guardrailResult.piiFound,
    escalated: false, blocked: false,
    toolCalled: detectedToolCall?.name,
  });

  return NextResponse.json({
    response: llmResponse,
    traceId,
    sessionId,
    escalated: false,
    blocked: false,
    guardrail: {
      piiFound: guardrailResult.piiFound,
      piiTypes: guardrailResult.piiTypes,
      piiScrubbed: guardrailResult.piiFound,
    },
    meta: {
      totalDurationMs: totalDuration,
      model: modelName,
      promptTokens,
      completionTokens,
    },
  });
}
