// ============================================================
// AgentForge — 3-Layer Guardrails Pipeline (MVP Implementation)
// L1: Input Sanitization  (runs BEFORE the LLM)
// L2: Output Validation   (runs AFTER the LLM)
// L3: Human-in-the-Loop   (triggered by high-risk tool calls)
// ============================================================

export interface GuardrailResult {
  passed: boolean;
  blocked: boolean;
  blockReason?: string;
  piiFound: boolean;
  piiTypes: string[];
  injectionDetected: boolean;
  scrubbedMessage: string;
  originalMessage: string;
}

export interface OutputGuardrailResult {
  action: 'RESPOND' | 'EXECUTE' | 'ESCALATE_TO_HUMAN';
  riskLevel: 'none' | 'low' | 'high' | 'critical';
  reason?: string;
}

// ── L1: Input Guardrails ─────────────────────────────────────────────
export function runInputGuardrails(message: string): GuardrailResult {
  const result: GuardrailResult = {
    passed: true,
    blocked: false,
    piiFound: false,
    piiTypes: [],
    injectionDetected: false,
    scrubbedMessage: message,
    originalMessage: message,
  };

  // ── 1a. Prompt Injection Detector ──────────────────────────────────
  // Catches attempts to override the system prompt or jailbreak the AI
  const injectionPatterns = [
    /ignore\s+(all\s+)?(previous\s+|prior\s+)?instructions/i,
    /disregard\s+(your\s+|all\s+|the\s+)?/i,
    /you\s+are\s+now\s+(a\s+)?/i,
    /act\s+as\s+if\s+you\s+(are|were)/i,
    /forget\s+(everything|all)\s+(you\s+)?(know|were\s+told)/i,
    /new\s+system\s+prompt/i,
    /system\s*:\s*you\s+are/i,
    /jailbreak/i,
    /DAN\s+mode/i,
    /developer\s+mode\s+enabled/i,
    /<\s*system\s*>/i,
    /\[INST\]/i,
  ];

  if (injectionPatterns.some((p) => p.test(message))) {
    result.injectionDetected = true;
    result.blocked = true;
    result.passed = false;
    result.blockReason =
      'Prompt injection attempt detected. Request blocked for security.';
    return result;
  }

  // ── 1b. PII Scrubber ───────────────────────────────────────────────
  // Detects and redacts Personally Identifiable Information
  // Real production: use Google Cloud DLP API
  const piiPatterns: { pattern: RegExp; label: string }[] = [
    // Social Security Number (US)
    { pattern: /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/g, label: 'SSN' },
    // Credit / Debit Card Numbers
    {
      pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
      label: 'CREDIT_CARD',
    },
    // Email addresses
    {
      pattern: /\b[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}\b/gi,
      label: 'EMAIL',
    },
    // US Phone numbers (various formats)
    {
      pattern: /\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
      label: 'PHONE',
    },
    // Passport numbers (generic)
    { pattern: /\b[A-Z]{1,2}\d{6,9}\b/g, label: 'PASSPORT' },
    // Bank account numbers (8-12 digits standalone)
    { pattern: /\baccount\s*#?\s*\d{8,12}\b/gi, label: 'BANK_ACCOUNT' },
    // Date of birth patterns
    {
      pattern:
        /\b(0?[1-9]|1[0-2])\s*[\/\-]\s*(0?[1-9]|[12]\d|3[01])\s*[\/\-]\s*(19|20)\d{2}\b/g,
      label: 'DATE_OF_BIRTH',
    },
  ];

  let scrubbedMessage = message;
  for (const { pattern, label } of piiPatterns) {
    if (pattern.test(scrubbedMessage)) {
      result.piiFound = true;
      if (!result.piiTypes.includes(label)) {
        result.piiTypes.push(label);
      }
      // Reset lastIndex for global patterns
      pattern.lastIndex = 0;
      scrubbedMessage = scrubbedMessage.replace(
        pattern,
        `[REDACTED_${label}]`
      );
    }
    pattern.lastIndex = 0;
  }

  result.scrubbedMessage = scrubbedMessage;
  return result;
}

// ── L2: Output Guardrails ────────────────────────────────────────────
export function runOutputGuardrails(
  toolCall: { name: string; parameters: Record<string, unknown> } | null,
  riskThreshold: number = 100
): OutputGuardrailResult {
  // No tool call — just a text response, always safe to return
  if (!toolCall) {
    return { action: 'RESPOND', riskLevel: 'none' };
  }

  // Define which tools are high-risk (require human approval)
  const criticalTools = ['delete_account', 'bulk_data_export', 'disable_service'];
  const highRiskTools = [
    'issue_refund',
    'cancel_subscription',
    'modify_subscription',
    'update_billing',
    'change_email',
  ];

  // Critical tools ALWAYS require human approval
  if (criticalTools.includes(toolCall.name)) {
    return {
      action: 'ESCALATE_TO_HUMAN',
      riskLevel: 'critical',
      reason: `Tool '${toolCall.name}' is always flagged for human review.`,
    };
  }

  // High-risk tools are checked against the tenant's financial threshold
  if (highRiskTools.includes(toolCall.name)) {
    if (toolCall.name === 'cancel_subscription') {
      return {
        action: 'ESCALATE_TO_HUMAN',
        riskLevel: 'high',
        reason: `Subscription cancellations require manual retention review.`,
      };
    }

    const amount =
      (toolCall.parameters?.amount as number) ||
      (toolCall.parameters?.refund_amount as number) ||
      0;

    if (amount > riskThreshold) {
      return {
        action: 'ESCALATE_TO_HUMAN',
        riskLevel: 'high',
        reason: `Refund amount $${amount} exceeds autonomous limit of $${riskThreshold}.`,
      };
    }

    return { action: 'EXECUTE', riskLevel: 'low' };
  }

  // All other tools are low-risk and can execute autonomously
  return { action: 'EXECUTE', riskLevel: 'none' };
}

// ── Tool Call Detector ────────────────────────────────────────────────
// Parses the LLM's text response to detect if a tool should be called.
// In production this would use Gemini's function calling feature directly.
export function detectToolCall(
  response: string
): { name: string; parameters: Record<string, unknown> } | null {
  const lowerResponse = response.toLowerCase();

  // Detect refund intent
  const refundMatch = response.match(/\$\s?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
  if (
    (lowerResponse.includes('refund') || lowerResponse.includes('reimburse')) &&
    refundMatch
  ) {
    // Remove commas before parsing
    const amountStr = refundMatch[1].replace(/,/g, '');
    const amount = parseFloat(amountStr);
    return {
      name: 'issue_refund',
      parameters: { amount, currency: 'usd' },
    };
  }

  // Detect cancellation intent
  if (
    lowerResponse.includes('cancel') &&
    (lowerResponse.includes('subscription') ||
      lowerResponse.includes('account'))
  ) {
    return {
      name: 'cancel_subscription',
      parameters: {},
    };
  }

  return null;
}
