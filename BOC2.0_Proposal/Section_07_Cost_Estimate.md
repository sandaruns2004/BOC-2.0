# Section 7 — Cost Estimate

## Team: [Your Team Name]
## Scenario: 5 — AI Agent Platform for Business Automation

---

## Assumptions: Pilot Scale

We estimate costs for a pilot deployment with the following assumptions:
- **10 business tenants** onboarded
- Each tenant has **1 deployed agent**
- Average **500 agent conversations/day** across all tenants = 15,000 conversations/month
- Average conversation: **5 turns**, each turn = ~600 input tokens + ~300 output tokens
- LLM routing split: **65% Gemini Flash, 30% Gemini Pro, 5% cache hits** (no LLM call)
- Average **1.5 tool calls per conversation**
- Knowledge base: **5,000 documents per tenant**, ~500 tokens each = 2.5M tokens per tenant indexed as vectors

---

## LLM Inference Cost (Largest Cost Driver)

**Monthly volume:**
- Conversations: 15,000/month × 5 turns = 75,000 turns
- Cache hits (5%): 3,750 turns → $0 LLM cost
- Gemini Flash turns (65%): 48,750 turns
  - Input tokens per turn: 600 (message + retrieved context) × 48,750 = 29.25M tokens
  - Output tokens per turn: 300 × 48,750 = 14.63M tokens
  - Cost: 29.25M × $0.000075/1K + 14.63M × $0.00030/1K = **$2.19 + $4.39 = $6.58**
- Gemini Pro turns (30%): 22,500 turns
  - Input tokens: 600 × 22,500 = 13.5M tokens
  - Output tokens: 300 × 22,500 = 6.75M tokens
  - Cost: 13.5M × $0.0035/1K + 6.75M × $0.0105/1K = **$47.25 + $70.88 = $118.13**
- **Total LLM cost: ~$124.71/month**
- **Savings from 5% cache hit rate: ~$6.56/month** (would have cost ~$131 without cache)

---

## Embedding Cost (Vector Search)

- Embedding model: text-embedding-004 at $0.000025/1K tokens
- Per-turn embedding (query): 75,000 turns × 100 tokens (query embedding) = 7.5M tokens/month
- Knowledge base indexing (one-time + updates): 10 tenants × 2.5M tokens = 25M tokens (one-time)
- Monthly re-indexing (10% of docs updated): 2.5M tokens/month

| Item                          | Tokens         | Cost           |
|-------------------------------|---------------|----------------|
| Query embeddings (monthly)    | 7.5M           | $0.19          |
| Knowledge base re-indexing    | 2.5M           | $0.06          |
| **Embedding total**           |               | **~$0.25/month** |

---

## Compute Cost (Cloud Run)

Cloud Run charges per vCPU-second and per GB-second of memory consumed during request processing.

| Service                 | Instances (avg) | vCPU × Memory    | Req duration | Monthly cost est. |
|-------------------------|-----------------|------------------|--------------|-------------------|
| Agent Orchestration     | 2–5             | 1 vCPU × 512MB   | ~1s avg      | ~$8               |
| Memory Layer            | 1–3             | 0.5 vCPU × 256MB | ~0.2s        | ~$2               |
| LLM Router              | 1–3             | 0.5 vCPU × 256MB | ~0.8s        | ~$4               |
| Guardrails Pipeline     | 1–3             | 1 vCPU × 512MB   | ~0.05s       | ~$2               |
| Tool Executor           | 0–5 (bursty)    | 0.5 vCPU × 256MB | ~0.5s        | ~$3               |
| Admin Dashboard Backend | 1–2             | 0.5 vCPU × 256MB | ~0.1s        | ~$1               |
| **Total Compute**       |                 |                  |              | **~$20/month**    |

*Cloud Run scales to 0 outside business hours — actual costs will be lower than theoretical maximum.*

---

## Database Cost (Firestore)

Firestore pricing: $0.06/100K document reads, $0.18/100K document writes, $0.06/GB/month storage

| Operation                        | Volume/month    | Cost    |
|----------------------------------|-----------------|---------|
| Agent config reads               | 75,000 reads    | $0.05   |
| Conversation history reads       | 150,000 reads   | $0.09   |
| Conversation history writes      | 375,000 writes  | $0.68   |
| Tool approval queue read/write   | 10,000 ops      | $0.01   |
| Storage (10 tenants × 50MB avg)  | 0.5 GB          | $0.03   |
| **Firestore total**              |                 | **~$0.86/month** |

---

## Vector Search Cost (Vertex AI Vector Search)

Vertex AI Vector Search pricing: $0.25/million vectors/month (storage) + query charges

| Item                                    | Volume              | Cost          |
|-----------------------------------------|--------------------:|---------------|
| Vector storage (10 tenants × 5K docs × 768 dims) | 50K vectors | ~$0.01/month |
| Query volume (75,000 queries/month)     | 75K queries         | ~$0.15        |
| **Vector Search total**                 |                     | **~$0.16/month** |

---

## API Gateway Cost (Apigee)

Apigee charges per API call processed.
- Estimated calls: 75,000 conversations × 2 calls (in + out) = 150,000 API calls/month
- Cost: ~$0.003/call at entry tier = **~$0.45/month** (well within free tier limits at this scale)

---

## Messaging & Queue Cost (Cloud Pub/Sub)

Pub/Sub pricing: $0.04/GB of message data
- Audit log events: 75,000 turns × ~500 bytes/event = 37.5MB/month = **~$0.002/month**
- Human escalation events: estimated 150 high-risk actions/month × 1KB = 0.15MB = **~$0.00001/month**
- **Pub/Sub total: ~$0.002/month**

---

## Redis Cache Cost (Memorystore)

Memorystore basic tier: $0.016/GB-hour
- Cache size needed for pilot: 1GB (stores ~100K embeddings + cached responses)
- Monthly: 1 GB × 730 hours × $0.016 = **$11.68/month**

---

## Storage Cost (Cloud Logging + BigQuery)

- Cloud Logging: 5GB/month ingest free tier, then $0.50/GB. Estimated audit logs: ~3GB/month → **$0 (within free tier)**
- BigQuery storage: audit trail at ~100MB/month → $0.002/month → **~$0/month at pilot scale**
- BigQuery queries: ~10 queries/day × 10MB scanned = ~3GB/month scanned → first 1TB/month free → **$0**

---

## Full Monthly Cost Summary (Pilot Scale — 10 Tenants)

| Component                         | Estimated Monthly Cost | Notes                                     |
|-----------------------------------|------------------------|-------------------------------------------|
| LLM Inference (Gemini Flash+Pro)  | $124.71                | Dominant cost; drops with higher cache hit rate |
| Compute (Cloud Run)               | $20.00                 | Scales with request volume                |
| Redis Semantic Cache              | $11.68                 | Fixed baseline; saves ~$6.56 in LLM costs |
| Firestore Database                | $0.86                  | Low at pilot scale                        |
| Vertex AI Vector Search           | $0.16                  | Very low at pilot scale                   |
| Embedding Model                   | $0.25                  | Negligible                                |
| API Gateway (Apigee)              | $0.45                  | Near-zero at this scale                   |
| Cloud Pub/Sub                     | $0.002                 | Negligible                                |
| Cloud Logging + BigQuery          | $0.00                  | Within free tier                          |
| Secret Manager                    | ~$0.30                 | $0.03 per secret version × ~10 tenants   |
| **TOTAL**                         | **~$158.41/month**     | **~$15.84 per tenant per month**          |

---

## Cost Per Tenant Breakdown

At 10 tenants with 1,500 conversations/tenant/month:
- Cost per tenant: **~$15.84/month**
- Cost per conversation: **~$0.0106**
- Cost per turn: **~$0.0021**

This is competitive: typical LLM API costs alone for a DIY solution at this volume would be $12–15/month per tenant, without any of the orchestration, memory, guardrails, or observability infrastructure.

---

## Cost Scaling Projections

| Scale          | Tenants | Conversations/month | Est. Monthly Cost | Cost/Tenant |
|----------------|---------|--------------------:|------------------:|------------:|
| Pilot          | 10      | 15,000              | ~$158             | ~$15.84     |
| Early Growth   | 100     | 500,000             | ~$3,200           | ~$32        |
| Scale          | 1,000   | 10,000,000          | ~$48,000          | ~$48        |

*Note: Cost per tenant increases slightly at scale due to Redis/Apigee fixed costs being amortized differently; but LLM costs drop with better semantic cache hit rates (expected 35–50% at scale).*

---

## Key Cost Control Mechanisms

1. **Semantic Cache**: every cache hit saves ~$0.0017 (Gemini Flash) to $0.085 (Gemini Pro) per turn
2. **Model routing**: routing 65% of traffic to Gemini Flash vs. 100% to Pro saves ~$110/month at pilot scale alone
3. **Per-tenant token quotas**: hard stop prevents any single tenant from generating runaway costs
4. **Conversation history pruning**: only last 10 turns stored in Firestore, reducing context size and token usage
5. **Embedding reuse**: knowledge base documents are embedded once and reused across all queries — not re-embedded per request
