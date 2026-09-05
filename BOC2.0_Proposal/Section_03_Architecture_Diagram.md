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
Component: Apigee API Gateway (GCP)

Data flows IN:
- Business Admin → HTTPS request with JWT token → Apigee
- End User → HTTPS chat message with tenant API key → Apigee

Apigee does:
- JWT/API key validation (authenticate the request)
- Tenant identification (which business does this key belong to?)
- Rate limiting (enforce per-tenant request quotas)
- Usage metering (count requests for billing)
- Route to correct backend service

Data flows OUT:
- Apigee → Admin Dashboard Backend (for config changes)
- Apigee → Agent Orchestration Service (for agent invocations)

Label the arrows:
- "Authenticated HTTPS with JWT"
- "Tenant-tagged routed request"

---

### Layer 2: Core Agent Processing
This is the heart of the system. Four services run here, all on Cloud Run (serverless containers).

#### 2a. Agent Orchestration Service (Cloud Run)
This is the "conductor" — it coordinates all other services per agent invocation.

Flow:
1. Receives tenant-tagged request from Apigee
2. Loads agent configuration from Firestore (allowed tools, system prompt, model choice)
3. Calls Memory & Context Layer to get relevant history
4. Sends assembled prompt to Guardrails Pipeline (input check)
5. Sends approved prompt to LLM Router
6. Receives LLM response, sends to Guardrails Pipeline (output check)
7. If LLM wants to call a tool → calls Tool Executor
8. Assembles final response → logs audit trace → returns to user

Arrows to draw:
- Orchestration → Firestore: "Load agent config"
- Orchestration → Memory Layer: "Retrieve relevant context"
- Orchestration → Guardrails (input): "Validate user input"
- Orchestration → LLM Router: "Send assembled prompt"
- Orchestration → Guardrails (output): "Validate LLM response"
- Orchestration → Tool Executor: "Execute tool call request"
- Orchestration → Audit Logger: "Write decision trace"

#### 2b. Memory & Context Layer (Cloud Run + Vertex AI Vector Search + Firestore)
Handles all agent memory operations.

Sub-components (draw as a box with 3 internal parts):
1. Embedding Service: converts user message into a vector using Vertex AI embedding model
2. Vector Search: queries the tenant's isolated vector store for top-K relevant context chunks
3. Conversation Store: Firestore collection per tenant, stores last N conversation turns

Data flows:
- Receives: raw user message + tenant ID
- Calls: Vertex AI Embedding Model → get vector
- Queries: Vertex AI Vector Search (tenant-scoped index) → get top-5 relevant passages
- Reads: Firestore (last 10 conversation turns for this user)
- Returns: assembled context block to Orchestration Service

Arrows to draw:
- Memory Layer → Vertex AI Embedding: "Embed user query"
- Memory Layer → Vertex AI Vector Search: "Similarity search (tenant index)"
- Memory Layer → Firestore: "Read conversation history"

#### 2c. LLM Router (Cloud Run + Memorystore Redis + Vertex AI)
Decides which model to use and whether to use a cached response.

Logic flow:
1. Check semantic cache in Redis: has a very similar question been answered before for this tenant?
   - If cache HIT → return cached response (no LLM call, cost = ~$0)
   - If cache MISS → proceed
2. Classify prompt complexity:
   - Simple / factual → Gemini Flash (cheapest, fastest)
   - Moderate reasoning → Gemini 1.5 Pro
   - Complex / multi-step reasoning → Gemini 1.5 Pro or Claude 3.5 Sonnet via API
3. Call selected LLM via Vertex AI or direct API
4. Store response in semantic cache (with TTL = 24 hours)
5. Log token usage to Cost Metering Service

Arrows to draw:
- LLM Router → Memorystore Redis: "Check/write semantic cache"
- LLM Router → Vertex AI Gemini Flash: "Simple query call"
- LLM Router → Vertex AI Gemini Pro: "Complex query call"
- LLM Router → Anthropic API: "Fallback / overflow call"
- LLM Router → Cost Metering: "Log token usage"

#### 2d. Guardrails Pipeline (Cloud Run)
Two-phase safety layer: runs before and after LLM.

Phase 1 — Input Validation:
- Prompt injection detector (classifier model, checks for "ignore previous instructions" patterns)
- PII scrubber (regex + NER model, removes phone numbers, SSNs, emails before sending to LLM)
- Business rule check (is this topic allowed for this agent? e.g., a support agent shouldn't answer competitor pricing questions)
- If any check fails → return safe error message to user, log the blocked attempt

Phase 2 — Output Validation:
- JSON schema check (if LLM produces a tool call — does it match the expected schema?)
- Confidence threshold check (if LLM output contains uncertainty markers below threshold → escalate)
- Sensitive action gate (if tool call is in the "high-risk" category → push to human approval queue instead of executing)
- If output passes → forward to Tool Executor (if tool call) or return to user

Arrows to draw:
- Guardrails → Cloud Pub/Sub "Human Escalation": "High-risk action detected"
- Guardrails → Audit Logger: "Log blocked attempt"

---

### Layer 3: Tool Execution & External Integration
Component: Tool Executor Service (Cloud Run)

Each tool call runs in an ephemeral, isolated Cloud Run job:
- Container spins up with only the permissions for that tenant's configured tools
- Tool call is validated against allowed schema
- HTTP request is made to external API (CRM, helpdesk, database, etc.)
- Response is returned to Orchestration Service
- Container terminates

Secrets (API keys for external tools) are never stored in the container — they are retrieved at runtime from Secret Manager, namespaced by tenant ID.

Arrows to draw:
- Tool Executor → Secret Manager: "Fetch tool credentials (tenant-scoped)"
- Tool Executor → External CRM API: "GET /orders/{id}"
- Tool Executor → External Helpdesk API: "POST /tickets"
- Tool Executor → Any external API: labeled with the action type

Cloud Pub/Sub: Human Approval Queue
- Receives high-risk tool calls from Guardrails Pipeline
- Business Admin is notified (email / in-dashboard)
- Admin can Approve or Reject
- Approval triggers Tool Executor; Rejection logs the block

---

### Layer 4: Persistence, Audit & Observability
All components write here — this layer never takes writes from external users directly.

#### Firestore (per-tenant document collections)
- Agent configurations (system prompt, tools, model settings, guardrail rules)
- Conversation histories (per user session)
- Human approval queue items

#### Cloud Logging — Audit Trail (append-only)
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
  "model_used": "gemini-flash",
  "retrieved_context_ids": ["chunk_12", "chunk_45"],
  "tool_called": null,
  "output_safety_passed": true
}
```
These logs are immutable — no service has delete permissions on the log bucket.

#### BigQuery — Analytics & Replay
- Audit logs are streamed to BigQuery via Logging export
- Businesses can query: "Show me all agent decisions in the last 30 days that involved a tool call"
- Platform Ops can query: "Which tenants have the highest token usage this week?"

#### Cloud Trace — Distributed Tracing
- Every request gets a trace ID propagated across all services
- Cloud Trace visualizes the full call chain (Apigee → Orchestration → Memory → LLM Router → Tool → Response)
- Latency breakdowns per component visible per request

#### Cloud Monitoring — Alerting
- Dashboard: per-tenant token usage, error rates, average latency, tool call success rates
- Alerts: agent failure rate > 5% for any tenant → PagerDuty notification
- Alerts: tenant token usage approaching quota → warning email to business admin

---

### Layer 5: Cost Metering Service
Component: Lightweight Cloud Run service + BigQuery

- Aggregates token usage logs from LLM Router
- Aggregates tool execution counts from Tool Executor
- Writes per-tenant daily usage summaries to BigQuery
- Powers the Business Admin cost dashboard
- Triggers quota enforcement (hard stop) when tenant exceeds monthly token budget

---

## Tenant Isolation Summary (Draw as a callout box)

All data is isolated at multiple levels:
- Firestore: each tenant has a separate top-level collection path (/tenants/{tenantId}/...)
- Vector Search: each tenant has a separate vector index
- Secret Manager: each tenant's secrets use the path /tenants/{tenantId}/tools/{toolName}/apiKey
- Cloud Run: tenant ID is injected as an environment variable and validated on every request
- IAM: service accounts are scoped to read only their own tenant's resources
- Logging: all logs are tagged with tenant_id, and log-based access policies restrict tenant admins to their own logs only

---

## System Boundary Summary

INSIDE GCP boundary:
- All Cloud Run services
- Apigee
- Vertex AI (Gemini, Vector Search, Embedding)
- Firestore
- Cloud Logging, BigQuery, Cloud Trace, Cloud Monitoring
- Memorystore (Redis)
- Secret Manager
- Cloud Pub/Sub

OUTSIDE GCP boundary (draw outside the box):
- Business Admin's browser
- End User's browser / mobile app
- External tool APIs (CRM, helpdesk, payment gateways, etc.)
- Anthropic Claude API (if used as fallback LLM)
