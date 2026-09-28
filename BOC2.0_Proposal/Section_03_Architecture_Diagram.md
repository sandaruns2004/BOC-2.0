# Section 3 — Architecture Diagram (Description & Data Flows)

## Team: [Your Team Name]
## Scenario: 5 — AI Agent Platform for Business Automation

---

## NOTE
This file describes the architecture in text form. Your actual diagram must be created in draw.io, Lucidchart, Excalidraw, or Figma and submitted as PDF/PNG. Use this document as the blueprint for drawing the diagram.

---

## Diagram Structure: Layers

The architecture is organized into 5 horizontal layers. Draw each as a distinct band/zone in your diagram.

---

### Layer 0: External Actors (outside the cloud boundary)
Components:
- Business Admin (browser user)
- End User (browser / mobile app / API consumer)
- External APIs (third-party tools the agent can call — e.g., a CRM, helpdesk, payment system)

Draw these OUTSIDE the cloud boundary box. Label them clearly as "external."

---

### Layer 1: Entry / API Gateway
Component: **Amazon API Gateway** (AWS)

Data flows IN:
- Business Admin → HTTPS request with JWT token → Amazon API Gateway
- End User → HTTPS chat message with tenant API key → Amazon API Gateway

Amazon API Gateway does:
- API key / JWT validation (authenticate the request)
- Tenant identification (which business does this key belong to?)
- Rate limiting (enforce per-tenant request quotas)
- Usage metering (count requests for billing)
- Route to correct backend service on GCP Cloud Run

Data flows OUT:
- API Gateway → Admin Dashboard Backend on Cloud Run (for config changes)
- API Gateway → Agent Orchestration Service on Cloud Run (for agent invocations)

Label the arrows:
- "Authenticated HTTPS with API key"
- "Tenant-tagged routed request"

---

### Layer 2: Core Agent Processing
This is the heart of the system. Four services run here, all on **GCP Cloud Run** (serverless containers).

#### 2a. Agent Orchestration Service (Cloud Run — Next.js App Router)
This is the "conductor" — it coordinates all other services per agent invocation.

Flow:
1. Receives tenant-tagged request from Amazon API Gateway
2. Loads agent configuration from **Firebase Firestore** (allowed tools, system prompt, model choice, refund limit)
3. Calls Memory & Context Layer to get relevant history from **Pinecone**
4. Sends assembled prompt to Guardrails Pipeline (L1 input check)
5. Sends approved prompt to LLM Router (Gemini 3.5 Flash)
6. Receives LLM response, sends to Guardrails Pipeline (L2 output check)
7. If LLM wants to call a tool → calls Tool Executor
8. Assembles final response → logs audit trace to DynamoDB → returns to user

Arrows to draw:
- Orchestration → Firebase Firestore: "Load agent config"
- Orchestration → Memory Layer: "Retrieve relevant context"
- Orchestration → Guardrails (input): "L1 Validate user input"
- Orchestration → LLM Router: "Send assembled prompt"
- Orchestration → Guardrails (output): "L2 Validate LLM response"
- Orchestration → Tool Executor: "Execute tool call request"
- Orchestration → Audit Logger: "Write decision trace to DynamoDB"

#### 2b. Memory & Context Layer (Cloud Run + Pinecone + Firebase Firestore)
Handles all agent memory operations.

Sub-components (draw as a box with 3 internal parts):
1. Embedding Service: converts user message into a vector using **Gemini text-embedding-004** (Google AI Studio)
2. Vector Search: queries the tenant's isolated **Pinecone namespace** for top-K relevant context chunks
3. Conversation Store: **Firebase Firestore** collection per tenant, stores last N conversation turns

Data flows:
- Receives: raw user message + tenant ID
- Calls: Gemini text-embedding-004 → get 768-dim vector
- Queries: Pinecone (tenant-scoped namespace, SHA-256 prefix isolation) → get top-5 relevant passages
- Reads: Firebase Firestore (last 10 conversation turns for this user)
- Returns: assembled context block to Orchestration Service

Arrows to draw:
- Memory Layer → Google AI Studio (text-embedding-004): "Embed user query"
- Memory Layer → Pinecone Vector DB: "Similarity search (tenant namespace)"
- Memory Layer → Firebase Firestore: "Read conversation history"

#### 2c. LLM Router (Cloud Run + Gemini API)
Decides which model tier to use and implements the 3-tier fallback chain.

Logic flow:
1. Classify prompt complexity:
   - Simple / factual → **Gemini 3.5 Flash** (fastest, cheapest — used for >80% of requests)
   - Complex / multi-step → **Gemini 3.5 Flash** with expanded context window
2. Send to selected Gemini model via Google AI SDK
3. Monitor error rate and latency:
   - Error rate > 5% or P99 latency > 1,200ms → **circuit breaker opens**
   - Fallback to **Gemini 3.6 Flash** (secondary)
   - If 3.6 Flash also degraded → **Gemini 3.5 Flash Lite** (tertiary graceful degradation)
4. Log token usage to DynamoDB for per-tenant quota tracking

Arrows to draw:
- LLM Router → Gemini 3.5 Flash (primary): "Standard inference call"
- LLM Router → Gemini 3.6 Flash (secondary): "Circuit breaker fallback"
- LLM Router → Gemini 3.5 Flash Lite (tertiary): "Graceful degradation"
- LLM Router → DynamoDB: "Log token usage"

#### 2d. Guardrails Pipeline (Cloud Run — lib/guardrails.ts)
Three-phase safety layer: L1 input, L2 output, L3 human escalation.

Phase 1 — L1 Input Validation:
- Prompt injection detector (classifier, checks for "ignore previous instructions" patterns)
- PII scrubber (regex + NER, removes phone numbers, SSNs, emails before sending to LLM)
- Business rule check (is this topic allowed for this agent?)
- If any check fails → return safe error message to user, log the blocked attempt to DynamoDB

Phase 2 — L2 Output Validation:
- JSON schema check (if LLM produces a tool call — does it match the expected schema?)
- Confidence threshold check (if LLM output contains uncertainty markers below threshold → escalate)
- Sensitive action gate (if tool call amount exceeds configured financial threshold → push to L3)

Phase 3 — L3 Human Escalation:
- Write escalation to **Firebase Firestore** `escalations` collection (status: pending)
- Publish event to **AWS SQS** human escalation queue
- Admin dashboard reads from Firestore, reviewer approves or rejects via `PATCH /api/escalation`
- Log all L3 events to **AWS DynamoDB** audit trail

Arrows to draw:
- Guardrails → AWS SQS "Human Escalation Queue": "L3 high-risk action detected"
- Guardrails → Firebase Firestore "escalations": "Write escalation record"
- Guardrails → AWS DynamoDB: "Log blocked attempt / audit"

---

### Layer 3: Tool Execution & External Integration
Component: Tool Executor Service (Cloud Run)

Each tool call runs in an ephemeral, isolated Cloud Run request:
- Container spins up with only the permissions for that tenant's configured tools
- Tool call is validated against allowed schema
- HTTP request is made to external API (CRM, helpdesk, database, etc.)
- Response is returned to Orchestration Service
- Container request completes

Secrets (API keys for external tools) are never stored in the container — they are retrieved at runtime from **AWS SSM Parameter Store**, namespaced by tenant ID: `/agentforge/{tenantId}/tools/{toolName}/apiKey`.

Arrows to draw:
- Tool Executor → AWS SSM Parameter Store: "Fetch tool credentials (tenant-scoped)"
- Tool Executor → External CRM API: "GET /orders/{id}"
- Tool Executor → External Helpdesk API: "POST /tickets"
- Tool Executor → Any external API: labeled with the action type

AWS SQS: Human Approval Queue
- Receives high-risk tool calls from Guardrails Pipeline (L3)
- Business Admin is notified (email / in-dashboard badge)
- Admin can Approve or Reject via `PATCH /api/escalation`
- Approval triggers Tool Executor; Rejection logs the block to DynamoDB

---

### Layer 4: Persistence, Audit & Observability
All components write here — this layer never takes writes from external users directly.

#### Firebase Firestore (per-tenant document collections)
- Agent configurations (system prompt, tools, model settings, guardrail rules, refund limit)
- Conversation histories (per user session, last 10 turns)
- Escalation queue items (status: pending / approved / rejected)

#### AWS CloudWatch — Structured Log Aggregation
Every agent step is written as a structured log entry:
```
{
  "trace_id": "uuid",
  "tenant_id": "business_A",
  "user_session_id": "session_xyz",
  "step": "llm_call",
  "timestamp": "2026-09-01T12:00:00Z",
  "prompt_tokens": 450,
  "completion_tokens": 120,
  "model_used": "gemini-3.5-flash",
  "retrieved_context_ids": ["chunk_12", "chunk_45"],
  "tool_called": null,
  "output_safety_passed": true
}
```
These logs are immutable — no service has delete permissions on the log bucket.

#### AWS DynamoDB — Decision Trace Analytics & Replay
- Every agent decision trace is written as a DynamoDB item: `trace_id`, `tenant_id`, `steps[]`, `model_used`, `tokens`, `pii_detected`, `escalation_status`
- GSI on `tenant_id + timestamp` enables efficient per-tenant queries
- Powers the `/replay` Execution Replay & Drift Analyzer page in the admin portal
- Business admins can query: "Show me all agent decisions in the last 30 days that involved a tool call"

#### AWS CloudWatch Dashboards — Alerting & SLOs
- Dashboard: per-tenant token usage, error rates, average latency, tool call success rates
- Alert: agent failure rate > 5% for any tenant → PagerDuty notification
- Alert: tenant token usage approaching quota → warning email to business admin

---

### Layer 5: Cost Metering Service
Component: Lightweight Cloud Run function

- Aggregates token usage from LLM Router (logged per call to DynamoDB)
- Aggregates tool execution counts from Tool Executor
- Writes per-tenant daily usage summaries to DynamoDB `usage_summaries` table
- Powers the Business Admin cost dashboard in `/launch` console
- Triggers quota enforcement (hard stop) when tenant exceeds monthly token budget

---

## Tenant Isolation Summary (Draw as a callout box)

All data is isolated at multiple levels:
- **Firebase Firestore**: each tenant has a separate top-level collection path (`/tenants/{tenantId}/...`)
- **Pinecone**: each tenant has a separate vector namespace with SHA-256 prefix — structurally impossible to query another tenant's vectors
- **AWS SSM Parameter Store**: each tenant's secrets use the path `/agentforge/{tenantId}/tools/{toolName}/apiKey`
- **Cloud Run**: tenant ID is injected as a gateway-verified header and validated on every request
- **AWS DynamoDB**: all trace items include `tenant_id` as partition key — GSI queries are always scoped
- **CloudWatch Logs**: all logs tagged with `tenant_id`; log-based access conditions restrict tenant admins to their own logs

---

## System Boundary Summary

INSIDE GCP boundary:
- All Cloud Run services (Next.js App Router, Orchestration, Guardrails, Tool Executor)
- Google AI APIs (Gemini 3.5 Flash, Gemini 3.6 Flash, Gemini 3.5 Flash Lite, text-embedding-004)
- Firebase Firestore (agent configs, conversation history, escalation state)

INSIDE AWS boundary:
- Amazon API Gateway (ingress & tenant routing)
- AWS SQS (human escalation queue)
- AWS DynamoDB (immutable audit trail, decision traces)
- AWS CloudWatch (structured logging, dashboards, alerting)
- AWS SSM Parameter Store (tenant tool credentials)

OUTSIDE all cloud boundaries (draw outside the box):
- Business Admin's browser
- End User's browser / mobile app
- External tool APIs (CRM, helpdesk, payment gateways, etc.)
- Pinecone (managed third-party vector DB — SaaS)
