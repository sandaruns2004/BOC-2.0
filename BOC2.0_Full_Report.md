# BOC 2.0 — Full Proposal Report
## Scenario 5: AI Agent Platform for Business Automation
### Platform: **AgentForge** — *"Deploy intelligent agents. Own the results."*

---

> **Competition:** Beauty of Cloud 2.0 (BOC 2.0)
> **Scenario Chosen:** Scenario 5 — AI Agent Platform for Business Automation
> **Cloud Platform:** Google Cloud Platform (GCP) — Primary; Anthropic Claude API — LLM Fallback
> **Submission Deadline:** September 6, 11:59 PM

---

## Cover Sheet

| Field | Details |
|---|---|
| **Team Name** | *(Fill before submission)* |
| **Scenario** | Scenario 5 — AI Agent Platform for Business Automation |
| **Cloud Platform** | GCP (Google Cloud Platform) — Primary |
| **Fallback LLM** | Anthropic Claude API (external, LLM fallback only) |

### Team Members

| # | Full Name | Role | University | Faculty | Email | Contact |
|---|-----------|------|------------|---------|-------|---------|
| 1 | | Team Lead / Cloud Architect | | | | |
| 2 | | Backend Engineer / LLM Orchestration | | | | |
| 3 | | Security and Observability Lead | | | | |
| 4 | | Documentation and Diagrams | | | | |

---

## Executive Summary

**AgentForge** is a cloud-native, multi-tenant AI Agent Platform built on Google Cloud Platform that lets businesses deploy production-ready autonomous AI agents with memory, tool-calling, safety guardrails, cost controls, and full observability without building any of that infrastructure themselves.

The platform is built around the principle of **bounded autonomy**: AI agents should be able to act autonomously, but they should never receive uncontrolled authority over enterprise data, systems, money, or other agents. Every agent action passes through layered policy, risk, and approval gates before it reaches an enterprise system.

**Three deep focus areas:**
1. Safe tool-calling with a 3-layer guardrails pipeline — the most dangerous part of an AI agent platform, executed correctly
2. Tenant-isolated RAG-based memory — keeping agent context relevant, cheap, and completely isolated per business
3. Per-decision audit trails — making agent behavior explainable and debuggable for any interaction in history

**Pilot cost:** ~$158/month for 10 tenants, ~15,000 conversations/month (~$0.0106/conversation)

---

# Section 1 — Problem Understanding

## The Problem in Our Own Words

Businesses today face a significant and growing challenge: they want AI to do more than just answer questions. They need AI that can autonomously complete multi-step tasks — scheduling meetings, drafting reports, querying internal databases, triggering workflows in other software, and handling customer queries end-to-end — without a human having to supervise each step.

The problem is that building this capability in-house is prohibitively hard. A business that wants to deploy an "AI customer support agent" does not just need to call an LLM API. They need to solve:

- How does the agent remember what the customer said last week?
- How does it safely look up the customer's order status from the internal database?
- What stops it from accidentally triggering a refund for the wrong order?
- How does the business know why the agent said something wrong so they can fix it?
- How do they control how much it costs per month?

None of these questions have easy off-the-shelf answers. Companies that try to build this themselves spend months on infrastructure, security reviews, and debugging before they have even written the business logic they actually care about.

**The specific gap we are addressing:**
There is no widely available, multi-tenant platform that provides businesses with a complete, production-ready environment to deploy AI agents with memory, tool-calling, safety guardrails, cost controls, and full observability without building any of that infrastructure themselves.

## The Broader Enterprise Problem

As organizations move from a few experimental agents to hundreds or thousands of autonomous agents, a new infrastructure problem emerges:

> How can an enterprise safely operate large numbers of autonomous AI workers across critical business systems without losing control of permissions, data, decisions, cost, accountability, or recovery?

A normal chatbot architecture is not sufficient. The platform must answer:

- Who is this agent? What is it allowed to do?
- Who authorized it? Can it delegate authority?
- What data can it access? How much money can it spend?
- What happens when its behavior becomes abnormal?
- How do we stop it immediately?
- Can we reconstruct exactly what happened?
- Can we safely recover from an incident?

## Who Is Affected

### Businesses (Platform Customers)
Small-to-medium businesses are most severely affected. Large enterprises can afford to hire ML engineers and DevOps teams to build agent infrastructure. Smaller businesses cannot — they are left choosing between a basic chatbot that cannot take actions, a proprietary black-box solution with no transparency, or attempting to build it themselves and getting stuck on infrastructure.

### End Users (Customers of Those Businesses)
End users are affected when the agent gives confidently wrong answers because it has no memory of prior context, the agent takes unintended actions, or there is no way to escalate or override the agent's decision.

### Platform Operators
Without the right infrastructure, monitoring multi-tenant agent behavior becomes impossible. A single misbehaving tenant's agent can flood LLM quotas, affecting all other tenants.

## Why Existing Solutions Fall Short

| Existing Option | Limitation |
|---|---|
| Raw LLM APIs (OpenAI, Gemini) | No memory, no tool-calling infra, no guardrails, no multi-tenancy |
| LangChain / LlamaIndex | Framework, not a platform — requires significant engineering to productionize |
| Azure AI Foundry / AWS Bedrock Agents | Tied to a single cloud ecosystem, limited cross-tenant isolation |
| Building in-house | 3-6 months of infrastructure work before any business logic, ongoing ops burden |
| Generic chatbot platforms | Cannot take real-world actions, no tool integration, no memory across sessions |

## Our Specific Focus

Rather than trying to solve every edge case shallowly, our team focuses on three interconnected pillars:

### Pillar 1: Safe Tool-Calling with Guardrails
We go deep on the mechanism that allows agents to actually do things — call APIs, query databases, send messages — safely. This is the hardest part to get right and the most likely to cause real-world harm if done wrong.

### Pillar 2: Tenant-Isolated Memory with RAG
We go deep on how agent memory works in a multi-tenant context, ensuring no tenant's data ever leaks into another's context, while keeping memory retrieval fast and cost-efficient.

### Pillar 3: Per-Decision Audit Trails
We go deep on the observability layer — specifically how every agent decision is traced, stored, and made queryable, so a business can answer "why did the agent do that?" for any interaction in history.

We explicitly acknowledge we are not going deep on: UI/UX of the agent builder dashboard, billing and payment processing for the platform itself, or fine-tuning LLM models.

---

# Section 2 — Proposed Solution Overview

## Plain-Language Summary

We are building **AgentForge** — a cloud platform where any business can sign up, configure an AI agent suited to their use case, and have it running in production within hours — with full memory of past interactions, the ability to call their own systems and APIs, built-in safety guardrails, and a complete audit log of every decision the agent ever made.

The business never has to worry about hosting a language model, managing vector databases, writing guardrail logic, or figuring out how to keep their agent's costs under control. AgentForge handles all of that. The business focuses only on what their agent should do — we handle how it safely does it.

## What AgentForge Provides

### For the Business (Admin)
- A web dashboard to create and configure AI agents
- Connect the agent to their own tools: CRM, helpdesk, database, email, custom API
- Set guardrails: what the agent is and is not allowed to do
- View a live cost dashboard: tokens used, actions taken, estimated monthly bill
- Review full audit logs: every conversation, every decision, every action taken

### For the End User (Customer)
- Interact with the agent through a chat widget or REST API
- The agent remembers past interactions within a session and across sessions
- If the agent is unsure or the action is risky, it escalates to a human seamlessly

### For the Platform Team (AgentForge Ops)
- A global monitoring dashboard showing all tenants
- Anomaly alerts: agents making unusual numbers of tool calls, spiking in token usage, failing repeatedly
- Per-tenant resource quotas enforced automatically
- LLM API usage centralized and metered

## How It Works (Simple Flow)

1. A business signs up for AgentForge and creates an agent named "Support Bot"
2. They connect it to their helpdesk API and their product FAQ document
3. A customer sends a message: "What's the status of my order #1234?"
4. AgentForge checks conversation history and retrieves relevant memory, runs the message through the input safety classifier, sends context + message to the LLM routed to the appropriate model based on complexity, the LLM decides to call the get_order_status tool, AgentForge validates the tool call against the business's allowed-action list, executes the tool call in an isolated container, the LLM generates a response, output is validated against the output safety rules, and every step is logged as an immutable audit trace.
5. The customer receives the response in under 2 seconds.

## What Makes AgentForge Different

| Capability | Generic LLM API | LangChain (DIY) | AgentForge |
|---|---|---|---|
| Multi-tenant isolation | No | No | Yes |
| Production-ready memory/RAG | No | Requires work | Yes, out of box |
| Guardrails pipeline | No | Requires work | Yes, 3-layer |
| Cost metering per tenant | No | No | Yes |
| Full audit trail | No | No | Yes |
| Human escalation queue | No | No | Yes |
| Deploy in less than 1 hour | Kind of | No | Yes |

> AgentForge turns the complex, risky, expensive infrastructure of running AI agents into a simple configuration problem — so businesses can focus on what their agents do, not how they work.

---

# Section 3 — Architecture Diagram and Data Flows

## Core Architectural Thesis: Bounded Autonomy

The central design principle is:

> Give agents enough authority to complete goals, but never enough authority to cause uncontrolled damage.

Every agent operates under an explicit and dynamically evaluated authority boundary. The AI agent makes a decision, but the **control plane owns the authority to execute the action**.

## High-Level Reference Architecture

```
                    ENTERPRISE USERS
                           |
                       API / UI
                           |
            +--------------+--------------+
            |       CONTROL PLANE         |
            |                             |
            |  Agent Registry             |
            |  Identity                   |
            |  Policy Engine              |
            |  Authority Manager          |
            |  Risk Engine                |
            |  Budget Manager             |
            |  Approval Manager           |
            +--------------+--------------+
                           |
                     EVENT / QUEUE BUS
                           |
            +--------------+--------------+
            |       AGENT RUNTIME         |
            |                             |
            |  Planner                    |
            |  Memory / RAG               |
            |  Workflow Executor          |
            |  Model Router               |
            +--------------+--------------+
                           |
                     AGENT FIREWALL
                           |
            +--------------+--------------+
            |       TOOL GATEWAY          |
            +------+----------+-----------+
                   |          |
                   v          v
                 CRM        ERP / Finance / HR
                   |          |
                   +----+-----+
                        v
               ENTERPRISE SYSTEMS

       +------------------------------------------+
       |          OBSERVABILITY / TRUST           |
       |                                          |
       |  Tracing  Audit  Replay  Cost            |
       |  Anomaly Detection  Incident Response    |
       |  Blast Radius  Evaluation                |
       +------------------------------------------+
```

## End-to-End Flow

```
BUSINESS GOAL
      |
      v
AGENT ORCHESTRATOR
      |
   +--+--+
   |     |
MEMORY   MODEL ROUTER
  RAG       |
   |        |
   +---+----+
       |
  PLAN ACTION
       |
       v
 AGENT FIREWALL
       |
  +----+----+
  |         |
POLICY   RISK ENGINE
ENGINE       |
  |          |
  +----+-----+
       |
  APPROVAL CHECK
     |       |
   ALLOW   APPROVE
     |       |
     +---+---+
         |
    TOOL GATEWAY
         |
    ENTERPRISE SYSTEM
         |
    VERIFY RESULT
         |
     +---+---+
     |       |
  AUDIT   NEXT TASK
  TRACE       |
              +---> LOOP
```

## Architecture Layers

### Layer 0: External Actors
Business Admin (browser user), End User (browser / mobile app / API consumer), and External APIs (third-party tools the agent can call such as CRM, helpdesk, payment system) — all drawn outside the cloud boundary.

### Layer 1: Entry / API Gateway — Apigee
- JWT/API key validation
- Tenant identification
- Rate limiting (per-tenant request quotas)
- Usage metering (for billing)
- Route to correct backend service

### Layer 2: Core Agent Processing (Cloud Run — Stateless, Auto-Scaling)

#### 2a. Agent Orchestration Service
The "conductor" that coordinates all other services per agent invocation:
1. Receives tenant-tagged request from Apigee
2. Loads agent configuration from Firestore
3. Calls Memory and Context Layer to get relevant history
4. Sends assembled prompt to Guardrails Pipeline (input check)
5. Sends approved prompt to LLM Router
6. Receives LLM response, sends to Guardrails Pipeline (output check)
7. If LLM wants to call a tool, calls Tool Executor
8. Assembles final response, logs audit trace, returns to user

#### 2b. Memory and Context Layer (Cloud Run + Vertex AI Vector Search + Firestore)
- **Embedding Service**: converts user message into a vector using Vertex AI embedding model
- **Vector Search**: queries the tenant's isolated vector store for top-K relevant context chunks
- **Conversation Store**: Firestore collection per tenant, stores last N conversation turns

Each tenant gets a **separate vector index** — cross-tenant data leakage is structurally impossible, not just policy-enforced.

#### 2c. LLM Router (Cloud Run + Memorystore Redis + Vertex AI)
1. Check semantic cache in Redis (cache HIT returns cached response at ~$0 cost)
2. Classify prompt complexity and route to appropriate model
3. Call selected LLM via Vertex AI or direct API
4. Store response in semantic cache (TTL = 24 hours)
5. Log token usage to Cost Metering Service

#### 2d. Guardrails Pipeline (Cloud Run) — 3-Layer Safety

**Phase 1 — Input Validation:**
- Prompt injection detector
- PII scrubber (regex + NER model, removes phone numbers, SSNs, emails)
- Business rule check

**Phase 2 — Output Validation:**
- JSON schema check (tool call must match expected schema)
- Confidence threshold check
- Sensitive action gate — high-risk actions go to human approval queue

### Layer 3: Tool Execution and External Integration
- Each tool call runs in an ephemeral, isolated Cloud Run job
- Secrets are never stored in the container — retrieved at runtime from Secret Manager
- Allowlist-only: calls to URLs not on the configured list are blocked unconditionally
- VPC Service Controls block outbound traffic to private IP ranges (SSRF prevention)

### Layer 4: Persistence, Audit and Observability
- **Firestore**: per-tenant document collections for agent configurations and conversation histories
- **Cloud Logging — Audit Trail**: every agent step logged as structured JSON, immutable, no service has delete permissions
- **BigQuery — Analytics and Replay**: full SQL queryable audit trail
- **Cloud Trace — Distributed Tracing**: every request gets a trace ID propagated across all services
- **Cloud Monitoring — Alerting**: per-tenant + platform-wide dashboards with PagerDuty integration

### Layer 5: Cost Metering Service
- Per-tenant token usage tracking and quota enforcement
- Hard stop when tenant exceeds monthly token budget
- Powers the Business Admin cost dashboard

## Tenant Isolation Summary

All data is isolated at multiple structural levels:

| Layer | Isolation Mechanism |
|---|---|
| Firestore | Separate top-level collection path per tenant (/tenants/{tenantId}/...) |
| Vector Search | Separate vector index per tenant |
| Secret Manager | Path-based namespacing (/tenants/{tenantId}/tools/{toolName}/apiKey) |
| Cloud Run | Tenant ID injected as a verified, gateway-injected header (never trusted from request body) |
| IAM | Service accounts scoped to read only their own tenant's resources |
| Logging | All logs tagged with tenant_id, log-based access policies restrict tenant admins to their own logs |

---

# Section 4 — Technology Choices and Justification

## Guiding Principle

Every technology choice answers three questions:
1. What does it do?
2. Why does this problem specifically need it?
3. What did we consider instead, and why did we not choose it?

## GCP — Cloud Platform Justification

| Need | GCP Service | Why GCP Wins Here |
|---|---|---|
| LLM Inference | Vertex AI (Gemini APIs) | Native, managed, no cold start |
| Vector Search | Vertex AI Vector Search | Fully managed, scales automatically |
| Agent Orchestration | Cloud Run | Per-request billing, auto-scales to zero |
| Message Queue | Cloud Pub/Sub | High-throughput, multi-tenant friendly |
| Audit Logging | Cloud Logging + BigQuery | Append-only, queryable, tamper-evident |
| Secrets / Tool Auth | Secret Manager | Per-tenant secret namespacing |
| API Gateway | Apigee | Rate limiting, tenant auth, metering |
| Monitoring | Cloud Monitoring + Trace | End-to-end distributed tracing |
| Database | Firestore | Per-tenant document collections, real-time |
| Semantic Cache | Memorystore (Redis) | Sub-millisecond cache lookups |

GCP's tight Vertex AI integration means we avoid stitching together third-party LLM APIs with separate infrastructure — everything is native, IAM-controlled, and audit-logged by default.

## 1. Cloud Run — Core Compute

**Why for this problem:**
An AI agent platform has inherently unpredictable traffic. Cloud Run scales to zero when idle (zero cost) and spins up new instances within seconds during spikes. Each service scales independently — if we get a wave of tool-heavy requests, only the Tool Executor needs to scale, not the memory layer.

**Considered instead:** Cloud Functions (rejected — long request lifecycles, 5-30 second multi-step reasoning); GKE (rejected — unnecessary cluster management overhead).

## 2. Apigee API Gateway — Entry Point and Tenant Routing

**Why for this problem:**
Multi-tenancy requires every request to be authenticated and attributed to a specific business tenant before it reaches any internal service. Apigee handles this at the perimeter: validates tenant's API key, injects tenant context header, enforces per-tenant rate limits, and meters usage for billing — before a single line of business logic runs.

**Considered instead:** Cloud Endpoints (lacks Apigee's per-tenant policy management); NGINX Ingress (manual policy management, no GCP IAM integration).

## 3. Vertex AI Vector Search — Tenant-Isolated Agent Memory

**Why for this problem:**
Passing entire conversation history to the LLM on every call is prohibitively expensive and hits context window limits. Vector search solves this: we embed every conversation turn and knowledge base document, store them as vectors, and retrieve only the top-K most semantically relevant ones. Each tenant gets a **separate vector index** — cross-tenant data leakage is structurally impossible.

**Considered instead:** Pinecone (data residency outside GCP, complicating compliance); PostgreSQL with pgvector (not managed at target throughput).

## 4. Vertex AI Embedding Models (text-embedding-004)

**Why for this problem:**
Using a GCP-native embedding model means no external API dependency on a latency-critical path, consistent embedding dimensions with Vector Search configuration, and very low cost at ~$0.000025/1K tokens — negligible relative to LLM costs.

## 5. Gemini API via Vertex AI — Primary LLM

**Model selection strategy (cost critical):**
- **Gemini Flash**: $0.075/1M input tokens, $0.30/1M output tokens — used for more than 60% of requests
- **Gemini 1.5 Pro**: $3.50/1M input tokens, $10.50/1M output tokens — complex multi-step tasks only
- **Claude 3.5 Sonnet (via API)**: fallback if Gemini API is degraded

**Why Vertex AI:** No external API calls (LLM inference stays within GCP network), native IAM-based access control, automatic request logging through GCP Audit Logs, and native function-calling support.

## 6. Memorystore for Redis — Semantic Response Cache

**Why for this problem:**
A significant portion of queries to a business support agent are semantically identical ("What are your business hours?" "When are you open?"). Semantic caching embeds the incoming query, checks if any stored embedding is within a cosine similarity threshold (>0.92), and if yes returns the cached response — 0 tokens consumed, less than 5ms latency vs. 800ms for a real LLM call.

**Estimated cache hit rate:** 25-40% of queries — directly translating to 25-40% reduction in LLM inference costs.

## 7. Firestore — Conversational State and Agent Configuration

**Why for this problem:**
Agent configuration data has a flexible, nested schema that varies significantly between tenants. Firestore's document model accommodates this naturally. For conversation history, we need per-user sub-collections queryable efficiently by session ID without complex joins. Firestore's collection-document hierarchy maps directly to this pattern.

## 8. Secret Manager — Tool Credentials per Tenant

**Why for this problem:**
Each business tenant configures their agent to call their own external APIs. Secret Manager stores each credential at a path namespaced by tenant. The Tool Executor service account has IAM permission to read only the secrets in its current tenant's namespace — structurally preventing cross-tenant credential access.

## 9. Cloud Pub/Sub — Human Escalation Queue and Async Decoupling

**Why for this problem:**
When the Guardrails Pipeline identifies a high-risk action, we cannot simply block and wait for human approval synchronously — this would hold the user's connection open indefinitely. Instead, the Guardrails Pipeline publishes the pending action to a Pub/Sub topic, immediately responds to the user, and the admin receives a notification to review. Pub/Sub also decouples audit log writing from the critical path.

## 10. Cloud Logging + BigQuery — Immutable Audit Trail

**Why for this problem:**
The problem statement explicitly requires the ability to explain "why an agent made a given decision" — not just that it made one. Cloud Logging captures every intermediate step at sub-second granularity with structured JSON fields. BigQuery allows arbitrary SQL queries across months of agent decision history. The Log Sink is configured with a **deletion lock** on the BigQuery dataset, making the audit trail tamper-evident.

## 11. Cloud Trace — Distributed Request Tracing

**Why for this problem:**
An agent invocation touches 5-7 services. When a request is slow or fails, identifying which service caused the issue without distributed tracing requires guesswork. Cloud Trace propagates a trace ID across all services automatically, providing a single view of the entire request lifecycle with per-service latency breakdowns.

## Summary Table

| Component | GCP Service | Primary Reason for Choice |
|---|---|---|
| API Entry and Auth | Apigee | Multi-tenant rate limiting + metering |
| Compute | Cloud Run | Independent auto-scaling per service |
| LLM Inference | Vertex AI (Gemini) | Native, no external API, IAM-controlled |
| Agent Memory | Vertex AI Vector Search | Tenant-isolated embeddings at scale |
| Embedding | Vertex AI text-embedding | Co-located, consistent vector space |
| Response Cache | Memorystore (Redis) | Semantic cache - 25-40% cost saving |
| State and Config | Firestore | Flexible schema, per-tenant collections |
| Tool Credentials | Secret Manager | Tenant-namespaced secrets, IAM-enforced |
| Async Queues | Cloud Pub/Sub | Decoupled escalation + audit logging |
| Audit Trail | Cloud Logging + BigQuery | Immutable, queryable decision history |
| Distributed Tracing | Cloud Trace | Per-request cross-service visibility |
| Monitoring | Cloud Monitoring | Dashboards + alerting for all tenants |

---

# Section 5 — Scalability and Performance

## Load Patterns in This System

**Pattern 1: Gradual baseline growth** — Standard horizontal scaling as more businesses onboard.

**Pattern 2: Per-tenant spikes** — A single business runs a product launch. Their agent goes from 10 to 2,000 requests/minute within minutes while other tenants remain at baseline.

**Pattern 3: Global concurrency spikes** — Multiple tenants spike simultaneously.

**Pattern 4: LLM API rate limits** — Scaling the platform does not help if we hit the upstream LLM API ceiling. We need active management of this constraint.

## How Each Service Scales

### Apigee API Gateway
Fully managed and globally distributed — scales horizontally without any configuration from us. Per-tenant rate limits enforced at the gateway protect the LLM budget.

### Agent Orchestration Service (Cloud Run)
- min instances = 2 (always warm), max instances = 200, concurrency per instance = 10
- Scales from 2 to 200 instances in under 60 seconds
- Each instance is stateless — all state in Firestore/Redis

### Memory and Context Layer
- Typical latency: 80-150ms (embedding call + vector search + Firestore read)
- Vector Search scales automatically as a fully managed service

### LLM Router
- Semantic cache (Redis) handles 25-40% of queries with less than 5ms latency
- During high load: classifier threshold lowered — more requests routed to Gemini Flash (10x higher rate limit than Pro)
- Hard rate limit reached: graceful degradation — returns cached/approximate responses with a disclaimer rather than errors

**LLM Token Budget Management:**
- Each tenant has a monthly token quota stored in Firestore
- At 80% quota: warning notification sent to tenant admin
- At 100% quota: agent returns "usage limit reached" message rather than calling LLM

### Tool Executor (Cloud Run Jobs)
- Each tool call runs as a short-lived Cloud Run Job
- Concurrency limit per tenant: configurable per plan
- External API calls that timeout (more than 10 seconds) are terminated and reported as failures

## Latency Budget: End-to-End Request

For a typical agent request (no tool call, cache miss):

| Step | Expected Latency | Notes |
|---|---|---|
| Apigee auth + routing | 10-20ms | Edge-located |
| Orchestration: config load | 5-10ms | Firestore cached in Redis |
| Embedding generation | 30-50ms | Vertex AI embedding model |
| Vector Search retrieval | 20-40ms | ANN search, ~50ms P99 |
| Conversation history load | 5-10ms | Firestore document read |
| Guardrails (input) | 15-25ms | Lightweight classifier |
| LLM call (Gemini Flash) | 400-800ms | Dominant latency factor |
| Guardrails (output) | 10-20ms | |
| Audit log write (async) | 0ms (async) | Written via Pub/Sub background |
| Response serialization | 5ms | |
| **Total (P50 estimate)** | **~550ms** | |
| **Total (P95 estimate)** | **~1,200ms** | With Pro model + cold start |

For requests with a semantic cache hit: **Total latency: ~50ms**

## Streaming Responses

We support **streaming responses** (Server-Sent Events):
- As soon as the LLM begins generating tokens, they are streamed back to the end user in real time
- User sees text appearing within 200-300ms of the LLM starting
- Even if total response generation takes 2 seconds, UX feels fast

## Multi-Tenant Spike Isolation

The key mechanism ensuring one tenant's spike does not affect others:
1. Apigee enforces per-tenant rate limits before any backend processing
2. LLM Router maintains per-tenant token buckets in Redis — independently metered
3. Tool Executor has per-tenant concurrency limits
4. Firestore reads are per-tenant document paths — no shared scan queries
5. Vector Search uses per-tenant indexes — a spike in one tenant's queries does not affect search latency for others

---

# Section 6 — Security, Privacy and Compliance

## Overview

An AI agent platform handles some of the most sensitive data in enterprise software: businesses' internal system credentials, end-users' personal information, agent conversations that may include financial or personal details, and businesses' proprietary knowledge base documents.

The key principle throughout our security design is **defense in depth with structural enforcement**: wherever possible, security is enforced by the infrastructure's structure rather than relying solely on application-level checks that could be bypassed by a code bug.

## 1. Multi-Tenant Data Isolation

The most dangerous failure mode in a multi-tenant AI platform is "data bleed" — one tenant's data appearing in another tenant's agent responses.

### Structural Separation (Not Just Policy-Based)
- Each tenant has a **separate Vertex AI Vector Search index** — there is no shared index to accidentally query
- Firestore uses the path /tenants/{tenantId}/... — a service account for Tenant A literally cannot construct a valid path to Tenant B's data
- Secret Manager uses path-based namespacing
- Cloud Run services receive the tenantId as a **verified, gateway-injected header** — they never trust a tenantId from the request body

### Testing
Our test suite includes "cross-tenant bleed tests": mock requests from Tenant A attempting to access Tenant B's data at every layer, verifying 403 Forbidden at each boundary.

## 2. Encryption

### Data In Transit
- All external communication uses **TLS 1.3 exclusively** — TLS 1.2 is disabled
- All internal GCP service-to-service communication uses Google's internal encrypted network (automatic mTLS via Cloud Run service mesh)

### Data At Rest
- Firestore: AES-256 encryption at rest (GCP default)
- Secret Manager: secrets encrypted with **Cloud KMS customer-managed encryption keys (CMEK)**
- Memorystore (Redis): encrypted at rest and in transit (AUTH enabled, TLS enabled)

### Encryption Key Management
- Platform-level encryption uses Google-managed keys (GMEK)
- Tenant API credentials (tool keys) use **Customer-Managed Encryption Keys (CMEK)** — each tenant can optionally bring their own KMS key

## 3. Authentication and Authorization

### End User to Platform
- End users authenticate via the business-issued API key or JWT
- All tokens have a maximum 24-hour TTL; refresh tokens are rotated on each use

### Business Admin to Dashboard
- Authentication via **Google OAuth 2.0 (via Cloud Identity)** or SAML SSO for enterprise customers
- MFA is enforced for all admin accounts — no exceptions
- Admin sessions are logged to Cloud Audit Logs

### Service-to-Service (Internal)
- All Cloud Run services use **dedicated service accounts** with minimal IAM permissions
- No service uses the default compute service account (which has overly broad permissions)
- Service accounts are **Workload Identity Federation** bound — credentials cannot be exported or used outside the service

## 4. PII Handling

**PII Detection and Scrubbing (in Guardrails Pipeline):**
Before sending any user message to the LLM, the Guardrails Pipeline runs a PII classifier (regex + lightweight NER model) that detects email addresses, phone numbers, credit card numbers, social security numbers, and full names. Detected PII is replaced with a placeholder token before the message reaches the LLM. The original value is stored separately in Firestore (encrypted with CMEK) so the Tool Executor can retrieve it if genuinely needed.

**Data Minimization:**
- Conversation histories retained for 90 days by default, then automatically deleted via Firestore TTL policies
- Vector search indexes only contain knowledge base documents, not conversation history

## 5. Tool Execution Security

**Allowlist-only tool configuration:**
Businesses define exactly which tools their agent can call, with specific allowed HTTP methods and URL patterns. The Tool Executor validates every call against this allowlist — calls to URLs not on the list are blocked unconditionally.

**Network egress restrictions:**
VPC Service Controls block outbound traffic to private IP ranges (preventing SSRF attacks). Only HTTPS (port 443) outbound traffic is allowed.

**Schema validation before execution:**
The LLM's tool call output is validated against the tool's pre-defined JSON schema before execution. If the LLM hallucinates a parameter, the call is rejected and the LLM is asked to retry.

**High-risk action gate:**
Tools marked as "high-risk" require human approval before execution. The Tool Executor publishes the pending call to the Human Approval Queue (Pub/Sub). The call is only executed after explicit admin approval.

## 6. Compliance Posture

| Requirement | How We Address It |
|---|---|
| GDPR Right to Erasure | Per-tenant data deletion pipeline: deletes Firestore docs, removes vector embeddings, purges logs |
| Data Residency | GCP region selection at tenant onboarding; data stays in chosen region |
| Audit Trail | Immutable Cloud Logging + BigQuery; all admin actions are logged |
| Incident Response | Cloud Monitoring alert to PagerDuty to on-call engineer within 15 min |
| Vulnerability Management | Cloud Security Command Center active for all GCP resources |

---

# Section 7 — Cost Estimate

## Assumptions: Pilot Scale

- **10 business tenants** onboarded, each with 1 deployed agent
- Average **500 agent conversations/day** across all tenants = 15,000 conversations/month
- Average conversation: **5 turns**, each turn = ~600 input tokens + ~300 output tokens
- LLM routing split: **65% Gemini Flash, 30% Gemini Pro, 5% cache hits**
- Average **1.5 tool calls per conversation**
- Knowledge base: **5,000 documents per tenant**, ~500 tokens each

## LLM Inference Cost (Largest Cost Driver)

| Category | Volume | Cost |
|---|---|---|
| Cache hits (5%): 3,750 turns | — | $0 |
| Gemini Flash (65%): 48,750 turns | 29.25M input + 14.63M output tokens | $6.58 |
| Gemini Pro (30%): 22,500 turns | 13.5M input + 6.75M output tokens | $118.13 |
| **Total LLM cost** | | **~$124.71/month** |
| Savings from 5% cache hit rate | | ~$6.56/month |

## Full Monthly Cost Summary (Pilot Scale — 10 Tenants)

| Component | Estimated Monthly Cost | Notes |
|---|---|---|
| LLM Inference (Gemini Flash+Pro) | $124.71 | Dominant cost; drops with higher cache hit rate |
| Compute (Cloud Run) | $20.00 | Scales with request volume |
| Redis Semantic Cache | $11.68 | Fixed baseline; saves ~$6.56 in LLM costs |
| Firestore Database | $0.86 | Low at pilot scale |
| Vertex AI Vector Search | $0.16 | Very low at pilot scale |
| Embedding Model | $0.25 | Negligible |
| API Gateway (Apigee) | $0.45 | Near-zero at this scale |
| Cloud Pub/Sub | $0.002 | Negligible |
| Cloud Logging + BigQuery | $0.00 | Within free tier |
| Secret Manager | ~$0.30 | $0.03 per secret version |
| **TOTAL** | **~$158.41/month** | **~$15.84 per tenant per month** |

## Cost Per Conversation

- Cost per tenant: **~$15.84/month**
- Cost per conversation: **~$0.0106**
- Cost per turn: **~$0.0021**

This is competitive: typical LLM API costs alone for a DIY solution at this volume would be $12-15/month per tenant, without any of the orchestration, memory, guardrails, or observability infrastructure.

## Cost Scaling Projections

| Scale | Tenants | Conversations/month | Est. Monthly Cost | Cost/Tenant |
|---|---|---|---|---|
| Pilot | 10 | 15,000 | ~$158 | ~$15.84 |
| Early Growth | 100 | 500,000 | ~$3,200 | ~$32 |
| Scale | 1,000 | 10,000,000 | ~$48,000 | ~$48 |

## Key Cost Control Mechanisms

1. **Semantic Cache**: every cache hit saves ~$0.0017 (Gemini Flash) to $0.085 (Gemini Pro) per turn
2. **Model routing**: routing 65% of traffic to Gemini Flash vs. 100% to Pro saves ~$110/month at pilot scale alone
3. **Per-tenant token quotas**: hard stop prevents any single tenant from generating runaway costs
4. **Conversation history pruning**: only last 10 turns stored in Firestore, reducing context size
5. **Embedding reuse**: knowledge base documents embedded once and reused across all queries

---

# Section 8 — Availability and Resilience

## Resilience Strategy (Priority Order)

1. **Correctness and data durability** (highest priority)
2. **Graceful degradation** (fail visibly and safely, not silently and dangerously)
3. **Rapid recovery** (minimize mean time to recovery)
4. **High availability** (minimize outage duration)

## Component-by-Component Failure Analysis

### Failure: Vertex AI Gemini API is Degraded or Rate-Limited

Our response (cascading fallback):
1. LLM Router detects elevated error rate (more than 5% in 60s) or latency (more than 3s P99) from Gemini
2. Automatically switches to Claude 3.5 Sonnet via Anthropic API for complex queries
3. For simple queries: force-routes to semantic cache with disclaimer ("Based on a similar previous question...")
4. If all LLM APIs are degraded: return graceful "Agent temporarily unavailable" message — **never silently return a stale/wrong answer**
5. LLM Router implements **circuit breaker pattern**: after 10 consecutive failures, stops calling that API for 60 seconds

### Failure: Firestore is Temporarily Unavailable

1. Agent configurations cached in Memorystore (Redis) with 5-minute TTL
2. Conversation history also cached in Redis per session ID with 30-minute TTL
3. New sessions return "starting fresh context" response
4. Write failures queued to Pub/Sub and retried automatically when Firestore recovers

Data durability: Firestore uses multi-region replication. RPO = 0, RTO less than 60 seconds.

### Failure: Memorystore (Redis) is Unavailable

1. LLM Router switches to **cache-bypass mode** — all requests go directly to the LLM
2. Config cache miss: reads agent config directly from Firestore (adds ~10ms latency, no correctness impact)
3. Redis configured in **high-availability mode** with replica — automatic failover within 1-2 seconds

### Failure: Tool Executor's External API Call Times Out

1. All tool calls have a **hard 10-second timeout** — no indefinite hanging
2. On timeout: returns structured error to Orchestration Service
3. Orchestration Service passes error to LLM with correction prompt
4. Timeout and failure logged to the audit trail

### Failure: An Agent Enters a Tool-Calling Loop

1. Hard limit of **10 tool calls per turn**
2. Total tool calls per session: **hard limit of 50 per session**
3. Anomaly detection: if tenant's tool call rate exceeds 3x 7-day moving average for 5+ minutes — alert

### Failure: Cloud Run Service Crashes

1. Cloud Run automatically routes traffic away from crashing instances and starts new ones
2. Health checks: unhealthy containers replaced within 30 seconds
3. If Guardrails Pipeline is down: Orchestration Service applies **fail-safe default** — all requests blocked (fail closed, not fail open) — correct behavior for a safety-critical component

## Backup and Disaster Recovery

| Data | Backup Frequency | Retention | Recovery Method |
|---|---|---|---|
| Firestore (all tenants) | Daily automated export to Cloud Storage | 30 days | Point-in-time restore via import |
| Vector Search indexes | Weekly snapshot export | 4 weeks | Re-import from snapshot |
| Secret Manager | Versioned (every change) | 90 days | Roll back to any previous version |
| Cloud Logging / BigQuery | Continuous streaming | Indefinite | No recovery needed; append-only |
| Redis cache | Not backed up | N/A | Cache is ephemeral; rebuild from Firestore |

## Resilience Summary

| Failure Scenario | Impact | Recovery Mechanism | RTO |
|---|---|---|---|
| LLM API degraded | Higher latency or fallback | Circuit breaker + fallback LLM | Seconds |
| Firestore unavailable | Config from cache, writes queued | Redis cache + Pub/Sub queue | Minutes |
| Redis unavailable | Cache bypass mode | Auto-failover to replica | less than 60s |
| Tool call timeout | Graceful error message | Hard timeout + LLM error prompt | N/A |
| Agent tool loop | Hard turn/session limit | Automatic stop + alert | Immediate |
| Cloud Run service crash | New instances auto-started | Health check + SIGTERM drain | less than 30s |
| Full region failure | Complete outage | Restore from backup to new region | 4h |

---

# Section 9 — Monitoring and Observability

## The Core Observability Challenge

Traditional web services are easy to monitor: did the request succeed? How long did it take? For AI agents, an agent can return a 200 OK response with a perfectly formatted answer that is factually wrong, takes an unintended action, or reveals information the user should not have.

Our observability strategy has two distinct layers:
1. **Infrastructure observability**: is the system up, fast, and error-free? (Standard)
2. **Agent behavior observability**: is the agent making correct, safe, and explainable decisions? (Novel)

## Layer 1: Infrastructure Observability

### Key Metrics (Cloud Monitoring)

| Metric | Alert Threshold | Why It Matters |
|---|---|---|
| Request error rate | more than 5% over 5 min | Systemic failure indicator |
| P99 end-to-end latency | more than 3,000ms | User experience degradation |
| LLM API error rate | more than 3% over 2 min | Triggers fallback logic |
| Tool call success rate | less than 90% over 10 min | External API degradation |
| Cache hit rate | less than 10% sustained | Suggests cache failure |
| Guardrails block rate | more than 20% in 5 min | Possible attack or misconfiguration |
| Cloud Run instance count | more than 150 instances | Unexpected traffic spike |
| Firestore read latency | more than 500ms P99 | Database degradation |
| Redis memory utilization | more than 85% | Cache eviction imminent |
| Pub/Sub queue depth (approval) | more than 100 messages | Human escalation backlog building |

## Layer 2: Agent Behavior Observability

### Decision Traces — The Core Mechanism

Every agent invocation produces a **Decision Trace** — a structured, ordered log of every step the agent took to produce its output. This is stored in Cloud Logging and queryable in BigQuery.

**Example Decision Trace Structure:**
```
Trace ID: tr_8f3a9bc2
Tenant: business_support_co
Session: user_4821_session_92

Step 1 - INPUT_RECEIVED
  scrubbed_message: "I want to cancel my subscription"
  guardrails_input_check: PASS

Step 2 - MEMORY_RETRIEVAL
  top_k_results:
    - chunk_id: doc_faq_45, score: 0.94, text: "To cancel, visit Settings > Billing > Cancel Plan"
    - chunk_id: doc_faq_12, score: 0.87, text: "Cancellations take effect at end of billing period"
    - chunk_id: conv_user_4821_turn_3, score: 0.81, text: "User previously inquired about pausing subscription"

Step 3 - LLM_CALL
  model_used: gemini-flash
  cache_hit: false
  prompt_token_count: 612
  completion_token_count: 148
  tool_call_requested:
    tool: cancel_subscription
    parameters: { user_id: "[SECURE_REF:user_id_4821]", reason: "user_requested" }

Step 4 - GUARDRAILS_OUTPUT_CHECK
  check: schema_validation - PASS
  check: risk_classification - HIGH_RISK
  action: ESCALATE_TO_HUMAN (not AUTO_EXECUTE)

Step 5 - RESPONSE_TO_USER
  response: "I've noted your cancellation request and it has been sent for review."
  total_duration_ms: 892

Step 6 - HUMAN_APPROVAL_PENDING
  admin_notified: true
  expires_at: 2026-09-01T22:14:32Z
```

This trace answers:
- **Why did the agent respond the way it did?** (It retrieved 3 specific memory chunks)
- **What did the agent try to do?** (Call cancel_subscription)
- **Why was it not executed immediately?** (cancel_subscription is classified high-risk)
- **What was the cost?** (760 tokens on Gemini Flash)

### BigQuery SQL Examples for Audit Queries

```sql
-- Debug a specific interaction
SELECT step_details
FROM agent_traces
WHERE trace_id = 'tr_8f3a9bc2'
ORDER BY step_order;

-- Find all conversations where agent was blocked
SELECT trace_id, session_id, timestamp, tool_call_requested
FROM agent_traces
WHERE tenant_id = 'business_support_co'
  AND step_type = 'GUARDRAILS_OUTPUT_CHECK'
  AND action = 'ESCALATE_TO_HUMAN'
  AND timestamp > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY);

-- Which knowledge base documents are most used?
SELECT chunk_id, COUNT(*) as times_retrieved
FROM agent_traces, UNNEST(memory_retrieval_results) as result
WHERE tenant_id = 'business_support_co'
GROUP BY chunk_id
ORDER BY times_retrieved DESC
LIMIT 20;
```

### Anomaly Detection

Cloud Monitoring is configured with metric anomaly alerts:
1. **Token usage anomaly**: if a tenant's hourly token usage is more than 3 standard deviations above their 14-day moving average
2. **Guardrails spike**: if guardrail blocks spike more than 5x normal in 10 minutes
3. **Tool call loop detection**: if any single session triggers more than 20 tool calls in 5 minutes
4. **Latency regression**: if P99 latency increases more than 50% day-over-day

### Observability Summary

For any agent behavior or system event, we can answer:
1. **Did it happen?** (Cloud Logging + Cloud Monitoring alerts)
2. **When and how often?** (BigQuery analytics queries)
3. **Why?** (Decision traces with full prompt, retrieved context, tool call, and guardrail check)
4. **Where in the system did it occur?** (Cloud Trace distributed tracing)
5. **Was it anomalous?** (Metric anomaly detection in Cloud Monitoring)

---

# Section 10 — Conclusion and Future Improvements

## What We Proposed

AgentForge is a multi-tenant AI agent platform built on GCP that allows businesses to deploy production-ready AI agents with memory, tool-calling, safety guardrails, cost controls, and full observability without building any of that infrastructure themselves.

Our proposal focused on three areas in depth:
1. **Safe tool-calling with a 3-layer guardrails pipeline**
2. **Tenant-isolated RAG-based memory**
3. **Per-decision audit trails**

We chose GCP specifically because Vertex AI's native integration with Vector Search, Gemini, and Cloud IAM removes the need to stitch together third-party services — reducing both latency and security surface area.

## Honest Limitations

### 1. LLM Non-Determinism
The same input can produce different outputs on different runs. Our guardrails pipeline reduces the risk of harmful outputs, but does not eliminate the possibility of a subtly wrong or misleading answer that passes all safety checks. Fully solving this requires human review of a sample of interactions, fine-tuned models for high-stakes use cases, and adversarial testing by domain experts.

### 2. Complex Multi-Step Planning
This proposal handles single-turn tool calls and short multi-step sequences well. It is not optimized for agents that need to execute complex, multi-session plans spanning hours or days. These are extensions to the current architecture, not incompatibilities.

### 3. Knowledge Base Freshness
The RAG system retrieves from a vector index with periodic re-indexing (proposed: weekly incremental updates). In fast-changing business contexts, real-time index updates would require a streaming indexing pipeline.

### 4. Agent Configuration UI
The business-facing configuration dashboard is mentioned but not designed in detail.

### 5. Evaluation and Regression Testing Framework
When a business updates their agent's configuration, they need a way to test that the change does not break existing working behaviors.

## Priority Roadmap (What We Would Build Next)

1. **Streaming Response + Multi-Turn Planning**: Full SSE token delivery and persistent task state for complex multi-step plans
2. **Agent Marketplace**: Shared agent configuration templates reducing onboarding from hours to minutes
3. **Fine-Tuning Pipeline**: Domain-specific fine-tuned models that outperform general-purpose models at 10-20x lower cost per token
4. **Real-Time Knowledge Base Updates**: Streaming indexing pipeline via Cloud Pub/Sub updating vector index within seconds
5. **Multi-Region Active-Active**: Dual-region deployment (us-central1 + europe-west1) reducing RTO for regional failures from 4 hours to under 1 minute

## Final Reflection

The most important design decision in this proposal is treating **safety and auditability as foundational, not bolt-on**. Every tool call is validated before execution. Every agent decision is traced. Every guardrail block is logged with context. This means the system's behavior is always explainable, even when the LLM's output is not.

> Autonomous AI creates a new class of enterprise infrastructure problem: organizations need a control plane that makes autonomous agents powerful enough to work, but constrained enough to trust.

---

# Appendix A — Aegis Control Plane: Full Enterprise Architecture Vision

## Project: Aegis Control Plane

> The operating system for autonomous enterprise workers.

Aegis is the broader enterprise AI control plane concept underpinning AgentForge. Where AgentForge is the multi-tenant SaaS product for businesses, Aegis represents the full enterprise-grade architecture — a cloud-native control plane for deploying, governing, monitoring, and recovering autonomous AI agents operating across enterprise systems.

## The Enterprise Problem

Businesses are beginning to deploy AI agents that can research information, modify records, send emails, create transactions, call APIs, delegate tasks, and execute multi-step workflows. The infrastructure problem is:

> How can an enterprise safely operate large numbers of autonomous AI workers across critical business systems without losing control of permissions, data, decisions, cost, accountability, or recovery?

Aegis treats AI agents as **autonomous distributed workloads that require identity, authorization, policy enforcement, runtime isolation, observability, risk management, and incident response**.

## Six Major Architecture Planes

### Plane 1 — Identity Plane
Every agent has an identity comparable to a service account: agent identity, user identity, service identity, credential management, authentication, role/attribute information, delegation credentials, and tenant identity.

### Plane 2 — Execution Plane
Runs autonomous agents and long-running workflows: agent runtime, planner, task executor, workflow engine, event-driven execution, retry handling, state management, agent lifecycle management, model router, and memory access. A workflow can pause for approval and resume later.

### Plane 3 — Knowledge Plane
Provides agents with relevant business knowledge through three layers:
- Short-term memory: current task and conversation
- Episodic memory: important previous interactions
- Knowledge memory: documents, policies, manuals, enterprise data

All retrieval must respect tenant and authorization boundaries.

### Plane 4 — Policy Plane
Controls what agents are permitted to do with policy engine, permission engine, authority manager, risk engine, budget manager, approval engine, data access policy, and action restrictions.

### Plane 5 — Trust and Safety Plane
Prevents unsafe, incorrect, or unexpected autonomous behavior with input validation, output validation, risk scoring, policy enforcement, human approval, action verification, anomaly detection, agent quarantine, credential revocation, incident response, and optional simulation/digital twin.

### Plane 6 — Observability Plane
Provides complete visibility into agent behavior with distributed traces, execution graphs, audit logs, metrics, cost tracking, agent evaluation, incident timelines, replay, alerts, and blast-radius analysis.

## Authority Card

Every agent receives an explicit authority definition:

```yaml
agent: FinanceAgent
identity: agent://tenant-a/finance
allowed_tools:
  - invoice.read
  - supplier.verify
  - payment.create
max_payment: 2500
allowed_data:
  - invoices
  - suppliers
  - finance_policy
max_runtime: 15m
max_delegation_depth: 1
approval_required_above: 2500
risk_limit: medium
```

**Dynamic authority adapts at runtime:**
- Normal state: FinanceAgent may approve up to $2,500
- Suspicious behavior: Limit reduced to $100
- Security incident: READ-ONLY
- Confirmed compromise: CREDENTIALS REVOKED

## Risk-Aware Action Engine

```
Risk Score =
    Action sensitivity
  + Data sensitivity
  + Financial impact
  + User/agent authority
  + Agent confidence
  + Behavioral anomaly
  + Contextual factors
```

| Risk Score | Response |
|---|---|
| Less than 30 | Execute automatically |
| 30-70 | Enhanced verification |
| 70-90 | Human approval |
| More than 90 | Block |

**Example action risk classifications:**
| Action | Risk Level |
|---|---|
| Read CRM | LOW |
| Search documents | LOW |
| Draft email | LOW |
| Update customer record | MEDIUM |
| Create contract | HIGH |
| Send external email | HIGH |
| Issue refund | HIGH |
| Delete records | CRITICAL |
| Large financial transaction | CRITICAL |

## Agent-to-Agent Delegation (Least-Privilege Model)

A SalesAgent delegating to a ResearchAgent must not silently transfer unrestricted authority:

- SalesAgent has: CRM access, create opportunities, draft outreach
- ResearchAgent receives only: public web search, document research
- ResearchAgent must NOT inherit: CRM write access, email sending, financial permissions, contract modification

A delegation token contains: delegating agent, receiving agent, allowed actions, allowed resources, maximum duration, maximum delegation depth, data restrictions, and budget restrictions.

## Behavioral Monitoring

Example normal profile: 20-40 CRM reads/hour, 5-15 email drafts/hour, 0-2 record updates/hour

If observed behavior becomes: 8,000 CRM reads, 2,400 record updates, 900 emails — the system detects a behavioral anomaly and automatically: increases risk score, activates Agent Firewall, reduces authority, suspends agent, and creates an incident.

## Example Incident Response

**Normal behavior:** FinanceAgent processes 50-100 invoices/day

**Attack scenario:** Agent suddenly attempts 5,000 payments in 2 minutes

**Aegis response:**
1. Freeze agent
2. Revoke credentials
3. Stop queued actions
4. Quarantine dependent agents
5. Identify affected resources (blast radius)
6. Create incident
7. Generate explanation
8. Rollback reversible actions

**Blast Radius Visualization:**
```
Compromised Agent
       |
       +-- 3 tools
       +-- 2 databases
       +-- 4 downstream agents
       +-- 182 pending jobs
       +-- 27 affected records
```

## Core Components Summary

```
Aegis Control Plane
|
+-- Tenant Manager
+-- Agent Registry
+-- Identity Manager
+-- Authority Manager
+-- Policy Engine
+-- Risk Engine
+-- Approval Engine
+-- Budget Manager
+-- Agent Runtime
+-- Workflow Engine
+-- Model Router
+-- Memory / RAG
+-- Agent Firewall
+-- Tool Gateway
+-- Delegation Manager
+-- Behavior Monitor
+-- Incident Response
+-- Blast Radius Engine
+-- Audit Log
+-- Distributed Tracing
+-- Replay / Debugging
+-- Agent Evaluation
+-- Operations Dashboard
```

## One-Sentence Pitch

> Aegis is a cloud-native enterprise AI control plane that gives autonomous agents bounded authority to operate business systems while continuously evaluating their risk, behavior, cost, and impact — and automatically preventing, containing, and explaining unsafe actions.

---

# Appendix B — Competition Alignment Matrix

## Scenario 5 Requirements vs. Our Solution

| Scenario 5 Requirement | Our Solution | Depth Level |
|---|---|---|
| LLM inference at scale | Vertex AI Gemini + Model Router (Flash/Pro routing) | High |
| Agent memory/context | Vertex AI Vector Search + RAG (tenant-isolated indexes) | Highest |
| Tool-calling | Tool Executor + 3-layer Guardrails + Tool Gateway + Allowlist | Highest |
| Guardrails | 3-layer pipeline: Input Classifier, Output Validator, Human Escalation | Highest |
| Observability | Decision Traces + BigQuery SQL + Cloud Trace + Anomaly Detection | Highest |
| Cost control | Semantic cache + Model routing + Per-tenant quotas + Token budgets | High |
| Multi-tenant isolation | Structural separation at Firestore, Vector Search, Secret Manager, IAM | Highest |
| Running many businesses simultaneously | Per-tenant rate limits at Apigee + per-tenant token buckets in Redis | High |
| Safety and auditability | Immutable audit trail, human approval queue, fail-closed guardrails | Highest |

## Judging Criteria Self-Assessment

| Judging Area | Our Approach |
|---|---|
| Architecture Clarity | Layered diagram with 5 clear zones, all data flows explicitly labeled |
| Technology Justification | Every service has 3-question justification (what, why for this problem, why not alternative) |
| Safety and Auditability | 3+ concrete mechanisms described in full detail, not just "we use guardrails" |
| Cost Control | Actual dollar estimates with breakdown, 5 concrete cost control mechanisms identified |
| Multi-tenant Isolation | Structural (not policy-only) isolation explained at every layer with cross-tenant bleed testing |
| Observability | Per-decision trace structure shown with example, BigQuery SQL examples provided |
| Resilience | Component-by-component failure analysis with specific RTO targets |
| Depth vs. Breadth | 3 pillars explicitly called out; out-of-scope items explicitly and honestly acknowledged |

---

# Appendix C — Submission Checklist

- [ ] Cover sheet filled in (team name, members, emails, contact numbers)
- [ ] Architecture diagram created in draw.io / Lucidchart / Excalidraw as PNG + PDF
- [ ] All 10 sections written and within 5-page limit
- [ ] Architecture diagram clearly shows tenant isolation boundary
- [ ] Every tech choice has a "why for this problem" justification
- [ ] Guardrails section mentions at least 3 concrete safety mechanisms
- [ ] Cost section has actual dollar estimates with breakdown
- [ ] Resilience section covers what happens when the LLM API fails
- [ ] Observability section explains per-decision traces
- [ ] Security section covers: encryption at rest + in transit, PII handling, access control per-service
- [ ] Conclusion acknowledges honest limitations
- [ ] Problem understanding is written in own words, not copied from statement
- [ ] Optional: prototype repo link (not required but can be included)

---

*This document consolidates the full BOC 2.0 Scenario 5 proposal for AgentForge. All sections, technical justifications, architecture descriptions, cost estimates, security models, and observability designs are included. The Aegis Control Plane appendix provides the broader enterprise architecture vision. Submission deadline: September 6, 11:59 PM.*
