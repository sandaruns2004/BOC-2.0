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
- LLM routing split: **65% Claude Haiku, 30% Claude Sonnet, 5% cache hits** (no LLM call)
- Average **1.5 tool calls per conversation**
- Knowledge base: **5,000 documents per tenant**, ~500 tokens each = 2.5M tokens per tenant indexed as vectors

---

## LLM Inference Cost (Largest Cost Driver)

**Using AWS Bedrock:**

| Model | Turns/month | Input tokens | Output tokens | Cost |
|---|---|---|---|---|
| Claude 3 Haiku (65%) | 48,750 | 29.25M | 14.63M | **$12.97** |
| Claude 3.5 Sonnet (30%) | 22,500 | 13.5M | 6.75M | **$60.75** |
| Cache hits (5%) | 3,750 | 0 | 0 | $0.00 |
| **Total LLM** | | | | **~$73.72/month** |

*Haiku: $0.25/1M input + $1.25/1M output. Sonnet: $3.00/1M input + $15/1M output.*

> **Savings vs GCP Gemini Pro**: ~$50/month less than the equivalent Gemini Pro routing.

**For local development/demo: $0** — uses free Google AI Studio key.

---

## Embedding Cost (Pinecone + Google AI Studio)

- Embedding model: Google AI Studio text-embedding-004 — **FREE** (1,500 requests/day)
- Per-turn embedding (query): 75,000 turns/month → ~2.5 req/second peak
- Knowledge base indexing (one-time): well within free 1,500/day limit

| Item | Cost |
|---|---|
| Query embeddings | **$0 (free tier)** |
| Knowledge base indexing | **$0 (free tier)** |
| **Embedding total** | **$0/month** |

---

## Compute Cost (Vercel + AWS Lambda)

| Service | Deployment | Monthly cost est. |
|---|---|---|
| Next.js App (Vercel Hobby) | Serverless, auto-scaling | **$0 (free forever)** |
| AWS Lambda (tool execution) | Pay-per-use | **~$0.50** |
| **Total Compute** | | **~$0.50/month** |

*Vercel Hobby plan: unlimited Next.js deployments, 100GB bandwidth, 100K function invocations — all free.*

---

## Database Cost (Firebase Firestore + DynamoDB)

**Firebase Firestore (Free Spark plan):**
| Operation | Volume/month | Cost |
|---|---|---|
| Agent config reads | 75,000 reads | $0 (within 50K/day limit) |
| Conversation history reads | 150,000 reads | $0 (within free tier) |
| Conversation history writes | 375,000 writes | $0 (within 20K/day limit) |
| **Firestore total** | | **$0/month** |

**AWS DynamoDB (Free tier — forever):**
| Item | Free Tier Allowance | Our Usage | Cost |
|---|---|---|---|
| Storage | 25GB free | ~100MB/month | $0 |
| Write capacity | 25 WCU free | ~5 WCU avg | $0 |
| Read capacity | 25 RCU free | ~10 RCU avg | $0 |
| **DynamoDB total** | | | **$0/month** |

---

## Vector Search Cost (Pinecone Free Tier)

| Item | Free Allowance | Our Usage | Cost |
|---|---|---|---|
| Index storage | 2GB | ~200MB (50K vectors × 768 dims) | $0 |
| Query volume | Unlimited on starter | 75K queries/month | $0 |
| **Pinecone total** | | | **$0/month** |

---

## Messaging Cost (AWS SQS)

- **Free Tier:** 1 million SQS requests/month FOREVER (never expires)
- Audit log events: 75,000 turns × 1 message each = 75,000 messages
- Human escalation events: ~150 messages/month
- **Total: ~75,150 messages/month → well within 1M free tier**
- **SQS cost: $0/month**

---

## Logging Cost (AWS CloudWatch)

- **Free Tier:** 5GB log ingestion/month + 5GB storage
- Estimated audit logs: ~500 bytes per event × 75,000 events = 37.5MB/month
- **Total: 37.5MB → well within 5GB free tier**
- **CloudWatch cost: $0/month**

---

## Full Monthly Cost Summary (Pilot Scale — 10 Tenants)

| Component | Estimated Monthly Cost | Free Tier? | Notes |
|---|---|---|---|
| LLM Inference (Bedrock — Claude) | $73.72 | No | Dominant cost; $0 in dev with Gemini key |
| Compute (Vercel) | $0.00 | ✅ Free forever | Hobby plan unlimited |
| Compute (AWS Lambda) | $0.50 | ✅ Mostly free | 1M free reqs/month |
| Pinecone Vector Search | $0.00 | ✅ Free starter | 2GB / 100K vectors |
| Firebase Firestore | $0.00 | ✅ Free Spark plan | 50K reads/day |
| AWS DynamoDB (Audit Trail) | $0.00 | ✅ Free forever | 25GB + 25 WCU/RCU |
| AWS SQS (Message Queue) | $0.00 | ✅ Free forever | 1M msgs/month |
| AWS CloudWatch (Logging) | $0.00 | ✅ 5GB/month free | More than enough |
| AWS SSM Parameter Store | $0.00 | ✅ Free forever | Standard parameters |
| Embedding (Google AI Studio) | $0.00 | ✅ Free tier | 1,500 req/day |
| **TOTAL** | **~$74.22/month** | | **~$7.42 per tenant per month** |

> **vs. previous GCP estimate: $158.41/month** — AWS saves ~53% in infrastructure costs at pilot scale.

---

## Cost Per Tenant Breakdown

At 10 tenants with 1,500 conversations/tenant/month:
- Cost per tenant: **~$7.42/month**
- Cost per conversation: **~$0.0049**
- Cost per turn: **~$0.00099**

This is significantly below the GCP estimate of $15.84/tenant/month — primarily because:
1. AWS Bedrock Claude Haiku is cheaper than Gemini Flash per token
2. All infrastructure services (compute, storage, queues, logging) are within free tiers
3. Vercel eliminates Cloud Run compute costs entirely

---

## Cost Scaling Projections

| Scale | Tenants | Conversations/month | Est. Monthly Cost | Cost/Tenant |
|---|---|---|---|---|
| Pilot | 10 | 15,000 | ~$74 | ~$7.42 |
| Early Growth | 100 | 500,000 | ~$1,800 | ~$18 |
| Scale | 1,000 | 10,000,000 | ~$28,000 | ~$28 |

*At scale, DynamoDB and SQS move beyond free tier but remain very cost-effective.*

---

## Key Cost Control Mechanisms

1. **Semantic Cache**: every cache hit saves ~$0.0009 (Haiku) to $0.051 (Sonnet) per turn
2. **Model routing**: routing 65% of traffic to Haiku vs. 100% to Sonnet saves ~$47/month at pilot scale
3. **Per-tenant token quotas**: hard stop prevents any single tenant from generating runaway costs
4. **Conversation history pruning**: only last 10 turns stored in Firestore, reducing context size
5. **Embedding reuse**: knowledge base documents embedded once, reused across all queries
6. **DynamoDB TTL**: auto-delete traces older than 90 days to keep storage within free tier
