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

## 1. GCP Cloud Run — Core Compute

**What it does:** Runs fully managed serverless containers that scale automatically from zero to hundreds of instances based on incoming traffic, with per-request billing.

**Why for this problem:**
An AI agent platform has inherently unpredictable traffic — one business's agent might be idle for hours, then spike to 500 concurrent requests during a product launch. Cloud Run is our chosen compute layer because it runs the actual Next.js 15 App Router application in production. It scales to zero when idle (zero cost) and spins up new container instances in under two seconds during spikes.

Cloud Run was selected over Lambda because the Next.js App Router requires a persistent Node.js runtime — Lambda's execution model does not naturally support long-lived streaming SSE connections used in our demo chat interface.

**Free Tier:** Cloud Run: 2M requests/month + 360,000 GB-seconds compute FREE forever.

**Considered instead:** Vercel — excellent DX but limited control over runtime and environment variables in multi-tenant scenarios. AWS ECS/Fargate — adds cluster management overhead not justified at MVP scale.

---

## 2. Amazon API Gateway — Entry Point & Tenant Routing

**What it does:** A fully managed API gateway that handles authentication, rate limiting, request routing, and usage metering at the network perimeter.

**Why for this problem:**
Multi-tenancy requires every request to be authenticated and attributed to a specific business tenant *before* it reaches any internal service. Amazon API Gateway handles this at the perimeter: it validates the tenant's API key, enforces per-tenant rate limits (e.g., max 100 requests/minute for the free tier), and meters usage for billing — all before a single line of business logic runs.

AWS API Gateway was chosen because all our asynchronous infrastructure (SQS queues, DynamoDB audit trail, CloudWatch logging) already runs on AWS. Using Amazon API Gateway creates a unified AWS perimeter for the async/storage layer while keeping GCP Cloud Run for compute — the correct separation of concerns for a hybrid cloud architecture.

**Free Tier:** AWS API Gateway: 1M HTTP API calls/month free for 12 months.

**Considered instead:** Google Apigee — excellent product but priced for large enterprises; overkill for our scale and adds GCP-only lock-in to a system that intentionally leverages best-of-breed services across clouds.

---

## 3. Pinecone — Tenant-Isolated Agent Memory (Vector Search)

**What it does:** A managed vector database that stores high-dimensional embeddings and supports fast approximate nearest-neighbor (ANN) similarity search.

**Why for this problem:**
Agent memory in a multi-tenant context is fundamentally a retrieval problem: "given this new message, what past information is most relevant to include in the LLM's context?" Passing the entire conversation history to the LLM on every call is prohibitively expensive.

Vector search solves this: we embed every conversation turn and knowledge base document, store them as vectors, and at query time retrieve only the top-K most semantically relevant ones. Tenant isolation is enforced via Pinecone's namespace system — each tenant gets their own dedicated namespace with a per-tenant SHA-256 hashed prefix, ensuring cross-tenant data leakage is structurally impossible even within the same Pinecone index.

**Free Tier:** Pinecone Starter: 1 free index, 2GB storage, 100K vectors — sufficient for the entire competition MVP.

**Considered instead:** Vertex AI Vector Search — requires GCP billing at production scale; Pinecone provides identical capability with a genuine free tier and simpler namespace-based tenant isolation. PostgreSQL with pgvector — viable but requires significant ops work.

---

## 4. Google AI Studio (text-embedding-004) — Context Vectorization

**What it does:** Converts text (queries, conversation turns, documents) into 768-dimensional numerical vectors that capture semantic meaning.

**Why for this problem:**
For RAG to work, the embedding model must be the same one used both when documents are indexed and when queries are made. Google AI Studio's `text-embedding-004` model:
- 768 dimensions matching our Pinecone index configuration
- Completely free via Gemini API key
- High quality embeddings competitive with paid alternatives

**Free Tier:** Google AI Studio: 1,500 requests/day free — sufficient for the entire demo and pilot.

---

## 5. Gemini 3.5 Flash / 3.6 Flash — Primary LLM (Production)

**What it does:** Provides large language model inference for agent reasoning, response generation, and tool-call decision-making.

**Why for this problem:**
Gemini 3.5 Flash is our primary production model — it provides best-in-class tool-calling performance with sub-500ms P50 latency at our request volumes. The Gemini family is uniquely suited to this system because it is the same provider as our embedding model (text-embedding-004), simplifying API key management and ensuring semantic consistency across the pipeline.

**Model routing strategy (3-tier fallback chain):**
- **Gemini 3.5 Flash** (primary): ~$0.075/1M input tokens — used for >80% of requests. Best latency/cost ratio.
- **Gemini 3.6 Flash** (secondary fallback): triggered when 3.5 Flash error rate exceeds 5% or P99 latency exceeds 1,200ms
- **Gemini 3.5 Flash Lite** (tertiary fallback): ultra-lightweight, used for graceful degradation mode — simple queries only
- **Semantic cache hit**: completely free — no LLM call — used for ~25% of queries

**For local development/demo: $0** — uses free Google AI Studio key (15 requests/minute free forever).

**Considered instead:** AWS Bedrock (Claude) — excellent tool-calling but introduces a third cloud vendor dependency. Since our compute (Cloud Run) and embedding (Google AI Studio) already use Google infrastructure, using Gemini consolidates our primary compute and AI spend with one vendor while AWS handles async infrastructure.

---

## 6. Firebase Firestore — Conversational State & Agent Configuration

**What it does:** A NoSQL document database with real-time sync capabilities, used for storing agent configurations, conversation histories, and escalation state.

**Why for this problem:**
Agent configuration data (system prompt, allowed tools, guardrail rules, model preferences, refund limit thresholds) has a flexible, nested schema that varies significantly between tenants. Firestore's document model accommodates this naturally.

Firestore also serves as our **escalation state store** — when the L3 guardrail triggers a human review event, the pending escalation is written to the `escalations` Firestore collection where the `/escalation` admin dashboard reads it in real time.

**Free Tier:** Firebase Spark plan: 50K reads/day, 20K writes/day — more than sufficient for the demo and pilot.

**Already configured** in this project and actively working.

---

## 7. AWS SSM Parameter Store — Tool Credentials per Tenant

**What it does:** A managed secrets store that stores, versions, and serves sensitive credentials with fine-grained IAM controls.

**Why for this problem:**
Each business tenant configures their agent to call their own external APIs (CRM, helpdesk). These API keys are highly sensitive. SSM Parameter Store stores each credential at a path namespaced by tenant: `/agentforge/{tenantId}/tools/{toolName}/apiKey`.

**Free Tier:** AWS SSM Standard Parameters: completely FREE, no limit.

**Considered instead:** Google Secret Manager — requires GCP billing at production scale; AWS SSM is free and integrates natively with our AWS SQS/DynamoDB infrastructure.

---

## 8. AWS SQS — Human Escalation Queue & Async Decoupling

**What it does:** A managed message queue that decouples producers (Guardrails Pipeline) from consumers (Admin Dashboard, human reviewers).

**Why for this problem:**
When the Guardrails Pipeline identifies a high-risk action (e.g., agent wants to issue a refund above the configured `$500` threshold), we cannot block and wait for human approval synchronously — this would hold the user's connection open indefinitely. Instead, the Guardrails Pipeline publishes the pending action to an SQS queue, immediately responds to the user with a "Sent for review" message, and the admin receives a notification.

SQS also decouples audit log writing from the critical path — preventing any slowdown in the audit layer from impacting user-facing response latency.

**Free Tier:** AWS SQS: 1M requests/month FREE forever.

**Considered instead:** Google Cloud Pub/Sub — requires GCP billing at production scale; SQS provides identical fan-out capability with a genuine free tier and integrates with our DynamoDB/CloudWatch AWS infrastructure.

---

## 9. AWS CloudWatch + AWS DynamoDB — Immutable Audit Trail

**What CloudWatch does:** Captures structured logs from all services in real time with per-tenant log streams.

**What DynamoDB does:** Stores every agent decision trace as a queryable document — `trace_id`, `tenant_id`, model used, tokens consumed, PII detected, guardrail outcome, escalation status.

**Why for this problem:**
The problem statement explicitly requires the ability to explain "why an agent made a given decision." DynamoDB allows efficient queries: "show all decisions for tenant X in the last 7 days" using a Global Secondary Index on `tenant_id + timestamp`. The `/replay` page in our platform reads from this audit trail to power the Execution Replay & Drift Analyzer.

**Free Tier:**
- CloudWatch: 5GB log ingestion/month + 5GB storage FREE
- DynamoDB: 25GB storage + 25 WCU + 25 RCU FREE forever (no billing required!)

**Considered instead:** Google BigQuery + Cloud Logging — BigQuery requires GCP billing; AWS CloudWatch + DynamoDB provide equivalent capability entirely within the free tier and integrate natively with SQS.

---

## Summary Table

| Component           | Technology                        | Primary Reason for Choice                       |
|---------------------|-----------------------------------|-------------------------------------------------|
| Core Compute        | GCP Cloud Run                     | Native Next.js App Router support, 2M free reqs |
| API Entry & Auth    | Amazon API Gateway                | Multi-tenant rate limiting + AWS ecosystem fit  |
| LLM Inference       | Gemini 3.5 Flash (primary)        | Best latency/cost, tool-calling, free dev tier  |
| LLM Fallback        | Gemini 3.6 Flash → 3.5 Flash Lite | Cascading circuit-breaker failover chain        |
| Agent Memory (RAG)  | Pinecone Vector DB                | Free starter, per-namespace tenant isolation    |
| Embedding           | Gemini text-embedding-004         | Free via AI Studio, 768-dim Pinecone compatible |
| State & Config      | Firebase Firestore                | Free tier, flexible schema, real-time sync      |
| Escalation State    | Firebase Firestore `escalations`  | Real-time reads by admin dashboard              |
| Tool Credentials    | AWS SSM Parameter Store           | Free, tenant-namespaced paths                   |
| Async Escalation    | AWS SQS                           | 1M free requests/month forever                  |
| Audit Trail         | AWS DynamoDB                      | 25GB free forever, GSI queries by tenant        |
| Structured Logging  | AWS CloudWatch                    | 5GB free/month, per-tenant log streams          |
| Monitoring          | AWS CloudWatch Dashboards         | Built-in with CloudWatch logs, cost-free        |
