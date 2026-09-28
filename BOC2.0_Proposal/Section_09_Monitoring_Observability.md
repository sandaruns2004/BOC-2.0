# Section 9 — Monitoring & Observability

## Team: [Your Team Name]
## Scenario: 5 — AI Agent Platform for Business Automation

---

## The Core Observability Challenge for AI Agents

Traditional web services are easy to monitor: did the request succeed? How long did it take? For AI agents, these questions are necessary but not sufficient. An agent can return a 200 OK response with a perfectly formatted answer that is factually wrong, takes an unintended action, or reveals information the user shouldn't have.

Our observability strategy therefore has two distinct layers:
1. **Infrastructure observability**: is the system up, fast, and error-free? (Standard)
2. **Agent behavior observability**: is the agent making correct, safe, and explainable decisions? (Novel)

---

## Layer 1: Infrastructure Observability

### Key Metrics (AWS CloudWatch + GCP Cloud Monitoring)

**Request-level metrics (per tenant, per service):**
| Metric | Alert Threshold | Why It Matters |
|--------|----------------|----------------|
| Request error rate | >5% over 5 min | Systemic failure indicator |
| P99 end-to-end latency | >3,000ms | User experience degradation |
| LLM API error rate | >3% over 2 min | Triggers fallback logic |
| Tool call success rate | <90% over 10 min | External API degradation |
| Cache hit rate | <10% sustained | Suggests cache failure |
| Guardrails block rate | >20% in 5 min | Possible attack or misconfiguration |

**System-level metrics:**
| Metric | Alert Threshold | Why It Matters |
|--------|----------------|----------------|
| Cloud Run instance count | >150 instances | Unexpected traffic spike |
| Firebase Firestore read latency | >500ms P99 | Database degradation |
| AWS SQS queue depth (approval) | >100 messages | Human escalation backlog building |
| Pinecone query latency | >200ms P99 | Vector search degradation |

### Dashboards (CloudWatch + Cloud Monitoring)

**Platform Health Dashboard (Platform Ops view):**
- Real-time: total requests/min across all tenants, error rate, P99 latency
- LLM API usage: tokens/min by model (Gemini 3.5 Flash / 3.6 Flash / Lite), cost burn rate today vs. budget
- Circuit breaker status: which Gemini tiers are currently in open/closed state
- Active alerts list

**Per-Tenant Dashboard (Business Admin view):**
- Conversations today/this week/this month
- Agent success rate (% of conversations that completed without error)
- Tool call breakdown: which tools are being called, success rates, latency
- Cost tracker: tokens used today, estimated month-end cost vs. quota
- Guardrails activity: how many inputs were blocked today, categories

---

## Layer 2: Agent Behavior Observability (The Novel Part)

### Decision Traces — The Core Mechanism

Every agent invocation produces a **Decision Trace** — a structured, ordered log of every step the agent took to produce its output. This is not a single log entry; it is a linked chain of events (stored in Cloud Logging and queryable in BigQuery) that answers "why did the agent do X?"

**Decision Trace Structure:**
```
Trace ID: tr_8f3a9bc2
Tenant: business_support_co
Session: user_4821_session_92
Timestamp: 2026-09-01T10:14:32.001Z

Step 1 - INPUT_RECEIVED
  raw_message: "I want to cancel my subscription" [PII scrubbed: none]
  scrubbed_message: "I want to cancel my subscription"
  guardrails_L1_check: PASS (no injection detected, no PII found)
  blocked: false

Step 2 - PINECONE_RAG_RETRIEVAL
  query_vector: [0.021, -0.144, ...] (768 dims, not stored)
  namespace: "tenant_business_support_co_sha256"
  top_k_results:
    - chunk_id: doc_faq_45, score: 0.94, text: "To cancel, visit Settings > Billing > Cancel Plan"
    - chunk_id: doc_faq_12, score: 0.87, text: "Cancellations take effect at end of billing period"
    - chunk_id: conv_user_4821_turn_3, score: 0.81, text: "User previously inquired about pausing subscription"
  conversation_history_turns_included: 3

Step 3 - LLM_CALL
  model_used: gemini-3.5-flash (selected: query classified as 'informational')
  cache_hit: false
  prompt_token_count: 612
  completion_token_count: 148
  llm_response_type: TOOL_CALL_REQUEST
  tool_call_requested:
    tool: cancel_subscription
    parameters: { user_id: "[SECURE_REF:user_id_4821]", reason: "user_requested" }

Step 4 - GUARDRAILS_L2_OUTPUT_CHECK
  check: schema_validation → PASS (valid tool call JSON)
  check: risk_classification → HIGH_RISK (cancel_subscription is in high-risk list)
  check: financial_threshold → ABOVE_LIMIT ($750 > $500 configured limit)
  action: L3_ESCALATE_TO_HUMAN (not AUTO_EXECUTE)
  sqs_message_id: sqs_msg_9f2a
  firestore_escalation_id: ESC-4821

Step 5 - RESPONSE_TO_USER
  response: "I've noted your cancellation request and it has been sent for review.
             You'll receive a confirmation within 2 hours. Is there anything else I can help with?"
  response_safety_check: PASS
  total_duration_ms: 542

Step 6 - HUMAN_APPROVAL_PENDING
  approval_queue_id: ESC-4821
  admin_notified: true (dashboard badge)
  expires_at: 2026-09-01T22:14:32Z (12 hour SLA)
```

This trace answers:
- **Why did the agent respond the way it did?** (It retrieved 3 specific memory chunks that shaped the LLM's context)
- **What did the agent try to do?** (Call cancel_subscription)
- **Why wasn't it executed immediately?** (cancel_subscription is classified high-risk, requiring human approval)
- **What was the cost of this interaction?** (612 + 148 = 760 tokens on Gemini Flash)

---

### Querying Decision Traces in AWS DynamoDB

Because all traces are written to DynamoDB, business admins and Platform Ops can run efficient GSI queries:

**Example 1: Debug a specific bad outcome**
```javascript
// DynamoDB GetItem by trace_id
const result = await dynamodb.get({
  TableName: 'agent_traces',
  Key: { trace_id: 'tr_8f3a9bc2' }
}).promise();
```

**Example 2: Find all conversations where the agent tried to call a tool but was L3 escalated**
```javascript
// DynamoDB Query using tenant_id + timestamp GSI
const result = await dynamodb.query({
  TableName: 'agent_traces',
  IndexName: 'tenant_timestamp_index',
  KeyConditionExpression: 'tenant_id = :tid AND #ts > :from',
  FilterExpression: 'step_type = :step AND #action = :act',
  ExpressionAttributeValues: {
    ':tid': 'business_support_co',
    ':from': thirtyDaysAgo,
    ':step': 'GUARDRAILS_L2_OUTPUT_CHECK',
    ':act': 'L3_ESCALATE_TO_HUMAN'
  }
}).promise();
```

**Example 3: Which retrieved Pinecone chunks are most influencing agent responses?**
```javascript
// Scan with filter on memory_retrieval_results chunk_ids
// Aggregated server-side by a scheduled Lambda / Cloud Run job
// Results: top-K chunk_ids by retrieval frequency this week
// → tells business which KB documents need to stay up-to-date
```

---

### Agent Quality Metrics (Beyond Raw Infrastructure)

We track the following agent-behavior metrics per tenant, surfaced in their dashboard:

| Metric | Definition | Why It Matters |
|--------|-----------|----------------|
| Escalation rate | % of conversations routed to human approval | High rate = agent encountering many edge cases |
| Guardrails block rate | % of inputs or outputs blocked | Spike = potential attack or misconfigured guardrail |
| Tool call success rate | % of tool calls that returned expected data | Low rate = external API degradation |
| Cache hit rate | % of turns answered from semantic cache | Low rate = new query patterns emerging |
| Avg context retrieval score | Mean similarity score of retrieved memory chunks | Low score = knowledge base may need updating |
| Human approval resolution rate | % of escalated actions approved vs. rejected by admin | High rejection rate = agent misclassifying user intent |

---

### Anomaly Detection

Cloud Monitoring is configured with **metric anomaly alerts** (not just threshold alerts):

1. **Token usage anomaly**: if a tenant's hourly token usage is >3 standard deviations above their 14-day moving average → alert Platform Ops
2. **Guardrails spike**: if guardrail blocks spike >5× normal in 10 minutes → alert (possible prompt injection attack)
3. **Tool call loop detection**: if any single session triggers >20 tool calls in 5 minutes → flag for immediate investigation
4. **Latency regression**: if P99 latency increases >50% day-over-day → alert (likely upstream LLM degradation or new agent config issue)

---

### Distributed Tracing (W3C TraceContext + CloudWatch)

Every HTTP request propagates a W3C `traceparent` header through all Cloud Run services. CloudWatch captures:
- Time spent in each service (API Gateway, Orchestration, Memory/Pinecone, LLM Router, Guardrails, Tool Executor)
- Which service is the latency bottleneck for any given request
- Parallel vs. sequential execution patterns

**Example use:** A Platform Ops engineer sees P99 latency spiking. They open CloudWatch Traces, filter to the slowest 1% of requests, and see that the Tool Executor is consistently taking 7–8 seconds — pointing to a degraded external API, not an LLM issue. Without distributed tracing, this diagnosis would require grepping through multiple service logs.

---

## Monitoring Summary

Our observability design ensures that for any agent behavior or system event, we can answer:
1. **Did it happen?** (AWS CloudWatch logs + CloudWatch Metric Alarms)
2. **When and how often?** (DynamoDB GSI analytics queries by tenant + timestamp)
3. **Why?** (Decision traces with full prompt, retrieved Pinecone context, tool call, and guardrail check)
4. **Where in the system did it occur?** (W3C traceparent distributed tracing across Cloud Run services)
5. **Was it anomalous?** (CloudWatch Metric anomaly detection + GCP Cloud Monitoring alerting)
