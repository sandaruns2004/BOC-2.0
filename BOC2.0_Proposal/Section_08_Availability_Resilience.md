# Section 8 — Availability & Resilience

## Team: [Your Team Name]
## Scenario: 5 — AI Agent Platform for Business Automation

---

## What Level of Resilience Is Appropriate?

Not every system needs a multi-region active-active architecture with zero-downtime failover. For an AI agent platform:

- **Brief downtime (1–5 minutes)**: annoying but tolerable — a business's customer simply gets an error and tries again
- **Data loss**: not tolerable — a tenant's agent configuration, knowledge base, and conversation history disappearing would be catastrophic for trust and business continuity
- **Silent wrong behavior**: the most dangerous failure — the agent gives wrong answers without anyone knowing, or executes incorrect tool calls

Our resilience strategy prioritizes in order:
1. **Correctness & data durability** (highest priority)
2. **Graceful degradation** (fail visibly and safely, not silently and dangerously)
3. **Rapid recovery** (minimize mean time to recovery, not just mean time to failure)
4. **High availability** (minimize outage duration)

---

## Component-by-Component Failure Analysis

### Failure: Gemini Flash API is Degraded or Rate-Limited

**What happens without mitigation:** All agent requests fail; users receive errors.

**Our response (cascading fallback — 3-tier circuit breaker):**
1. LLM Router detects elevated error rate (>5% in 60s) or latency (>1,200ms P99) from Gemini 3.5 Flash
2. Circuit breaker opens — automatically switches to **Gemini 3.6 Flash** (secondary fallback)
3. If Gemini 3.6 Flash is also degraded: switches to **Gemini 3.5 Flash Lite** (tertiary graceful degradation — simple queries only)
4. If all Gemini tiers are degraded: return a graceful "Agent temporarily unavailable, try again in a moment" message — never silently return a stale/wrong answer
5. Circuit breaker pattern: after 10 consecutive failures to a model tier, it opens the circuit (stops calling that tier for 60 seconds), preventing timeout pile-up

**Detection:** AWS CloudWatch alert triggers on Gemini API error rate >3% — PagerDuty notification within 2 minutes.

---

### Failure: Firestore is Temporarily Unavailable

**What happens:** Agent configurations and conversation history cannot be read.

**Our response:**
1. Agent configurations are cached in **Firebase Firestore** with in-memory TTL — most requests can proceed using the last-known config without re-reading Firestore
2. Conversation history (last 10 turns) is also cached in-process per session ID with a 30-minute TTL — active sessions continue seamlessly
3. New sessions (no cache entry yet) return a graceful "starting fresh context" response — the agent works but without history, which is clearly better than failing
4. Write failures (saving new conversation turns): these are queued to **AWS SQS** and retried automatically when Firestore recovers — no turn is permanently lost

**Data durability:** Firebase Firestore uses multi-region replication. A single availability zone failure does not cause data loss. RPO (recovery point objective) = 0 — no data is lost. RTO (recovery time objective) = <60 seconds for automatic failover to another AZ.

---

### Failure: In-Memory Cache is Unavailable

**What happens:** Semantic config cache is unavailable.

**Our response:**
1. LLM Router switches to **cache-bypass mode** — all requests go directly to the LLM from Gemini
2. Config cache miss: Orchestration Service reads agent config directly from Firebase Firestore (adds ~10ms latency, not a correctness issue)
3. Effect: slightly higher latency but zero correctness impact
4. Graceful degradation: system continues operating normally, just without the caching optimization

---

### Failure: Tool Executor's External API Call Times Out

**What happens:** Agent is waiting for a tool response (e.g., CRM lookup) that never comes.

**Our response:**
1. All tool calls have a **hard 10-second timeout** — no indefinite hanging
2. On timeout: Tool Executor returns a structured error to Orchestration Service
3. Orchestration Service passes the error to the LLM with a correction prompt: "The tool call timed out. Inform the user the information is temporarily unavailable and suggest they try again."
4. The LLM generates a graceful, user-friendly error message
5. The timeout and failure are logged to the audit trail

---

### Failure: An Agent Enters a Tool-Calling Loop

**What happens:** A misbehaving agent repeatedly calls the same tool (potentially in an infinite loop), consuming API credits and generating external API requests rapidly.

**Our response:**
1. Orchestration Service tracks the number of tool calls within a single conversation turn — hard limit of **10 tool calls per turn**
2. If the limit is hit: execution stops, the agent returns a "task too complex" message to the user
3. Total tool calls per session: hard limit of **50 per session** — prevents an agent from running loops across multiple turns
4. Anomaly detection: if a tenant's tool call rate exceeds 3× their 7-day moving average for more than 5 minutes → alert to Platform Ops for investigation

---

### Failure: A Cloud Run Service Has a Bug and Crashes

**What happens:** A Cloud Run service (e.g., Guardrails Pipeline) starts crashing on every request.

**Our response:**
1. Cloud Run automatically routes traffic away from crashing instances and starts new ones
2. Health checks: Cloud Run performs startup and liveness checks — unhealthy containers are replaced within 30 seconds
3. Graceful shutdown: Cloud Run signals SIGTERM 15 seconds before terminating an instance — in-flight requests are drained before termination
4. If the Guardrails Pipeline is down: Orchestration Service detects the error and applies a **fail-safe default** — all requests are blocked (fail closed, not fail open) until Guardrails recovers. This is the correct behavior for a safety-critical component: we do not want agents executing tool calls without guardrail checks.

---

### Failure: A Secret (Tool API Key) is Compromised

**What happens:** A malicious actor obtains a tenant's tool credentials.

**Our response:**
1. Business admin can rotate the compromised secret in the dashboard — new version is immediately active in Secret Manager
2. Old version is disabled (not deleted, for audit purposes) — any in-flight request using the old version fails with a 401 from the external API, prompting graceful retry with new credentials
3. Platform Ops can force-disable a tenant's tool execution entirely from the admin console in an emergency

---

## Backup & Disaster Recovery

| Data                    | Backup Frequency | Retention  | Recovery Method                          |
|-------------------------|-----------------|------------|------------------------------------------|
| Firestore (all tenants) | Daily automated export to Cloud Storage | 30 days | Point-in-time restore via import |
| Pinecone vector indexes | Weekly namespace export | 4 weeks | Re-import from snapshot |
| AWS SSM Parameter Store | Versioned (every change) | 90 days | Roll back to any previous version |
| CloudWatch Logs         | Continuous streaming | 5GB/month free | No recovery needed; append-only |
| DynamoDB traces         | Continuous write | 25GB free forever | No recovery needed; append-only |

---

## Regional Failure

At pilot scale, we deploy in a single GCP region (e.g., us-central1). This region has 3 availability zones (AZs):
- All services (Cloud Run, Firestore, Vector Search) are deployed across all 3 AZs automatically
- A single AZ failure causes <30 second degradation as traffic shifts to remaining AZs
- A full regional failure (extremely rare, affecting all 3 AZs) would cause complete outage

At pilot scale, we do not implement multi-region active-active because:
- The cost (roughly 2× infrastructure cost) is not justified for a pilot with 10 tenants
- Agent response correctness is not time-critical in the way a financial transaction or safety alert is
- Our RTO for a regional failure is 4 hours (bring up services in a secondary region from backup data), which is acceptable for a non-safety-critical B2B SaaS platform

**Future roadmap:** At production scale with enterprise SLA customers, add a hot standby region with data replication targeting RTO <15 minutes.

---

## Resilience Summary

| Failure Scenario            | Impact                        | Recovery Mechanism             | RTO      |
|-----------------------------|-------------------------------|-------------------------------|----------|
| Gemini 3.5 Flash degraded   | Routes to Gemini 3.6 Flash    | 3-tier circuit breaker chain   | Seconds  |
| All Gemini tiers degraded   | Graceful "unavailable" message | Circuit breaker + safe fallback | Seconds  |
| Firestore unavailable       | Config from cache, writes queued | In-memory cache + SQS queue | Minutes  |
| In-memory cache miss        | Cache bypass mode             | Direct Firestore read (+10ms)  | 0ms      |
| Tool call timeout           | Graceful error message        | Hard timeout + LLM error prompt | N/A    |
| Agent tool loop             | Hard turn/session limit       | Automatic stop + alert        | Immediate|
| Cloud Run service crash     | New instances auto-started    | Health check + SIGTERM drain  | <30s     |
| Full region failure         | Complete outage               | Restore from backup to new region | 4h    |
