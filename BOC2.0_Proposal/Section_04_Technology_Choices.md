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

## 1. AWS Lambda / Vercel (Serverless Compute) — Core Compute

**What it does:** Runs serverless functions that scale automatically from zero to thousands of instances based on incoming traffic.

**Why for this problem:**
An AI agent platform has inherently unpredictable traffic — one business's agent might be idle for hours, then get hit by a product launch and spike to 500 concurrent requests. Traditional VM-based compute would either waste money sitting idle or fail to scale fast enough. Vercel's serverless Next.js deployment scales to zero when idle (zero cost) and spins up new instances within milliseconds during spikes.

For production microservices, AWS Lambda provides per-function auto-scaling — if we get a wave of tool-heavy requests, only the Tool Executor Lambda needs to scale, not the memory layer.

**Free Tier:** Vercel Hobby plan is completely free for Next.js apps. AWS Lambda: 1M free requests/month + 400,000 GB-seconds compute.

**Considered instead:** Google Cloud Run — rejected due to billing account restrictions encountered during development. AWS ECS/Fargate — viable but adds cluster management overhead not justified at MVP scale.

---

## 2. AWS API Gateway — Entry Point & Tenant Routing

**What it does:** A fully managed API gateway that handles authentication, rate limiting, request routing, and usage metering.

**Why for this problem:**
Multi-tenancy requires every request to be authenticated and attributed to a specific business tenant *before* it reaches any internal service. AWS API Gateway handles this at the perimeter: it validates the tenant's API key, enforces per-tenant rate limits (e.g., max 100 requests/minute for the free tier), and meters usage for billing — all before a single line of business logic runs.

**Free Tier:** AWS API Gateway: 1M HTTP API calls/month free for 12 months.

**Considered instead:** Google Apigee — excellent product but requires GCP billing; AWS API Gateway provides equivalent capabilities with free tier.

---

## 3. Pinecone — Tenant-Isolated Agent Memory (Vector Search)

**What it does:** A managed vector database that stores high-dimensional embeddings and supports fast approximate nearest-neighbor (ANN) similarity search.

**Why for this problem:**
Agent memory in a multi-tenant context is fundamentally a retrieval problem: "given this new message, what past information is most relevant to include in the LLM's context?" Passing the entire conversation history to the LLM on every call is prohibitively expensive.

Vector search solves this: we embed every conversation turn and knowledge base document, store them as vectors, and at query time retrieve only the top-K most semantically relevant ones. Tenant isolation is enforced via Pinecone's metadata filter (`{ tenantId: { $eq: tenantId } }`) — ensuring cross-tenant data leakage is structurally impossible.

**Free Tier:** Pinecone Starter: 1 free index, 2GB storage, 100K vectors — sufficient for the entire competition MVP.

**Considered instead:** Vertex AI Vector Search — requires GCP billing; Pinecone provides identical capability with a genuine free tier. PostgreSQL with pgvector — viable but requires significant ops work.

---

## 4. Google AI Studio (text-embedding-004) — Context Vectorization

**What it does:** Converts text (queries, conversation turns, documents) into 768-dimensional numerical vectors that capture semantic meaning.

**Why for this problem:**
For RAG to work, the embedding model must be the same one used both when documents are indexed and when queries are made. Google AI Studio's `text-embedding-004` model:
- 768 dimensions matching Pinecone index configuration
- Completely free via Gemini API key
- High quality embeddings competitive with paid alternatives

**Free Tier:** Google AI Studio: 1,500 requests/day free — sufficient for the entire demo and pilot.

---

## 5. AWS Bedrock (Claude 3 Haiku / Sonnet) — Primary LLM (Production)

**What it does:** Provides large language model inference for agent reasoning, response generation, and tool-call decision-making.

**Why for this problem:**
AWS Bedrock provides access to Anthropic's Claude models (industry-leading for tool-calling and instruction-following) without managing model infrastructure. Claude 3 Haiku is used for simple queries (fast, cheap), Sonnet for complex multi-step reasoning.

**Model routing strategy:**
- Claude 3 Haiku: ~$0.25/1M input tokens — used for >60% of requests
- Claude 3.5 Sonnet: ~$3/1M input tokens — used for complex reasoning only
- Google Gemini (AI Studio key): completely free — used in local dev and as fallback

**Free Tier:** No free tier for Bedrock inference, but costs are pay-per-use. For MVP demo: ~$0.001 per conversation with Haiku.

**Considered instead:** Vertex AI Gemini — identical capability but requires GCP billing account which was unavailable. OpenAI GPT-4o — excellent quality but no AWS-native integration.

---

## 6. AWS ElastiCache (Redis) — Semantic Response Cache

**What it does:** A managed in-memory key-value store used for caching LLM responses to semantically similar queries.

**Why for this problem:**
A significant portion of queries to a business support agent are semantically identical. Semantic caching:
1. Embeds the incoming query
2. Checks if any stored embedding is within cosine similarity threshold (>0.92)
3. Returns cached response — 0 tokens consumed, <5ms vs 800ms for real LLM call

Estimated cache hit rate: 25–40% of queries, directly reducing LLM costs.

**Free Tier:** AWS ElastiCache: No permanent free tier. For MVP: use a simple in-memory Node.js Map as a mock cache; upgrade to ElastiCache for production.

---

## 7. Firebase Firestore — Conversational State & Agent Configuration

**What it does:** A NoSQL document database with real-time sync capabilities, used for storing agent configurations and conversation histories.

**Why for this problem:**
Agent configuration data (system prompt, allowed tools, guardrail rules, model preferences) has a flexible, nested schema that varies significantly between tenants. Firestore's document model accommodates this naturally.

**Free Tier:** Firebase Spark plan: 50K reads/day, 20K writes/day — more than sufficient for the demo and pilot.

**Already configured** in this project and actively working.

---

## 8. AWS SSM Parameter Store — Tool Credentials per Tenant

**What it does:** A managed secrets store that stores, versions, and serves sensitive credentials with fine-grained IAM controls.

**Why for this problem:**
Each business tenant configures their agent to call their own external APIs (CRM, helpdesk). These API keys are highly sensitive. SSM Parameter Store stores each credential at a path namespaced by tenant: `/agentforge/{tenantId}/tools/{toolName}/apiKey`.

**Free Tier:** AWS SSM Standard Parameters: completely FREE, no limit.

**Considered instead:** Google Secret Manager — requires GCP billing; AWS SSM is free and provides identical capability.

---

## 9. AWS SQS — Human Escalation Queue & Async Decoupling

**What it does:** A managed message queue that decouples producers (Guardrails Pipeline) from consumers (Admin Dashboard, human reviewers).

**Why for this problem:**
When the Guardrails Pipeline identifies a high-risk action (e.g., agent wants to issue a refund above threshold), we cannot block and wait for human approval synchronously — this would hold the user's connection open indefinitely. Instead, the Guardrails Pipeline publishes the pending action to an SQS queue, immediately responds to the user, and the admin receives a notification.

SQS also decouples audit log writing from the critical path — preventing any slowdown in the audit layer from impacting user-facing response latency.

**Free Tier:** AWS SQS: 1M requests/month FREE forever.

**Considered instead:** Google Cloud Pub/Sub — requires GCP billing beyond free basics; SQS provides identical fan-out capability with a genuine free tier.

---

## 10. AWS CloudWatch + AWS DynamoDB — Immutable Audit Trail

**What CloudWatch does:** Captures structured logs from all services in real time with per-tenant log streams.

**What DynamoDB does:** Stores every agent decision trace as a queryable document — trace_id, tenant_id, model used, tokens consumed, PII detected, escalation status.

**Why for this problem:**
The problem statement explicitly requires the ability to explain "why an agent made a given decision." DynamoDB allows efficient queries: "show all decisions for tenant X in the last 7 days" using a Global Secondary Index on tenant_id + timestamp.

**Free Tier:**
- CloudWatch: 5GB log ingestion/month + 5GB storage FREE
- DynamoDB: 25GB storage + 25 WCU + 25 RCU FREE forever (no billing required!)

**Considered instead:** Google BigQuery + Cloud Logging — requires GCP billing; AWS CloudWatch + DynamoDB provide equivalent capability entirely within the free tier.

---

## Summary Table

| Component           | AWS / Free Service          | Primary Reason for Choice              |
|---------------------|-----------------------------|----------------------------------------|
| API Entry & Auth    | AWS API Gateway             | Multi-tenant rate limiting + metering  |
| Compute             | Vercel / AWS Lambda         | Zero-cost serverless scaling           |
| LLM Inference       | AWS Bedrock (Claude 3)      | Best tool-calling, pay-per-use         |
| LLM (Dev/Free)      | Google AI Studio (Gemini)   | Completely free for local dev          |
| Agent Memory        | Pinecone Vector DB          | Free starter tier, tenant metadata filter |
| Embedding           | Gemini text-embedding-004   | Free via AI Studio key                 |
| Response Cache      | In-memory / ElastiCache     | Semantic cache → 25–40% LLM cost saving |
| State & Config      | Firebase Firestore          | Free tier, flexible schema             |
| Tool Credentials    | AWS SSM Parameter Store     | Free, tenant-namespaced               |
| Async Queues        | AWS SQS                     | 1M free requests/month forever        |
| Audit Trail         | AWS DynamoDB                | 25GB free forever, fast queries       |
| Structured Logging  | AWS CloudWatch              | 5GB free/month, per-tenant streams    |
| Monitoring          | AWS CloudWatch Dashboards   | Built-in with CloudWatch logs         |
