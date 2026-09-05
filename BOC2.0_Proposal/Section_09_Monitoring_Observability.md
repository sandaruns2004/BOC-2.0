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

### Key Metrics (All in Cloud Monitoring)

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
| Firestore read latency | >500ms P99 | Database degradation |
| Redis memory utilization | >85% | Cache eviction imminent |
| Pub/Sub queue depth (approval) | >100 messages | Human escalation backlog building |

### Dashboards (Cloud Monitoring)

**Platform Health Dashboard (Platform Ops view):**
- Real-time: total requests/min across all tenants, error rate, P99 latency
- LLM API usage: tokens/min by model, cost burn rate today vs. budget
- Circuit breaker status: which APIs are currently in open/closed state
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
  guardrails_input_check: PASS (no injection detected, no PII found)
  blocked: false

Step 2 - MEMORY_RETRIEVAL
  query_vector: [0.021, -0.144, ...] (768 dims, not stored)
  top_k_results:
    - chunk_id: doc_faq_45, score: 0.94, text: "To cancel, visit Settings > Billing > Cancel Plan"
    - chunk_id: doc_faq_12, score: 0.87, text: "Cancellations take effect at end of billing period"
    - chunk_id: conv_user_4821_turn_3, score: 0.81, text: "User previously inquired about pausing subscription"
  conversation_history_turns_included: 3

Step 3 - LLM_CALL
  model_used: gemini-flash (selected: query classified as 'informational')
  cache_hit: false
  prompt_token_count: 612
  completion_token_count: 148
  llm_response_type: TOOL_CALL_REQUEST
  tool_call_requested:
    tool: cancel_subscription
    parameters: { user_id: "[SECURE_REF:user_id_4821]", reason: "user_requested" }

Step 4 - GUARDRAILS_OUTPUT_CHECK
  check: schema_validation → PASS (valid tool call JSON)
  check: risk_classification → HIGH_RISK (cancel_subscription is in high-risk list)
  action: ESCALATE_TO_HUMAN (not AUTO_EXECUTE)
  escalation_queue_message_id: pub_sub_msg_9f2a

Step 5 - RESPONSE_TO_USER
  response: "I've noted your cancellation request and it has been sent for review. 
             You'll receive a confirmation within 2 hours. Is there anything else I can help with?"
  response_safety_check: PASS
  total_duration_ms: 892

Step 6 - HUMAN_APPROVAL_PENDING
  approval_queue_id: approval_7823
  admin_notified: true (email + dashboard badge)
  expires_at: 2026-09-01T22:14:32Z (12 hour SLA)
```

This trace answers:
- **Why did the agent respond the way it did?** (It retrieved 3 specific memory chunks that shaped the LLM's context)
- **What did the agent try to do?** (Call cancel_subscription)
- **Why wasn't it executed immediately?** (cancel_subscription is classified high-risk, requiring human approval)
- **What was the cost of this interaction?** (612 + 148 = 760 tokens on Gemini Flash)

---

### Querying Traces in BigQuery

Because all traces are streamed to BigQuery, business admins and Platform Ops can run arbitrary analytical queries:

**Example 1: Debug a specific bad outcome**
```sql
SELECT step_details
FROM agent_traces
WHERE trace_id = 'tr_8f3a9bc2'
ORDER BY step_order
```

**Example 2: Find all conversations where the agent tried to call a tool but was blocked**
```sql
SELECT trace_id, session_id, timestamp, tool_call_requested
FROM agent_traces
WHERE tenant_id = 'business_support_co'
  AND step_type = 'GUARDRAILS_OUTPUT_CHECK'
  AND action = 'ESCALATE_TO_HUMAN'
  AND timestamp > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
```

**Example 3: Which retrieved memory chunks are most influencing agent responses?**
```sql
SELECT chunk_id, COUNT(*) as times_retrieved, AVG(similarity_score) as avg_score
FROM agent_traces,
UNNEST(memory_retrieval_results) as result
WHERE tenant_id = 'business_support_co'
  AND timestamp > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
GROUP BY chunk_id
ORDER BY times_retrieved DESC
LIMIT 20
```
*This tells a business which of their knowledge base documents the agent relies on most — useful for knowing which ones to keep updated.*

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

### Distributed Tracing (Cloud Trace)

Every HTTP request propagates a `X-Cloud-Trace-Context` header through all services. Cloud Trace captures:
- Time spent in each service (Apigee, Orchestration, Memory, LLM Router, Guardrails, Tool Executor)
- Which service is the latency bottleneck for any given request
- Parallel vs. sequential execution patterns

**Example use:** A Platform Ops engineer sees P99 latency spiking. They open Cloud Trace, filter to the slowest 1% of requests, and see that the Tool Executor is consistently taking 7–8 seconds — pointing to a degraded external API, not an LLM issue. Without distributed tracing, this diagnosis would require grepping through multiple service logs.

---

## Monitoring Summary

Our observability design ensures that for any agent behavior or system event, we can answer:
1. **Did it happen?** (Cloud Logging + Cloud Monitoring alerts)
2. **When and how often?** (BigQuery analytics queries)
3. **Why?** (Decision traces with full prompt, retrieved context, tool call, and guardrail check)
4. **Where in the system did it occur?** (Cloud Trace distributed tracing)
5. **Was it anomalous?** (Metric anomaly detection in Cloud Monitoring)
