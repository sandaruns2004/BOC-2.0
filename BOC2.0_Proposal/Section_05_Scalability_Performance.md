# Section 5 — Scalability & Performance

## Team: [Your Team Name]
## Scenario: 5 — AI Agent Platform for Business Automation

---

## The Nature of Load in This System

Unlike a simple web application where load grows predictably with user count, an AI agent platform has multiple distinct load patterns that must be handled differently:

**Pattern 1: Gradual baseline growth**
As more businesses onboard, the steady-state request volume grows proportionally. This is standard horizontal scaling.

**Pattern 2: Per-tenant spikes**
A single business runs a product launch or marketing campaign. Their agent goes from 10 requests/minute to 2,000 requests/minute within minutes — while other tenants remain at baseline. The system must absorb this spike for that tenant without degrading any other tenant's experience.

**Pattern 3: Global concurrency spikes**
Multiple tenants spike simultaneously (e.g., Monday morning across time zones). Total system load increases without a single clear "hotspot."

**Pattern 4: LLM API rate limits**
Unlike compute resources, LLM APIs have hard rate limits (tokens per minute, requests per minute). Scaling the platform aggressively does not help if we hit the upstream LLM API ceiling — we need active management of this constraint.

Our architecture addresses all four patterns.

---

## How Each Service Scales

### Apigee API Gateway
- Apigee is fully managed and globally distributed — it scales horizontally without any configuration from us.
- Per-tenant rate limits are enforced at the gateway: even if a tenant has no rate limit contractually, a hard ceiling (e.g., 500 req/min) prevents any single tenant from overwhelming backend services.
- During a global spike, Apigee begins queuing or shedding requests per-tenant before they reach backend services, protecting the LLM budget.

### Agent Orchestration Service (Cloud Run)
- Configured with: min instances = 2 (always warm), max instances = 200, concurrency per instance = 10 (because each request holds an LLM call in flight)
- Scales from 2 to 200 instances in under 60 seconds via Cloud Run's automatic scaling
- Each instance is stateless — no session state stored in memory, all state in Firestore/Redis
- Scaling is per-service: only the Orchestration Service scales during a request spike, not all services simultaneously

### Memory & Context Layer (Cloud Run)
- Typical latency: 80–150ms (embedding call + vector search + Firestore read)
- Vector Search scales automatically: Vertex AI Vector Search is a managed service with autoscaling node pools
- Firestore reads are sub-10ms at any scale for document lookups by ID
- This layer is not a bottleneck under normal load; scales with Cloud Run auto-scaling

### LLM Router (Cloud Run + Redis)
- The semantic cache (Redis) handles 25–40% of queries with <5ms latency, dramatically reducing LLM API pressure during spikes
- Model selection is the primary mechanism for managing LLM API rate limits:
  - During high load: classifier threshold is lowered — more requests routed to Gemini Flash (10x higher rate limit than Pro)
  - If Gemini API is approaching rate limit: router queues Pro-tier requests (via Pub/Sub) rather than failing them
  - Hard rate limit reached: graceful degradation — router returns cached/approximate responses from Redis with a disclaimer, rather than returning errors

**LLM Token Budget Management:**
- Each tenant has a monthly token quota stored in Firestore
- Every LLM call decrements the tenant's available quota atomically (using Firestore transactions)
- At 80% quota: warning notification sent to tenant admin
- At 100% quota: agent returns a friendly "usage limit reached" message rather than calling LLM
- This prevents one tenant from consuming the entire platform's LLM allocation

### Tool Executor (Cloud Run Jobs)
- Each tool call runs as a short-lived Cloud Run Job (not a long-running service)
- Jobs are isolated: one tenant's tool calls cannot consume containers belonging to another tenant
- Concurrency limit per tenant: configurable per plan (e.g., max 10 simultaneous tool calls per tenant)
- External API calls that timeout (>10 seconds) are terminated and reported as failures — no indefinite hanging

### Guardrails Pipeline (Cloud Run)
- Lightweight ML classifiers — CPU-based inference, fast (~20ms per check)
- Scales linearly with Orchestration Service — no special scaling considerations

---

## Latency Budget: End-to-End Request

For a typical agent request (no tool call, cache miss):

| Step                          | Expected Latency | Notes                          |
|-------------------------------|-----------------|--------------------------------|
| Apigee auth + routing         | 10–20ms         | Edge-located                   |
| Orchestration: config load    | 5–10ms          | Firestore cached in Redis      |
| Embedding generation          | 30–50ms         | Vertex AI embedding model      |
| Vector Search retrieval       | 20–40ms         | ANN search, ~50ms P99          |
| Conversation history load     | 5–10ms          | Firestore document read        |
| Guardrails (input)            | 15–25ms         | Lightweight classifier         |
| LLM call (Gemini Flash)       | 400–800ms       | Dominant latency factor        |
| Guardrails (output)           | 10–20ms         |                                |
| Audit log write (async)       | 0ms (async)     | Written via Pub/Sub background |
| Response serialization        | 5ms             |                                |
| **Total (P50 estimate)**      | **~550ms**      |                                |
| **Total (P95 estimate)**      | **~1,200ms**    | With Pro model + cold start    |

For requests with a semantic cache hit:
- Total latency: ~50ms (embedding + Redis lookup + response)

---

## Performance for Streaming Responses

For user-facing chat interfaces, 800ms "thinking time" before any text appears feels slow. We support **streaming responses** (Server-Sent Events):
- As soon as the LLM begins generating tokens, they are streamed back to the end user in real time
- This means the user sees text appearing within 200–300ms of the LLM starting
- Even if total response generation takes 2 seconds, the UX feels fast because the first tokens appear quickly

---

## Multi-Tenant Spike Isolation: Concrete Mechanism

The key mechanism ensuring one tenant's spike doesn't affect others:

1. Apigee enforces per-tenant rate limits before any backend processing
2. LLM Router maintains per-tenant token buckets in Redis — each tenant's LLM calls are metered independently
3. Tool Executor has per-tenant concurrency limits (Cloud Run Jobs with namespace-based quotas)
4. Firestore reads are per-tenant document paths — no shared scan queries that could be slowed by another tenant's data volume
5. Vector Search uses per-tenant indexes — a spike in one tenant's queries does not affect search latency for others

If Tenant A spikes to 10x normal volume and hits their rate limit at the gateway, their requests are queued or rejected. Tenants B, C, D experience no degradation whatsoever because they were never competing for the same resources — they have separate quotas, separate indexes, and separate tool execution slots.
