// ============================================================
// AgentForge — Decision Trace Logger
// Writes each step of an agent's decision to Firestore.
// This creates the auditable, queryable "Decision Trace" that
// powers the /replay page and BigQuery analytics.
// ============================================================

import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export type StepType =
  | 'INPUT_INSPECT'
  | 'RAG_RETRIEVE'
  | 'LLM_ROUTER'
  | 'LLM_CALL'
  | 'OUTPUT_GUARDRAIL'
  | 'TOOL_EXEC'
  | 'ESCALATION'
  | 'AUDIT_SINK';

export interface TraceStep {
  traceId: string;
  sessionId: string;
  tenantId: string;
  stepOrder: number;
  stepType: StepType;
  durationMs: number;
  status: 'pass' | 'block' | 'escalate' | 'error';
  details: Record<string, unknown>;
}

/**
 * Appends a single step to the decision trace log in Firestore.
 * Each agent invocation produces a linked chain of these steps.
 */
export async function logTraceStep(step: TraceStep): Promise<void> {
  try {
    await addDoc(collection(db, 'traces'), {
      ...step,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    // Logging failures must NEVER crash the user-facing request
    console.error('[TraceLogger] Failed to write trace step:', error);
  }
}

/**
 * Helper to build and log a complete summary trace record
 * at the end of a full agent invocation.
 */
export async function logCompletedTrace(summary: {
  traceId: string;
  sessionId: string;
  tenantId: string;
  totalDurationMs: number;
  modelUsed: string;
  promptTokens: number;
  completionTokens: number;
  piiDetected: boolean;
  escalated: boolean;
  blocked: boolean;
  toolCalled?: string;
}): Promise<void> {
  try {
    await addDoc(collection(db, 'trace_summaries'), {
      ...summary,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('[TraceLogger] Failed to write trace summary:', error);
  }
}
