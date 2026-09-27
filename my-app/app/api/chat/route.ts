import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { runInputGuardrails, runOutputGuardrails, detectToolCall } from '@/lib/guardrails';
import { logTraceStep, logCompletedTrace } from '@/lib/trace-logger';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// NEW AWS & RAG IMPORTS
import { publishEscalation } from '@/lib/pubsub';
import { insertAuditTrace } from '@/lib/bigquery';
import { logDecisionStep } from '@/lib/cloud-logging';
import { embedText, searchVectors } from '@/lib/rag';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const traceId = `tr_${uuidv4().slice(0, 8)}`;
  let stepOrder = 0;

  let requestBody: any;
  try {
    requestBody = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const {
    message,
    tenantId = 'acme_corp',
    sessionId = uuidv4(),
    agentConfig = {},
  } = requestBody;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
  }

  const refundLimit = agentConfig.refundLimit ?? 100;

  // ────────────────────────────────────────────────────────────────
  // STEP 1 — L1 INPUT GUARDRAILS
  // ────────────────────────────────────────────────────────────────
  const l1Start = Date.now();
  const guardrailResult = runInputGuardrails(message);
  const l1Duration = Date.now() - l1Start;

  // Local console log (fallback)
  logTraceStep({
    traceId, sessionId, tenantId, stepOrder: 1, stepType: 'INPUT_INSPECT',
    durationMs: l1Duration, status: guardrailResult.blocked ? 'block' : 'pass',
    details: { piiFound: guardrailResult.piiFound, blocked: guardrailResult.blocked },
  });

  // AWS CloudWatch log
  await logDecisionStep(traceId, tenantId, {
    stepType: 'INPUT_INSPECT', stepOrder: ++stepOrder,
    data: { piiFound: guardrailResult.piiFound, blocked: guardrailResult.blocked },
    durationMs: l1Duration
  });

  // AWS DynamoDB audit
  await insertAuditTrace({
    trace_id: traceId, tenant_id: tenantId, session_id: sessionId,
    step_order: stepOrder, step_type: 'INPUT_INSPECT',
    guardrail_action: guardrailResult.blocked ? 'BLOCK' : 'PASS',
    pii_detected: guardrailResult.piiFound, duration_ms: l1Duration
  });

  if (guardrailResult.blocked) {
    return NextResponse.json(
      { error: guardrailResult.blockReason, traceId, blocked: true, guardrail: { piiFound: guardrailResult.piiFound } },
      { status: 400 }
    );
  }

  // ────────────────────────────────────────────────────────────────
  // STEP 1.5 — RAG MEMORY RETRIEVAL (Pinecone)
  // ────────────────────────────────────────────────────────────────
  const ragStart = Date.now();
  let contextBlock = '';
  try {
    const queryVector = await embedText(guardrailResult.scrubbedMessage);
    if (queryVector.length > 0) {
      const neighbors = await searchVectors(queryVector, tenantId);
      contextBlock = neighbors.map((n: any) => n.metadata?.text || '').join('\n\n');
    }
  } catch (e) {
    console.error('[RAG] Retrieval failed, falling back to no context.');
  }
  const ragDuration = Date.now() - ragStart;

  await logDecisionStep(traceId, tenantId, {
    stepType: 'RAG_RETRIEVE', stepOrder: ++stepOrder,
    data: { contextFound: !!contextBlock }, durationMs: ragDuration
  });

  // ────────────────────────────────────────────────────────────────
  // STEP 2 — LLM CALL (Gemini Flash) with Fallback Loop
  // ────────────────────────────────────────────────────────────────
  const llmStart = Date.now();
  let llmResponse = '';
  let promptTokens = 0;
  let completionTokens = 0;
  let modelUsed = 'gemini-3.5-flash';

  const systemPrompt =
    agentConfig.systemPrompt ||
    `You are a helpful, professional customer service agent for ${tenantId}. Be concise, accurate, and empathetic. If asked to do something that requires processing a refund or cancelling a subscription, describe what you would do and the amount involved.`;

  const fullPrompt = `${systemPrompt}\n\n${contextBlock ? `RELEVANT KNOWLEDGE BASE CONTEXT:\n${contextBlock}\n\n` : ''}`;

  try {
    const modelsToTry = ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite'];
    let lastError: any;
    let result: any;
    
    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: fullPrompt,
        });

        result = await model.generateContent(guardrailResult.scrubbedMessage);
        modelUsed = modelName;
        console.log(`[LLM] Success with model: ${modelName}`);
        break;
      } catch (e: any) {
        if (e?.status === 503 || e?.status === 429) {
          console.warn(`[LLM] ${modelName} unavailable (${e?.status}), trying next model...`);
          lastError = e;
          continue;
        }
        throw e;
      }
    }

    if (!result) throw lastError;

    llmResponse = result.response.text();
    const usage = result.response.usageMetadata;
    promptTokens = usage?.promptTokenCount ?? 0;
    completionTokens = usage?.candidatesTokenCount ?? 0;
  } catch (llmError) {
    console.error('[Chat API] LLM call failed:', llmError);
    return NextResponse.json(
      { error: 'The AI engine is temporarily unavailable. Please try again.', traceId },
      { status: 503 }
    );
  }

  const llmDuration = Date.now() - llmStart;

  await logDecisionStep(traceId, tenantId, {
    stepType: 'LLM_CALL', stepOrder: ++stepOrder,
    data: { model: modelUsed, promptTokens, completionTokens }, durationMs: llmDuration
  });

  await insertAuditTrace({
    trace_id: traceId, tenant_id: tenantId, session_id: sessionId,
    step_order: stepOrder, step_type: 'LLM_CALL', model_used: modelUsed,
    prompt_tokens: promptTokens, completion_tokens: completionTokens, duration_ms: llmDuration
  });

  // ────────────────────────────────────────────────────────────────
  // STEP 3 — L2 OUTPUT GUARDRAILS
  // ────────────────────────────────────────────────────────────────
  const l2Start = Date.now();
  const detectedToolCall = detectToolCall(llmResponse);
  const outputGuardrail = runOutputGuardrails(detectedToolCall, refundLimit);
  const l2Duration = Date.now() - l2Start;

  await logDecisionStep(traceId, tenantId, {
    stepType: 'OUTPUT_GUARDRAIL', stepOrder: ++stepOrder,
    data: { action: outputGuardrail.action, toolDetected: detectedToolCall?.name ?? null },
    durationMs: l2Duration
  });

  // ────────────────────────────────────────────────────────────────
  // STEP 4 — L3 HUMAN ESCALATION (if needed)
  // ────────────────────────────────────────────────────────────────
  if (outputGuardrail.action === 'ESCALATE_TO_HUMAN') {
    const escalationId = `ESC-${Math.floor(Math.random() * 9000) + 1000}`;

    // 1. Firebase (for the UI)
    try {
      await addDoc(collection(db, 'escalations'), {
        escalationId, traceId, sessionId, tenantId,
        toolName: detectedToolCall?.name || null,
        toolParameters: detectedToolCall?.parameters || null,
        riskLevel: outputGuardrail.riskLevel || null,
        agentSummary: llmResponse, userMessage: message,
        status: 'pending', createdAt: serverTimestamp(),
      });
    } catch (dbError) {
      console.error('[Chat API] Failed to create escalation in Firebase:', dbError);
    }

    // 2. AWS SQS (for backend processing)
    await publishEscalation({
      escalationId, traceId, tenantId,
      toolCall: detectedToolCall,
      riskLevel: outputGuardrail.riskLevel
    });
    
    // Async audit log
    logCompletedTrace({
      traceId, sessionId, tenantId,
      totalDurationMs: Date.now() - startTime,
      modelUsed: modelUsed,
      promptTokens, completionTokens,
      piiDetected: guardrailResult.piiFound,
      escalated: true, blocked: false,
      toolCalled: detectedToolCall?.name || undefined,
    });

    const totalDuration = Date.now() - startTime;
    return NextResponse.json({
      response: "I've flagged this action for human review. A manager will be notified and will respond shortly. Your session is safely held in memory.",
      traceId, sessionId, escalated: true, escalationId,
      riskLevel: outputGuardrail.riskLevel,
      guardrail: { piiFound: guardrailResult.piiFound },
      meta: { totalDurationMs: totalDuration, model: modelUsed }
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
    modelUsed: modelUsed,
    promptTokens, completionTokens,
    piiDetected: guardrailResult.piiFound,
    escalated: false, blocked: false,
    toolCalled: detectedToolCall?.name || undefined,
  });

  return NextResponse.json({
    response: llmResponse, traceId, sessionId,
    escalated: false, blocked: false,
    guardrail: { piiFound: guardrailResult.piiFound },
    meta: { totalDurationMs: totalDuration, model: modelUsed }
  });
}
