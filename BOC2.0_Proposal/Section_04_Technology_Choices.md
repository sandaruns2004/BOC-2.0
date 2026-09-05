# Section 4 — Technology Choices & Justification

## Team: [Your Team Name]
## Scenario: 5 — AI Agent Platform for Business Automation

---

## Guiding Principle

Every technology choice below answers three questions:
1. What does it do?
2. Why does THIS problem specifically need it?
3. What did we consider instead, and why did we not choose it?

---

## 1. Cloud Run (Serverless Containers) — Core Compute

**What it does:** Runs containerized services that scale automatically from zero to thousands of instances based on incoming traffic.

**Why for this problem:**
An AI agent platform has inherently unpredictable traffic — one business's agent might be idle for hours, then get hit by a product launch and spike to 500 concurrent requests. Traditional VM-based compute would either waste money sitting idle or fail to scale fast enough. Cloud Run scales to zero when idle (zero cost) and spins up new instances within seconds during spikes.

More critically: each service in our architecture (Orchestration, Memory, LLM Router, Guardrails, Tool Executor) needs to scale *independently*. If we get a wave of tool-heavy requests, only the Tool Executor needs to scale — not the memory layer. Cloud Run's per-service auto-scaling makes this possible without manual intervention.

**Considered instead:** Cloud Functions — rejected because our services have stateful connection patterns (Redis, Firestore) and longer request lifecycles (multi-step agent reasoning can take 5–30 seconds), which Cloud Functions handle poorly. GKE — rejected because it requires cluster management overhead that adds operational complexity without meaningful benefit at our expected scale.

---

## 2. Apigee API Gateway — Entry Point & Tenant Routing

**What it does:** A fully managed API gateway that handles authentication, rate limiting, request routing, and usage metering.

**Why for this problem:**
Multi-tenancy requires every request to be authenticated and attributed to a specific business tenant *before* it reaches any internal service. Doing this in application code across multiple services is error-prone and duplicative. Apigee handles this at the perimeter: it validates the tenant's API key, injects a tenant context header, enforces per-tenant rate limits (e.g., max 100 requests/minute for the free tier), and meters usage for billing — all before a single line of business logic runs.

This is critical for the problem's multi-tenant isolation requirement: if we didn't enforce tenant limits at the gateway, a single misbehaving tenant could spike LLM usage and degrade service for all others.

**Considered instead:** Cloud Endpoints — simpler but lacks Apigee's per-tenant policy management and built-in monetization/metering features. NGINX Ingress — rejected because it would require manual policy management and doesn't integrate with GCP's IAM and billing systems.

---

## 3. Vertex AI Vector Search — Tenant-Isolated Agent Memory

**What it does:** A managed vector database that stores high-dimensional embeddings and supports fast approximate nearest-neighbor (ANN) similarity search.

**Why for this problem:**
Agent memory in a multi-tenant context is fundamentally a retrieval problem: "given this new message, what past information is most relevant to include in the LLM's context?" Passing the entire conversation history to the LLM on every call is prohibitively expensive (large prompts = high token cost = high latency) and hits context window limits.

Vector search solves this: we embed every conversation turn and knowledge base document, store them as vectors, and at query time retrieve only the top-K most semantically relevant ones. Each tenant gets a separate vector index — their embeddings are physically separated from other tenants', making cross-tenant data leakage structurally impossible, not just policy-enforced.

**Considered instead:** Pinecone — excellent product, but requires a separate API integration and data residency is outside GCP, complicating compliance. PostgreSQL with pgvector — viable for small scale but not managed at our target throughput; would require significant ops work. In-memory search — fails immediately at scale with multiple tenants and large knowledge bases.

---

## 4. Vertex AI Embedding Models (text-embedding-004) — Context Vectorization

**What it does:** Converts text (queries, conversation turns, documents) into fixed-size numerical vectors that capture semantic meaning.

**Why for this problem:**
For RAG to work, the embedding model must be the same one used both when documents are indexed and when queries are made (otherwise the vector spaces don't align). Using a GCP-native embedding model means:
- No external API dependency for a latency-critical path
- Consistent embedding dimensions with Vector Search configuration
- Low latency (co-located within GCP network)
- Cost: ~$0.000025/1K tokens — negligible relative to LLM costs

**Considered instead:** OpenAI text-embedding-3-small — good quality, but adds an external API dependency in a latency-sensitive path. Self-hosted embedding model — would require GPU compute, adding cost and ops overhead without meaningful quality gain for our use case.

---

## 5. Gemini API via Vertex AI — Primary LLM

**What it does:** Provides large language model inference for agent reasoning, response generation, and tool-call decision-making.

**Why for this problem:**
We need an LLM that supports structured output (for reliable tool-call JSON generation) and has a range of model sizes (Gemini Flash for cheap/simple tasks, Gemini 1.5 Pro for complex reasoning). Using Gemini via Vertex AI means:
- No external API calls (LLM inference stays within GCP network — faster, more secure)
- Native IAM-based access control (no API key management for LLM calls)
- Automatic request logging through GCP Audit Logs
- Supports function-calling natively — the LLM can produce structured JSON tool call requests that our Tool Executor can validate and execute

**Model selection strategy (cost critical):**
- Gemini Flash: $0.075/1M input tokens, $0.30/1M output tokens — used for >60% of requests
- Gemini 1.5 Pro: $3.50/1M input tokens, $10.50/1M output tokens — used for complex multi-step tasks only
- Claude 3.5 Sonnet (via API): used as fallback if Gemini API is degraded

**Considered instead:** OpenAI GPT-4o — excellent quality but requires external API, no native GCP integration, higher latency across the network boundary. Self-hosted Llama-3 — would require expensive GPU instances (A100s), complex deployment, and ongoing maintenance; cost-effective only at very high volume.

---

## 6. Memorystore for Redis — Semantic Response Cache

**What it does:** A managed in-memory key-value store used for caching LLM responses to semantically similar queries.

**Why for this problem:**
A significant portion of queries to a business support agent are semantically identical ("What are your business hours?" "When are you open?" "Are you open on weekends?"). Without caching, each of these would trigger a separate, costly LLM call. Semantic caching works by:
1. Embedding the incoming query
2. Checking if any stored embedding is within a cosine similarity threshold (e.g., >0.92)
3. If yes, return the cached response immediately — 0 tokens consumed, <5ms latency vs. 800ms for a real LLM call

Estimated cache hit rate for a customer support agent: 25–40% of queries. This directly translates to 25–40% reduction in LLM inference costs.

**Considered instead:** Cloud Memcache — simpler but lacks the data structure flexibility needed for embedding-based lookups. Application-layer cache — rejected because it would not persist across Cloud Run instance restarts and would not be shared across the fleet.

---

## 7. Firestore — Conversational State & Agent Configuration

**What it does:** A NoSQL document database with real-time sync capabilities, used for storing agent configurations and conversation histories.

**Why for this problem:**
Agent configuration data (system prompt, allowed tools, guardrail rules, model preferences) has a flexible, nested schema that varies significantly between tenants. A relational schema would require constant migrations as we add new agent capabilities. Firestore's document model accommodates this naturally.

For conversation history, we need per-user sub-collections that can be queried efficiently by session ID without complex joins. Firestore's collection-document hierarchy maps directly to this (tenants/{tenantId}/conversations/{sessionId}/messages).

**Considered instead:** Cloud Spanner — strong consistency is unnecessary for agent config data and adds significant cost. Cloud SQL (PostgreSQL) — viable but requires connection pool management and schema migrations for flexible agent config; overhead not justified for this use case.

---

## 8. Secret Manager — Tool Credentials per Tenant

**What it does:** A managed secrets store that stores, versions, and serves sensitive credentials (API keys, OAuth tokens) with fine-grained IAM controls.

**Why for this problem:**
Each business tenant configures their agent to call their own external APIs (their CRM, their helpdesk system). These API keys are highly sensitive — a leak would let anyone impersonate that business's system. Storing them in Firestore (even encrypted) is insufficient because application code handling the decryption becomes a single point of compromise.

Secret Manager stores each credential at a path namespaced by tenant: `/tenants/{tenantId}/tools/{toolName}/apiKey`. The Tool Executor service account has IAM permission to read only the secrets in its current tenant's namespace — structurally preventing cross-tenant credential access.

**Considered instead:** Environment variables in Cloud Run — terrible choice: credentials would be visible in deployment configs and logs. Encrypted fields in Firestore — better, but requires the application to manage encryption keys, which Secret Manager handles automatically with Cloud KMS integration.

---

## 9. Cloud Pub/Sub — Human Escalation Queue & Async Decoupling

**What it does:** A managed message queue that decouples producers (Guardrails Pipeline) from consumers (Admin Dashboard, human reviewers).

**Why for this problem:**
When the Guardrails Pipeline identifies a high-risk action (e.g., agent wants to issue a refund above a threshold), we cannot simply block and wait for human approval synchronously — this would hold the user's connection open indefinitely. Instead, the Guardrails Pipeline publishes the pending action to a Pub/Sub topic, immediately responds to the user ("This action requires approval and will be completed shortly"), and the admin receives a notification to review.

Pub/Sub also decouples audit log writing from the critical path — the Orchestration Service publishes trace events to a log topic asynchronously, preventing any slowdown in the audit layer from impacting user-facing response latency.

**Considered instead:** Cloud Tasks — better for delayed/scheduled single-target delivery, but Pub/Sub's fan-out capability is needed (one event → notifies both the admin dashboard AND the email notification service simultaneously). Redis Streams — viable but requires more operational management than the fully managed Pub/Sub.

---

## 10. Cloud Logging + BigQuery — Immutable Audit Trail

**What it does:** Cloud Logging captures structured logs from all services in real time. A Log Sink exports them to BigQuery for long-term storage and analytical queries.

**Why for this problem:**
The problem statement explicitly requires the ability to explain "why an agent made a given decision" — not just that it made one. This requires storing not just the final output, but every intermediate step: what context was retrieved from memory, what prompt was sent to the LLM, what tool call the LLM requested, what the tool returned, and what the final response was.

Cloud Logging captures this at sub-second granularity with structured JSON fields. BigQuery allows arbitrary SQL queries across months of agent decision history — for debugging, compliance audits, and agent behavior analysis. The Log Sink is configured with a deletion lock on the BigQuery dataset, making the audit trail tamper-evident.

**Considered instead:** Cloud Storage (raw log files) — queryable but requires external tooling for structured queries. Elasticsearch — powerful but operationally expensive and not native to GCP; Cloud Logging + BigQuery provides 90% of the capability at a fraction of the ops cost.

---

## 11. Cloud Trace — Distributed Request Tracing

**What it does:** Captures the full execution path of each request across all microservices, with timing information for each hop.

**Why for this problem:**
An agent invocation touches 5–7 services (Apigee → Orchestration → Memory → LLM Router → Guardrails → Tool Executor → Audit). When a request is slow or fails, identifying which service caused the issue without distributed tracing requires guesswork. Cloud Trace propagates a trace ID across all services automatically, providing a single view of the entire request lifecycle with per-service latency breakdowns.

This directly supports the observability requirement: a platform operator can select any failed agent request and see exactly where it spent its time and where it failed.

---

## Summary Table

| Component           | GCP Service             | Primary Reason for Choice         |
|---------------------|-------------------------|------------------------------------|
| API Entry & Auth    | Apigee                  | Multi-tenant rate limiting + metering |
| Compute             | Cloud Run               | Independent auto-scaling per service |
| LLM Inference       | Vertex AI (Gemini)      | Native, no external API, IAM-controlled |
| Agent Memory        | Vertex AI Vector Search | Tenant-isolated embeddings at scale |
| Embedding           | Vertex AI text-embedding | Co-located, consistent vector space |
| Response Cache      | Memorystore (Redis)     | Semantic cache → 25–40% cost saving |
| State & Config      | Firestore               | Flexible schema, per-tenant collections |
| Tool Credentials    | Secret Manager          | Tenant-namespaced secrets, IAM-enforced |
| Async Queues        | Cloud Pub/Sub           | Decoupled escalation + audit logging |
| Audit Trail         | Cloud Logging + BigQuery | Immutable, queryable decision history |
| Distributed Tracing | Cloud Trace             | Per-request cross-service visibility |
| Monitoring          | Cloud Monitoring        | Dashboards + alerting for all tenants |
