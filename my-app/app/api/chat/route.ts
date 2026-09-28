// ============================================================
// AgentForge — Main Chat API Endpoint
// POST /api/chat
//
// Full agent pipeline (merged: local validation + incoming AWS/RAG):
//   1. L1 Input Guardrails (injection detection + PII scrubbing)
//   1.5 RAG Memory Retrieval (Pinecone vector search)
//   2. LLM Call (Gemini Flash with fallback loop)
//   3. L2 Output Guardrails (risk classification)
//   4. L3 Human Escalation (Firestore + SQS if high-risk)
//   5. Decision Trace logging (Firestore + CloudWatch + DynamoDB async)
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

// AWS + RAG services (gracefully no-op when credentials are absent)
import { publishEscalation } from '@/lib/pubsub';
import { insertAuditTrace } from '@/lib/bigquery';
import { logDecisionStep } from '@/lib/cloud-logging';
import { embedText, searchVectors } from '@/lib/rag';

const MAX_MESSAGE_LENGTH = 8_000;

const MODEL_BY_PREFERENCE = {
  flash: 'gemini-2.5-flash',
  pro: 'gemini-2.5-pro',
} as const;

// Fallback chain tried in order when the primary model is overloaded
const MODEL_FALLBACK_CHAIN = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
];

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const traceId = `tr_${uuidv4().slice(0, 8)}`;
  let stepOrder = 0;

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
  const sessionId =
    typeof requestBody.sessionId === 'string' &&
    requestBody.sessionId.length <= 128
      ? requestBody.sessionId
      : uuidv4();

  if (!tenantId || !isText(message, MAX_MESSAGE_LENGTH)) {
    return NextResponse.json(
      {
        error: `Message is required and must be at most ${MAX_MESSAGE_LENGTH.toLocaleString()} characters. Tenant ID must be valid.`,
      },
      { status: 400 }
    );
  }

  if (!isRecord(agentConfig)) {
    return NextResponse.json(
      { error: 'agentConfig must be an object.' },
      { status: 400 }
    );
  }

  if (
    agentConfig.systemPrompt !== undefined &&
    !isText(agentConfig.systemPrompt, 8_000)
  ) {
    return NextResponse.json(
      { error: 'systemPrompt must be between 1 and 8,000 characters.' },
      { status: 400 }
    );
  }

  if (
    agentConfig.refundLimit !== undefined &&
    (!Number.isFinite(agentConfig.refundLimit) ||
      agentConfig.refundLimit < 0 ||
      agentConfig.refundLimit > 100_000)
  ) {
    return NextResponse.json(
      { error: 'refundLimit must be between 0 and 100,000.' },
      { status: 400 }
    );
  }

  if (
    agentConfig.modelPreference !== undefined &&
    !['flash', 'pro'].includes(agentConfig.modelPreference)
  ) {
    return NextResponse.json(
      { error: 'Invalid modelPreference.' },
      { status: 400 }
    );
  }

  const baseSystemPrompt =
    agentConfig.systemPrompt ||
    `You are a helpful, professional customer service agent for ${tenantId}. 
     Be concise, accurate, and empathetic. 
     If asked to do something that requires processing a refund or cancelling a subscription, 
     describe what you would do and the amount involved.`;

  const refundLimit = agentConfig.refundLimit ?? 100;
  const preferredModel =
    MODEL_BY_PREFERENCE[agentConfig.modelPreference ?? 'flash'];

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      {
        error:
          'The AI engine is not configured. Set GEMINI_API_KEY in .env.local and restart the service.',
        traceId,
      },
      { status: 503 }
    );
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  // ────────────────────────────────────────────────────────────────
  // STEP 1 — L1 INPUT GUARDRAILS
  // ────────────────────────────────────────────────────────────────
  const l1Start = Date.now();
  const guardrailResult = runInputGuardrails(message);
  const l1Duration = Date.now() - l1Start;

  // Firestore trace (fire-and-forget)
  logTraceStep({
    traceId,
    sessionId,
    tenantId,
    stepOrder: ++stepOrder,
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

  // AWS CloudWatch (no-op when creds absent)
  await logDecisionStep(traceId, tenantId, {
    stepType: 'INPUT_INSPECT',
    stepOrder,
    data: {
      piiFound: guardrailResult.piiFound,
      blocked: guardrailResult.blocked,
    },
    durationMs: l1Duration,
  });

  // AWS DynamoDB audit (no-op when creds absent)
  await insertAuditTrace({
    trace_id: traceId,
    tenant_id: tenantId,
    session_id: sessionId,
    step_order: stepOrder,
    step_type: 'INPUT_INSPECT',
    guardrail_action: guardrailResult.blocked ? 'BLOCK' : 'PASS',
    pii_detected: guardrailResult.piiFound,
    duration_ms: l1Duration,
  });

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
  // STEP 1.5 — RAG MEMORY RETRIEVAL (Pinecone — graceful fallback)
  // ────────────────────────────────────────────────────────────────
  const ragStart = Date.now();
  let contextBlock = '';
  try {
    const queryVector = await embedText(guardrailResult.scrubbedMessage);
    if (queryVector.length > 0) {
      const neighbors = await searchVectors(queryVector, tenantId);
      contextBlock = neighbors
        .map((n: { metadata?: { text?: string } }) => n.metadata?.text || '')
        .join('\n\n');
    }
  } catch {
    console.error('[RAG] Retrieval failed, falling back to no context.');
  }
  const ragDuration = Date.now() - ragStart;

  await logDecisionStep(traceId, tenantId, {
    stepType: 'RAG_RETRIEVE',
    stepOrder: ++stepOrder,
    data: { contextFound: !!contextBlock },
    durationMs: ragDuration,
  });

  // ────────────────────────────────────────────────────────────────
  // STEP 2 — LLM CALL (Gemini with fallback chain)
  // ────────────────────────────────────────────────────────────────
  const llmStart = Date.now();
  let llmResponse = '';
  let promptTokens = 0;
  let completionTokens = 0;
  let modelUsed: string = preferredModel;

  const fullSystemPrompt = `${baseSystemPrompt}${
    contextBlock
      ? `\n\nRELEVANT KNOWLEDGE BASE CONTEXT:\n${contextBlock}`
      : ''
  }`;

  // Build fallback list: preferred first, then the rest
  const modelsToTry = [
    preferredModel,
    ...MODEL_FALLBACK_CHAIN.filter((m) => m !== preferredModel),
  ];

  try {
    let lastError: unknown;
    let result: ReturnType<
      ReturnType<typeof genAI.getGenerativeModel>['generateContent']
    > extends Promise<infer R>
      ? R
      : never;
    let succeeded = false;

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: fullSystemPrompt,
        });
        result = await model.generateContent(guardrailResult.scrubbedMessage);
        modelUsed = modelName;
        console.log(`[LLM] Success with model: ${modelName}`);
        succeeded = true;
        break;
      } catch (e: unknown) {
        const err = e as { status?: number };
        if (err?.status === 503 || err?.status === 429) {
          console.warn(
            `[LLM] ${modelName} unavailable (${err.status}), trying next...`
          );
          lastError = e;
          continue;
        }
        throw e;
      }
    }

    if (!succeeded) throw lastError;

    llmResponse = result!.response.text();
    const usage = result!.response.usageMetadata;
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
    traceId,
    sessionId,
    tenantId,
    stepOrder: ++stepOrder,
    stepType: 'LLM_CALL',
    durationMs: llmDuration,
    status: 'pass',
    details: {
      model: modelUsed,
      promptTokens,
      completionTokens,
      piiWasScrubbed: guardrailResult.piiFound,
    },
  });

  await logDecisionStep(traceId, tenantId, {
    stepType: 'LLM_CALL',
    stepOrder,
    data: { model: modelUsed, promptTokens, completionTokens },
    durationMs: llmDuration,
  });

  await insertAuditTrace({
    trace_id: traceId,
    tenant_id: tenantId,
    session_id: sessionId,
    step_order: stepOrder,
    step_type: 'LLM_CALL',
    model_used: modelUsed,
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    duration_ms: llmDuration,
  });

  // ────────────────────────────────────────────────────────────────
  // STEP 3 — L2 OUTPUT GUARDRAILS
  // ────────────────────────────────────────────────────────────────
  const l2Start = Date.now();
  // Evaluate both the user message and the model wording to prevent
  // safety bypass when a model paraphrases a destructive request.
  const detectedToolCall = detectToolCall(`${message}\n${llmResponse}`);
  const outputGuardrail = runOutputGuardrails(detectedToolCall, refundLimit);
  const l2Duration = Date.now() - l2Start;

  logTraceStep({
    traceId,
    sessionId,
    tenantId,
    stepOrder: ++stepOrder,
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

  await logDecisionStep(traceId, tenantId, {
    stepType: 'OUTPUT_GUARDRAIL',
    stepOrder,
    data: {
      action: outputGuardrail.action,
      toolDetected: detectedToolCall?.name ?? null,
    },
    durationMs: l2Duration,
  });

  // ────────────────────────────────────────────────────────────────
  // STEP 4 — L3 HUMAN ESCALATION (if needed)
  // ────────────────────────────────────────────────────────────────
  if (outputGuardrail.action === 'ESCALATE_TO_HUMAN') {
    const escalationId = `ESC-${Math.floor(Math.random() * 9000) + 1000}`;

    // 1. Firestore (powers the /escalation UI page)
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
      console.error('[Chat API] Failed to create escalation in Firestore:', dbError);
    }

    // 2. AWS SQS (for downstream backend processing — no-op when creds absent)
    await publishEscalation({
      escalationId,
      traceId,
      tenantId,
      toolCall: detectedToolCall,
      riskLevel: outputGuardrail.riskLevel,
    });

    logTraceStep({
      traceId,
      sessionId,
      tenantId,
      stepOrder: ++stepOrder,
      stepType: 'ESCALATION',
      durationMs: 0,
      status: 'escalate',
      details: { escalationId, riskLevel: outputGuardrail.riskLevel },
    });

    const totalDuration = Date.now() - startTime;

    // Async audit log — never blocks user response
    logCompletedTrace({
      traceId,
      sessionId,
      tenantId,
      totalDurationMs: totalDuration,
      modelUsed,
      promptTokens,
      completionTokens,
      piiDetected: guardrailResult.piiFound,
      escalated: true,
      blocked: false,
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
        model: modelUsed,
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
    traceId,
    sessionId,
    tenantId,
    totalDurationMs: totalDuration,
    modelUsed,
    promptTokens,
    completionTokens,
    piiDetected: guardrailResult.piiFound,
    escalated: false,
    blocked: false,
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
      model: modelUsed,
      promptTokens,
      completionTokens,
    },
  });
}
