# 🧠 AgentForge — Full Project Deep Dive
### BOC 2.0 · Scenario 5: AI Agent Platform for Business Automation

---

## 1. What Is This Project?

**AgentForge** is a cloud-native, **multi-tenant AI Agent Platform** built entirely on Google Cloud Platform (GCP). It solves a specific enterprise problem: businesses want AI that can *actually do things* — cancel subscriptions, look up orders, trigger refunds — not just answer questions. But raw LLMs can't be trusted to do this safely.

AgentForge is the **infrastructure layer** between "a language model that can reason" and "a business system that needs to be operated safely."

> **Tagline:** *"Deploy intelligent agents. Own the results."*

**Analogous to:** Vercel for AI Agents — businesses configure via dashboard; AgentForge handles everything underneath.

**Built for:** BOC 2.0 Competition, Scenario 5 — scored on safety, cost control, multi-tenant isolation, and observability.

---

## 2. The Core Problem

Raw LLMs fail enterprises in 6 specific ways — all covered in the current frontend UI:

| Problem | Impact | Frontend Label |
|---|---|---|
| No persistent memory across sessions | Context loss, poor UX | "No Memory" |
| No safety/guardrails | Hallucinated tool calls execute | "No Safety & Guardrails" |
| Unconstrained token costs | Bills spiral at scale | "Runaway Token Costs" |
| No audit trail | Can't explain agent decisions | "Zero Observability" |
| Shared infrastructure | One tenant breaks others | "No Multi-Tenancy" |
| 3–6 months of infra work | Engineering bottleneck | "Months to Build" |

---

## 3. Three User Personas

```mermaid
graph TD
    BA["🏢 Business Admin\n(Config & Policy)"] -->|"Configures agents,\nsets tool permissions,\napproves high-risk actions"| AF[AgentForge Platform]
    EU["👤 End User / Client\n(Execution Flow)"] -->|"Sends chat messages,\nreceives AI responses,\nPII auto-masked"| AF
    PO["📡 Platform Ops / SRE\n(Ops & Security)"] -->|"Monitors all tenants,\nCloud Trace visibility,\nBigQuery audit replay"| AF
```

---

## 4. High-Level System Architecture (5 Layers)

```mermaid
graph TB
    subgraph EXTERNAL["🌐 External Actors (Outside GCP)"]
        BA[Business Admin Browser]
        EU[End User Browser/Mobile/API]
        EXTAPI[External Tool APIs\nCRM · Helpdesk · Payments]
        CLAUDE[Anthropic Claude API\nFallback LLM Only]
    end

    subgraph GCP["☁️ Google Cloud Platform Boundary"]
        subgraph L1["Layer 1 — Entry & API Gateway"]
            APIGEE[Apigee API Gateway\nJWT Auth · Rate Limiting · Tenant Routing · Metering]
        end

        subgraph L2["Layer 2 — Core Agent Processing (Cloud Run)"]
            ORCH[Agent Orchestration Service\nCoordinator / State Machine]
            MEM[Memory & Context Layer\nEmbedding + Vector Search + Conversation Store]
            LLMR[LLM Router\nGemini Flash/Pro · Semantic Cache · Model Fallback]
            GUARD[Guardrails Pipeline\nL1: Input · L2: Output · L3: Human Escalation]
        end

        subgraph L3["Layer 3 — Tool Execution"]
            TOOL[Tool Executor\nEphemeral Containers · Schema Validation]
            PUBSUB[Cloud Pub/Sub\nHuman Approval Queue]
        end

        subgraph L4["Layer 4 — Persistence, Audit & Observability"]
            FS[Firestore\nAgent Configs · Conversations]
            CL[Cloud Logging\nImmutable Audit Trail]
            BQ[BigQuery\nAnalytics & Replay Queries]
            CT[Cloud Trace\nDistributed Request Tracing]
            CM[Cloud Monitoring\nAlerts · Dashboards · PagerDuty]
        end

        subgraph L5["Layer 5 — Cost Metering"]
            COST[Cost Metering Service\nToken Usage · Quota Enforcement]
        end

        subgraph STORAGE["Supporting Infrastructure"]
            REDIS[Memorystore Redis\nSemantic Response Cache]
            VS[Vertex AI Vector Search\nPer-Tenant Isolated Indexes]
            SM[Secret Manager\nTenant-Namespaced Credentials]
            GEMINI[Vertex AI Gemini\nFlash + 1.5 Pro]
        end
    end

    BA -->|HTTPS + JWT| APIGEE
    EU -->|HTTPS + API Key| APIGEE
    APIGEE -->|Tenant-tagged request| ORCH
    ORCH --> MEM
    ORCH --> GUARD
    ORCH --> LLMR
    ORCH --> TOOL
    ORCH -->|Write decision trace| CL
    MEM --> VS
    MEM --> FS
    LLMR --> REDIS
    LLMR --> GEMINI
    LLMR --> CLAUDE
    GUARD -->|High-risk action| PUBSUB
    PUBSUB -->|Admin review| BA
    TOOL -->|Fetch credentials| SM
    TOOL --> EXTAPI
    CL -->|Log Sink| BQ
    LLMR --> COST
    COST --> BQ
```

---

## 5. Request Lifecycle — Step by Step

This is the complete journey of a single user message through AgentForge.

```mermaid
sequenceDiagram
    participant U as End User
    participant A as Apigee Gateway
    participant O as Orchestration Svc
    participant G as Guardrails Pipeline
    participant M as Memory Layer
    participant L as LLM Router
    participant R as Redis Cache
    participant V as Vertex AI
    participant T as Tool Executor
    participant SM as Secret Manager
    participant EXT as External API
    participant P as Cloud Pub/Sub
    participant LOG as Cloud Logging

    U->>A: HTTPS POST /chat\n{message, api_key}
    A->>A: JWT validate · Identify tenant · Rate limit check
    A->>O: Tenant-tagged request\n{tenantId, message, sessionId}

    O->>O: Load agent config from Firestore

    Note over O,G: Phase 1 — Input Guardrails
    O->>G: Validate user input
    G->>G: Prompt injection check
    G->>G: PII scrubber (regex + NER)
    G->>G: Business rule check
    G-->>O: PASS · Scrubbed message

    Note over O,M: Phase 2 — Memory Retrieval
    O->>M: Retrieve relevant context
    M->>V: Embed query (text-embedding-004)
    V-->>M: Query vector (768 dims)
    M->>V: Vector search (tenant index, top-5)
    V-->>M: Relevant document chunks
    M->>O: Assembled context block

    Note over O,L: Phase 3 — LLM Inference
    O->>L: Send assembled prompt
    L->>R: Check semantic cache
    alt Cache HIT (25-40% of requests)
        R-->>L: Cached response (<5ms)
        L-->>O: Response (no LLM call, $0 cost)
    else Cache MISS
        L->>L: Classify complexity\n(simple=Flash, complex=Pro)
        L->>V: Gemini Flash/Pro call
        V-->>L: LLM response
        L->>R: Write to cache (24h TTL)
        L-->>O: LLM response
    end

    Note over O,G: Phase 4 — Output Guardrails
    O->>G: Validate LLM response
    G->>G: JSON schema validation
    G->>G: Confidence threshold check
    G->>G: Risk classification

    alt High-Risk Action Detected
        G->>P: Publish to Human Approval Queue
        P-->>U: "Request sent for review"
        Note over P: Admin reviews &\napproves/rejects
    else Safe to Execute
        O->>T: Execute tool call
        T->>SM: Fetch tenant API credentials
        SM-->>T: API key (tenant-scoped)
        T->>EXT: HTTP call to external API
        EXT-->>T: API response
        T-->>O: Tool result
        O-->>U: Final response (SSE streaming)
    end

    Note over O,LOG: Phase 5 — Async Audit
    O->>P: Publish decision trace
    P->>LOG: Write immutable structured log
    LOG->>LOG: Stream to BigQuery (Log Sink)
```

---

## 6. Database Design

### 6a. Firestore (Primary Operational DB)

Firestore uses a **hierarchical document model** with strict per-tenant namespace isolation. No service can even construct a valid path to another tenant's data.

```mermaid
graph TD
    ROOT["/tenants/{tenantId}/"]
    ROOT --> AGENTS["/agents/{agentId}"]
    ROOT --> CONVS["/conversations/{sessionId}"]
    ROOT --> APPROVAL["/approvals/{approvalId}"]
    ROOT --> USAGE["/usage/{date}"]

    AGENTS --> AGENT_DOC["Agent Document:\n• systemPrompt: string\n• modelPreference: Flash|Pro\n• allowedTools: string[]\n• guardrailRules: object\n• createdAt: timestamp\n• tenantId: string"]

    CONVS --> CONV_DOC["Conversation Document:\n• userId: string\n• startedAt: timestamp\n• status: active|ended\n• turns: (sub-collection)"]
    CONV_DOC --> TURNS["/turns/{turnId}"]
    TURNS --> TURN_DOC["Turn Document:\n• role: user|assistant\n• scrubbedContent: string\n• piiRef: secureRef (if any)\n• timestamp: timestamp\n• traceId: string\n• tokenCount: number"]

    APPROVAL --> APPROVAL_DOC["Approval Document:\n• toolName: string\n• parameters: object\n• riskLevel: high|critical\n• status: pending|approved|rejected\n• adminId: string (after decision)\n• pubsubMessageId: string"]

    USAGE --> USAGE_DOC["Usage Document:\n• promptTokens: number\n• completionTokens: number\n• llmCostUsd: number\n• toolCallCount: number\n• cacheHits: number"]
```

> [!IMPORTANT]
> Firestore TTL policies automatically delete conversation documents after **90 days** (configurable per tenant). No manual cleanup needed.

### 6b. Vertex AI Vector Search (Memory/RAG DB)

Each tenant gets a **completely separate vector index** — physically isolated, not just logically filtered.

```
Structure per tenant:
├── Index ID: vector_idx_{tenantId}
│   ├── Dimension: 768 (text-embedding-004)
│   ├── Approximate Neighbors Count: 5
│   ├── Distance Measure: COSINE
│   └── Documents stored as:
│       {
│         id: "chunk_{docId}_{chunkNum}",
│         embedding: float[768],
│         metadata: {
│           tenantId: string,
│           sourceDocId: string,
│           chunkText: string (first 200 chars),
│           indexedAt: timestamp
│         }
│       }
```

**Query flow:** User query → embed → cosine similarity search against tenant's index → top-5 chunks with score ≥ 0.92 threshold → inject into LLM prompt.

> [!NOTE]
> Conversation history is **never embedded** into Vector Search — only business-uploaded knowledge base documents. This prevents conversation data from leaking into the vector store.

### 6c. BigQuery (Audit & Analytics)

Append-only, tamper-evident audit store. INSERT-only permissions — no service can UPDATE or DELETE.

```sql
-- audit_traces table schema
CREATE TABLE agent_audit.traces (
    trace_id        STRING NOT NULL,
    tenant_id       STRING NOT NULL,
    session_id      STRING NOT NULL,
    step_order      INT64 NOT NULL,
    step_type       STRING,          -- INPUT_RECEIVED, MEMORY_RETRIEVAL, LLM_CALL, GUARDRAILS_OUTPUT_CHECK, TOOL_EXEC, AUDIT_SINK
    timestamp       TIMESTAMP NOT NULL,
    prompt_tokens   INT64,
    completion_tokens INT64,
    model_used      STRING,          -- gemini-flash, gemini-pro, claude-3-5-sonnet
    cache_hit       BOOL,
    retrieved_chunk_ids ARRAY<STRING>,
    similarity_scores   ARRAY<FLOAT64>,
    tool_called     STRING,
    tool_parameters STRUCT<...>,
    guardrail_action STRING,         -- PASS, BLOCK, ESCALATE_TO_HUMAN
    pii_detected    BOOL,
    scrubbed_message STRING,         -- NEVER raw PII
    response_preview STRING,
    duration_ms     INT64,
    llm_cost_usd    FLOAT64
)
PARTITION BY DATE(timestamp)
CLUSTER BY tenant_id, step_type;
```

### 6d. Memorystore Redis (Semantic Cache)

```
Cache key: "scache:{tenantId}:{embeddingHash}"
Cache value: {
  "response": "Your order #1234 is currently being processed...",
  "model": "gemini-flash",
  "tokens_saved": 760,
  "cached_at": 1727888400,
  "hit_count": 0
}
TTL: 86400 seconds (24 hours)
Similarity threshold: cosine distance < 0.08 (i.e., similarity > 0.92)
```

Also used for:
- Agent config cache (5-min TTL) — Firestore fallback avoidance
- Active session conversation cache (30-min TTL) — hot path optimization
- Per-tenant rate limit counters (sliding window)

---

## 7. The 3-Layer Guardrails Pipeline (Deep Dive)

The most critical safety system. Runs **before** input reaches the LLM and **after** LLM response is generated.

```mermaid
flowchart TD
    INPUT["📩 Raw User Message"] --> L1_START

    subgraph LAYER1["🔴 Layer 1 — Input Sanitization"]
        L1_START["Receive raw message"] --> INJ["Prompt Injection Detector\n(classifier model)"]
        INJ -->|Injection detected| BLOCK1["❌ Return safe error\nLog blocked attempt"]
        INJ -->|Clean| PII["PII Scrubber\n(regex + NER model)"]
        PII -->|"SSN, card, email found"| REPLACE["Replace with [REDACTED_PII]\nStore original in secure Firestore"]
        REPLACE --> BIZ["Business Rule Check\n(Is topic allowed for this agent?)"]
        PII -->|No PII| BIZ
        BIZ -->|"Topic violates rules"| BLOCK2["❌ Return off-topic error\nLog block with reason"]
        BIZ -->|OK| L1_PASS["✅ L1 PASS — Scrubbed message"]
    end

    L1_PASS --> LLM["🤖 LLM Call\n(Gemini Flash/Pro)"]
    LLM --> L2_START

    subgraph LAYER2["🟡 Layer 2 — Output Validation"]
        L2_START["Receive LLM response"] --> SCHEMA["JSON Schema Validation\n(tool call structure)"]
        SCHEMA -->|"Schema mismatch\nHallucinated parameters"| RETRY["Retry with correction prompt\n(max 2 retries → error)"]
        SCHEMA -->|Valid| CONF["Confidence Threshold Check\n(score < 0.85 = escalate)"]
        CONF -->|Low confidence| ESCAL1["⚠️ Flag for human review"]
        CONF -->|OK| RISK["Risk Classification\nCheck against tenant's high-risk list"]
    end

    subgraph LAYER3["🟢 Layer 3 — Human-in-the-Loop"]
        RISK -->|"High-risk tool call\n(e.g. cancel_subscription, refund > $100)"| PUBSUB["📤 Publish to Cloud Pub/Sub\nHuman Approval Queue"]
        PUBSUB --> NOTIFY["Notify Business Admin\n(email + dashboard badge)"]
        NOTIFY --> WAIT["Admin reviews & decides"]
        WAIT -->|Approve| EXEC["Execute Tool Call"]
        WAIT -->|Reject| LOGBLOCK["Log rejection + reason"]
    end

    RISK -->|Low-risk tool call| TOOLEXEC["⚡ Tool Executor\n(direct execution)"]
    RISK -->|No tool call needed| RESPONSE["📤 Return response to user"]
    EXEC --> RESPONSE
    TOOLEXEC --> RESPONSE
```

---

## 8. RAG Memory System (Deep Dive)

```mermaid
flowchart LR
    subgraph INDEXING["📚 Indexing Phase (One-Time + Weekly Updates)"]
        DOCS["Business KB Documents\n(PDFs, FAQs, policies)"] --> CHUNK["Chunker\n500-token chunks with overlap"]
        CHUNK --> EMBED_IDX["Vertex AI text-embedding-004\nGenerate 768-dim vectors"]
        EMBED_IDX --> VS_STORE[("Vertex AI Vector Search\nTenant-isolated index\nchunk_id + vector + metadata")]
    end

    subgraph RETRIEVAL["🔍 Query-Time Retrieval (Per Request)"]
        QUERY["User message:\n'Cancel my subscription'"] --> EMBED_Q["Embed query\n(same model = same vector space)"]
        EMBED_Q --> SEARCH["ANN Search in tenant's index\nTop-5 by cosine similarity\nThreshold: ≥ 0.92"]
        SEARCH --> CHUNKS["Retrieved chunks:\n• doc_faq_45 (0.94): Cancel instructions\n• doc_faq_12 (0.87): Billing period note\n• conv_turn_3 (0.81): Past pause inquiry"]
        CONVHIST["Firestore: Last 10\nconversation turns"] --> ASSEMBLE
        CHUNKS --> ASSEMBLE["Assembled Context Block\n(injected into LLM prompt)"]
    end

    ASSEMBLE --> LLM["LLM Call\n(Gemini with context)"]
```

**Why this matters:**
- Without RAG: Every LLM call includes ALL conversation history → 10,000+ tokens → $0.035/call → context window exceeded at scale
- With RAG: Only top-5 relevant chunks → ~600 tokens total → $0.00045/call → **98.7% cost reduction on context**

---

## 9. LLM Routing Logic

```mermaid
flowchart TD
    PROMPT["Assembled Prompt"] --> CACHE_CHECK["Check Redis Semantic Cache\n(cosine similarity > 0.92?)"]
    CACHE_CHECK -->|"HIT\n25-40% of requests"| CACHED["Return cached response\nCost: ~$0\nLatency: <5ms"]
    CACHE_CHECK -->|MISS| CLASSIFY["Classify prompt complexity"]
    
    CLASSIFY -->|"Simple / factual\n'What are your hours?'"| FLASH["Gemini Flash\n$0.075/1M input tokens\n~400ms response"]
    CLASSIFY -->|"Complex / multi-step\n'Compare my last 3 orders'"| PRO["Gemini 1.5 Pro\n$3.50/1M input tokens\n~800ms response"]
    
    FLASH -->|"Gemini API error rate > 5%"| FALLBACK["Claude 3.5 Sonnet\n(Anthropic API fallback)"]
    PRO -->|"Gemini API error rate > 5%"| FALLBACK

    FLASH --> WRITE_CACHE["Write response to Redis\n24-hour TTL"]
    PRO --> WRITE_CACHE
    FALLBACK --> WRITE_CACHE

    FLASH --> TOKEN_LOG["Log token usage\n→ Cost Metering Service"]
    PRO --> TOKEN_LOG
    CACHED --> TOKEN_LOG
```

**Routing split at pilot scale:**
- 65% → Gemini Flash ($6.58/month)
- 30% → Gemini Pro ($118.13/month)
- 5% → Semantic cache ($0/month)
- **Without routing (all to Pro): ~$390/month — routing saves $232/month (59%)**

---

## 10. Tool Execution Security

```mermaid
flowchart TD
    LLM_OUT["LLM Output:\n{tool: 'cancel_subscription',\n params: {userId: 'REF_4821'}}"] --> SCHEMA_V["Schema Validation\nJSON Schema check"]
    SCHEMA_V -->|Invalid schema| REJECT["❌ Rejected\nLLM asked to retry"]
    SCHEMA_V -->|Valid| URL_CHECK["URL Allowlist Check\nIs target URL in tenant's config?"]
    URL_CHECK -->|URL not allowed| BLOCK["❌ Blocked\nLog: unauthorized_url_attempt"]
    URL_CHECK -->|Allowed| RISK_GATE["Risk Gate\nIs this tool marked high-risk?"]
    RISK_GATE -->|High-risk| HUMAN["→ Human Approval Queue\n(Pub/Sub)"]
    RISK_GATE -->|Low-risk| CONTAINER["Ephemeral Cloud Run Job\n(isolated container per call)"]
    CONTAINER --> SM_FETCH["Fetch credentials from Secret Manager\n/tenants/{tenantId}/tools/{toolName}/apiKey"]
    SM_FETCH --> VPC["VPC Service Controls\n(blocks: 10.x.x.x, 172.16.x.x, 192.168.x.x)\n(allows: HTTPS only to allowlisted URLs)"]
    VPC --> EXTAPI["External API Call\nGET /orders/4821\nPOST /refunds"]
    EXTAPI -->|Response| RESULT["Return result to Orchestration"]
    EXTAPI -->|Timeout over 10s| TIMEOUT["Timeout error\nAgent: 'Info temporarily unavailable'"]
    CONTAINER -->|Job ends| DESTROY["Container destroyed\nCredentials never persisted"]
```

---

## 11. Multi-Tenant Isolation Architecture

```mermaid
graph TB
    subgraph TENANT_A["🏢 Tenant A (ACME Corp)"]
        A_VS[("Vector Index\nvector_idx_acme")]
        A_FS[("Firestore\n/tenants/acme/...")]
        A_SM[("Secret Manager\n/tenants/acme/tools/...")]
        A_LOG["Logs filtered to\ntenant_id = 'acme'"]
    end

    subgraph TENANT_B["🏢 Tenant B (Globex Inc)"]
        B_VS[("Vector Index\nvector_idx_globex")]
        B_FS[("Firestore\n/tenants/globex/...")]
        B_SM[("Secret Manager\n/tenants/globex/tools/...")]
        B_LOG["Logs filtered to\ntenant_id = 'globex'"]
    end

    subgraph ENFORCEMENT["🛡️ Isolation Enforcement Layers"]
        APIGEE_E["Apigee: Validates API key\n→ Injects X-Tenant-ID header\n(downstream never trusts request body)"]
        IAM_E["IAM: Service accounts\nscoped to own tenant only\n(Workload Identity Federation)"]
        PATH_E["Path-based namespacing:\nService account for Tenant A\ncannot construct valid path\nto Tenant B's Firestore/SM"]
        RATE_E["Per-tenant rate limits\nin Redis token buckets\n(spike from A doesn't\naffect B's quota)"]
    end

    APIGEE_E --> IAM_E --> PATH_E --> RATE_E
```

**Isolation is structural, not just policy-based:**
- A misconfigured query in Tenant A's code cannot return Tenant B's vectors — they're in different indexes
- A bug in the application layer cannot access wrong tenant secrets — IAM prevents it at the infrastructure level
- A traffic spike from Tenant A cannot consume Tenant B's LLM quota — token buckets are per-tenant in Redis

---

## 12. Observability & Decision Traces

Every agent invocation produces a **Decision Trace** — a linked chain of structured log entries that explains *why* the agent did what it did.

```mermaid
graph LR
    subgraph TRACE["Decision Trace: tr_8f3a9bc2 (542ms total)"]
        direction LR
        S1["Step 1\nINPUT_INSPECT\n8ms\n✅ PII: 0 leaks"] --> S2["Step 2\nRAG_RETRIEVE\n42ms\n✅ 3 chunks retrieved\n(scores: 0.94, 0.87, 0.81)"] --> S3["Step 3\nLLM_ROUTER\n410ms\nGemini Flash\n612 in + 148 out tokens"] --> S4["Step 4\nTOOL_EXEC\n68ms\ncheck_order_status(#1234)"] --> S5["Step 5\nAUDIT_SINK\n14ms async\nPub/Sub → BigQuery\nImmutable row written"]
    end
```

**Streaming to BigQuery enables SQL queries like:**
```sql
-- Why did agent block this tool call?
SELECT step_details FROM agent_traces
WHERE trace_id = 'tr_8f3a9bc2' ORDER BY step_order;

-- Which knowledge docs influence responses most?
SELECT chunk_id, COUNT(*) as hits, AVG(similarity_score) as avg_score
FROM agent_traces, UNNEST(retrieved_chunk_ids) as chunk_id
WHERE tenant_id = 'acme' AND timestamp > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
GROUP BY chunk_id ORDER BY hits DESC LIMIT 20;
```

---

## 13. Frontend Architecture (Current UI)

The frontend is a **Next.js 14 App Router** application with Tailwind CSS and Material Symbols icons. It is a **marketing/demo site** — not the actual admin dashboard (which is mentioned but not yet built).

```mermaid
graph TB
    subgraph NEXTJS["Next.js App (my-app/)"]
        LAYOUT["layout.tsx\n(Navigation bar, footer, Google Fonts)"]
        LAYOUT --> HOME["page.tsx\n(Main landing page — 1,376 lines)"]
        HOME --> SHADER["AnimatedShader component\n(WebGL animated background)"]
        
        HOME --> SEC1["Hero Section\nAnimated agent visualization\nFloating metric cards"]
        HOME --> SEC2["Problem Section\n6 problem cards with icons"]
        HOME --> SEC3["Personas Section\nBusiness Admin · End User · Platform Ops"]
        HOME --> SEC4["Architecture Section\n5-layer pipeline visualization"]
        HOME --> SEC5["Pillars Section\n3 core differentiators with interactive demos"]
        HOME --> SEC6["Tech Stack Section\n11 GCP services grid"]
        HOME --> SEC7["Demo Section\nLive trace console simulation"]
        HOME --> SEC8["Pricing Section\nPilot vs Growth vs Scale tiers"]

        LAYOUT --> ARCH_PAGE["architecture/ page"]
        LAYOUT --> DEMO_PAGE["demo/ page"]
        LAYOUT --> STUDIO_PAGE["studio/ page"]
        LAYOUT --> ESCALATION_PAGE["escalation/ page"]
        LAYOUT --> PRICING_PAGE["pricing/ page"]
        LAYOUT --> REPLAY_PAGE["replay/ page"]
        LAYOUT --> SECURITY_PAGE["security/ page"]
        LAYOUT --> INCIDENT_PAGE["incident/ page"]
        LAYOUT --> LAUNCH_PAGE["launch/ page"]
        LAYOUT --> DOCS_PAGE["docs/ page"]
    end

    subgraph STATIC_UI["Static HTML UI (ui/ folder)"]
        HTML1["AgentForge_-_AI_Agent_Platform.html\n(Main platform page)"]
        HTML2["AgentForge_-_Agent_Studio.html"]
        HTML3["AgentForge_-_Architecture_and_Pipeline.html"]
        HTML4["AgentForge_-_Execution_Replay.html"]
        HTML5["AgentForge_-_Human_Escalation_Queue.html"]
        HTML6["AgentForge_-_Live_Demo_and_Trace_Console.html"]
        HTML7["AgentForge_-_Pricing_and_Economics.html"]
        HTML8["AgentForge_-_Security_Incident.html"]
        HTML9["AgentForge_-_Pillars_and_Security.html"]
    end
```

**Design System:**
- **Fonts:** Geist (headings), Inter (body), JetBrains Mono (code)
- **Color Palette:** Material Design 3 tokens with custom GCP-inspired indigo/violet/teal scheme
- **Primary:** `#3525cd` (deep indigo) → `#712ae2` (violet) → `#71f8e4` (teal)
- **Motion:** Tailwind `animate-ping`, `animate-pulse`, `animate-bounce` for live-feel indicators

---

## 14. Infrastructure & GCP Services Map

```mermaid
graph TB
    subgraph COMPUTE["⚙️ Compute"]
        CR1["Cloud Run — Agent Orchestration\n1 vCPU · 512MB · ~$8/mo"]
        CR2["Cloud Run — Memory Layer\n0.5 vCPU · 256MB · ~$2/mo"]
        CR3["Cloud Run — LLM Router\n0.5 vCPU · 256MB · ~$4/mo"]
        CR4["Cloud Run — Guardrails Pipeline\n1 vCPU · 512MB · ~$2/mo"]
        CR5["Cloud Run Jobs — Tool Executor\nEphemeral per-call · ~$3/mo"]
        CR6["Cloud Run — Admin Backend\n0.5 vCPU · 256MB · ~$1/mo"]
    end

    subgraph AI["🤖 AI / ML"]
        VAI["Vertex AI\nGemini Flash · Gemini 1.5 Pro"]
        EMB["Vertex AI text-embedding-004\n768-dim · $0.000025/1K tokens"]
        VS["Vertex AI Vector Search\nPer-tenant ANN indexes"]
    end

    subgraph DATA["🗄️ Data & State"]
        FS["Firestore\nAgent configs · Conversations\n~$0.86/month"]
        REDIS["Memorystore Redis 1GB\nSemantic cache · Session cache\n~$11.68/month"]
        BQ["BigQuery\nAudit trail · Analytics\n~$0 at pilot scale"]
    end

    subgraph GATEWAY["🌐 Gateway & Messaging"]
        APIGEE["Apigee API Gateway\nJWT · Rate limits · Metering\n~$0.45/month"]
        PUBSUB["Cloud Pub/Sub\nEscalation queue · Audit stream\n~$0.002/month"]
        SM["Secret Manager\nPer-tenant credentials\n~$0.30/month"]
    end

    subgraph OBSERVABILITY["📊 Observability"]
        CL["Cloud Logging\nImmutable structured logs\n~$0 (within free tier)"]
        CT["Cloud Trace\nDistributed request tracing"]
        CM["Cloud Monitoring\nAlerts · Dashboards"]
        PAGERDUTY["PagerDuty\n(external - on-call alerts)"]
    end
```

---

## 15. Cost Analysis

### Pilot Scale (10 Tenants, 15,000 conversations/month)

| Component | Monthly Cost | Notes |
|---|---|---|
| LLM Inference (Gemini Flash 65%) | $6.58 | 29.25M input + 14.63M output tokens |
| LLM Inference (Gemini Pro 30%) | $118.13 | 13.5M input + 6.75M output tokens |
| Cloud Run (all 6 services) | $20.00 | Scales to zero outside hours |
| Memorystore Redis (1GB) | $11.68 | Fixed baseline |
| Firestore | $0.86 | Read + write ops |
| Vertex AI Vector Search | $0.16 | 50K vectors + 75K queries |
| Vertex AI Embedding | $0.25 | Query embeddings |
| Apigee | $0.45 | 150K API calls |
| Secret Manager | $0.30 | 10 tenant secrets |
| Cloud Pub/Sub | $0.002 | 37.5MB/month |
| Cloud Logging + BigQuery | $0.00 | Within free tier |
| **TOTAL** | **~$158/month** | **$15.84/tenant · $0.0106/conversation** |

### Cost Scaling Trajectory

| Scale | Tenants | Conversations/mo | Monthly Cost | Cost/Tenant |
|---|---|---|---|---|
| Pilot | 10 | 15,000 | ~$158 | ~$15.84 |
| Early Growth | 100 | 500,000 | ~$3,200 | ~$32 |
| Scale | 1,000 | 10,000,000 | ~$48,000 | ~$48 |

---

## 16. Security Architecture Summary

```mermaid
flowchart TD
    subgraph EXTERNAL_THREATS["🚨 Threat Vectors"]
        PI["Prompt Injection"]
        SSRF["SSRF Attacks"]
        CROSS["Cross-Tenant Data Bleed"]
        PII_LEAK["PII Leakage to LLMs"]
        CRED_LEAK["Credential Exposure"]
    end

    subgraph DEFENSES["🛡️ Defense Layers"]
        PI --> GUARD_L1["Guardrails L1:\nInjection classifier model"]
        SSRF --> VPC_CTRL["VPC Service Controls:\nBlocks private IPs (10.x, 172.16.x, 192.168.x)"]
        CROSS --> STRUCT_ISO["Structural Isolation:\nSeparate vector indexes\nSeparate Firestore paths\nIAM-bound service accounts"]
        PII_LEAK --> PII_SCRUB["PII Scrubber:\nRegex + NER model\nReplace with [REDACTED]\nStore original in CMEK-encrypted Firestore"]
        CRED_LEAK --> SECRET_MGR["Secret Manager:\nCMEK encryption\nPath-namespaced by tenant\nNever in container env vars"]
    end

    subgraph ENCRYPTION["🔐 Encryption"]
        TLS["External: TLS 1.3 (1.2 disabled)"]
        MTLS["Internal: mTLS via Cloud Run service mesh"]
        REST["At rest: AES-256 (Google-managed)"]
        CMEK["Secrets: Customer-managed KMS keys"]
    end

    subgraph AUTH["🔑 Authentication"]
        ADMIN_AUTH["Admins: Google OAuth 2.0 / SAML SSO + MFA (enforced)"]
        USER_AUTH["End Users: Business-issued JWT (24h TTL, rotated on use)"]
        SVC_AUTH["Services: Workload Identity Federation\n(no exportable credentials)"]
    end
```

---

## 17. Resilience & Availability Design

```mermaid
graph TD
    subgraph FAILURES["⚠️ Failure Scenarios & Responses"]
        LLM_FAIL["LLM API Error Rate > 5%\nover 60 seconds"]
        LLM_FAIL --> FALLBACK["Route complex → Claude 3.5 Sonnet\nRoute simple → Nearest cached response\nCircuit breaker: stop retrying for 60s after 10 failures"]

        FS_FAIL["Firestore Unavailable"]
        FS_FAIL --> FS_CACHE["Serve agent config from Redis\n(5-min TTL cache)\nQueue conversation writes to Pub/Sub for retry\nRPO = 0 · RTO < 60s (multi-AZ replication)"]

        REDIS_FAIL["Redis Unavailable"]
        REDIS_FAIL --> BYPASS["Cache-bypass mode:\nAll requests go directly to LLM\nConfig reads fall back to Firestore\nRedis HA replica: auto-failover 1-2s"]

        TOOL_TIMEOUT["Tool Call Timeout\n(>10 seconds)"]
        TOOL_TIMEOUT --> GRACEFUL["Return structured error to LLM\nAgent tells user: 'info temporarily unavailable'\nLog timeout to audit trail"]

        TOOL_LOOP["Agent enters tool-calling loop"]
        TOOL_LOOP --> HARD_STOP["Hard limit: 10 tool calls/turn\n50 tool calls/session\nReturn 'task too complex' error\nAlert if 3× above 7-day moving average"]
    end
```

**Disaster Recovery:**
- Firestore: daily export to Cloud Storage (30-day retention)
- Vector Search: weekly snapshots (4-week retention)
- Secret Manager: 90-day version history
- Full regional failover RTO: 4 hours (pilot) → <1 minute (future multi-region)

---

## 18. Performance Targets

### Latency Budget (Typical Request, No Tool Call, Cache Miss)

| Step | Service | Latency |
|---|---|---|
| API routing & auth | Apigee | 10–20ms |
| Embedding generation | Vertex AI | 30–50ms |
| Vector search | Vertex AI | 20–40ms |
| Input guardrails | Guardrails Pipeline | 15–25ms |
| LLM call (Gemini Flash) | Vertex AI | 400–800ms |
| Output guardrails | Guardrails Pipeline | 10–20ms |
| **Total P50** | End-to-end | **~550ms** |

> [!TIP]
> Audit log writing is **asynchronous via Pub/Sub** — it contributes 0ms to user-facing latency. For chat interfaces, **Server-Sent Events** streaming delivers first tokens within 200–300ms.

### Cache Performance

| Type | Latency | Cost |
|---|---|---|
| Semantic cache hit | <5ms | ~$0 |
| Gemini Flash call | 400–800ms | $0.00045 |
| Gemini Pro call | 600–1200ms | $0.0106 |

---

## 19. What the Frontend Currently Demos

The Next.js frontend (`my-app/`) is a sophisticated **presentation/demo site** that visually demonstrates every major concept:

| Section | What It Shows |
|---|---|
| **Hero** | Animated agent core with live floating metric cards (guardrail score, cache %, tool manifest JSON) |
| **Problem** | 6 pain cards explaining why raw LLMs fail enterprises |
| **Personas** | 3 user types with their specific capabilities and access endpoints |
| **Architecture** | 5-layer pipeline visualization with connecting animated dashes |
| **Pillar 1** | Interactive guardrail flow simulator (L1→L2→L3 with example trace) |
| **Pillar 2** | Isolated vector cluster map showing 2 tenant namespaces with cryptographic boundary |
| **Pillar 3** | Decision timeline (5 steps, 542ms trace visualization) |
| **Tech Stack** | 11 GCP service cards with descriptions |
| **Ops Console** | Simulated metrics: 42 active agents, 542ms P50, 0.02% guardrail blocks, $158.41/month |
| **Pricing** | Pilot/Growth/Scale tiers with per-conversation cost calculations |

The static HTML files in `ui/` represent prototype versions of specific platform screens (Agent Studio, Execution Replay, Escalation Queue, etc.).

---

## 20. Future Roadmap (Priority Order)

```mermaid
gantt
    title AgentForge Development Roadmap
    dateFormat  YYYY-Q
    axisFormat  %Y Q%q
    section Current
    BOC 2.0 Submission              :done, 2026-Q3, 2026-Q3
    Marketing/Demo Frontend         :done, 2026-Q3, 2026-Q3
    section Priority 1
    Multi-turn Planning + SSE       :2026-Q4, 2027-Q1
    section Priority 2
    Agent Template Marketplace      :2027-Q1, 2027-Q2
    section Priority 3
    Fine-tuning Pipeline            :2027-Q2, 2027-Q3
    section Priority 4
    Real-time KB Streaming Updates  :2027-Q2, 2027-Q3
    section Priority 5
    Multi-region Active-Active      :2027-Q3, 2027-Q4
```

---

## 21. Known Honest Limitations

> [!WARNING]
> These are explicitly acknowledged in the proposal — transparency is part of the design philosophy.

1. **LLM non-determinism** — Guardrails reduce but cannot eliminate subtly wrong answers that pass all safety checks. Ongoing human review of sampled interactions is required.

2. **Complex multi-session planning** — The architecture handles single-turn and short multi-step sequences well, but not long-running plans spanning hours/days (would require persistent task queue).

3. **Knowledge base freshness** — Vector index is re-indexed weekly. For businesses with daily-changing info, weekly re-indexing is too slow (real-time streaming would add complexity).

4. **Configuration dashboard UX** — The backend is deeply designed; the business-facing configuration UI is mentioned but not built in this proposal scope.

---

## 22. File Map Reference

| Path | Description |
|---|---|
| [`BOC2.0_Proposal_Submission.md`](file:///c:/Users/ADMIN/Desktop/BOC-2.0/BOC2.0_Proposal_Submission.md) | Complete 10-section proposal document |
| [`BOC2.0_Proposal/00_Overview_and_Ideas.md`](file:///c:/Users/ADMIN/Desktop/BOC-2.0/BOC2.0_Proposal/00_Overview_and_Ideas.md) | Strategy guide, key ideas, scoring targets |
| [`BOC2.0_Proposal/Section_03_Architecture_Diagram.md`](file:///c:/Users/ADMIN/Desktop/BOC-2.0/BOC2.0_Proposal/Section_03_Architecture_Diagram.md) | Detailed 5-layer architecture spec |
| [`BOC2.0_Proposal/Section_04_Technology_Choices.md`](file:///c:/Users/ADMIN/Desktop/BOC-2.0/BOC2.0_Proposal/Section_04_Technology_Choices.md) | Full tech stack justification |
| [`BOC2.0_Proposal/Section_06_Security_Privacy.md`](file:///c:/Users/ADMIN/Desktop/BOC-2.0/BOC2.0_Proposal/Section_06_Security_Privacy.md) | Security architecture deep dive |
| [`BOC2.0_Proposal/Section_07_Cost_Estimate.md`](file:///c:/Users/ADMIN/Desktop/BOC-2.0/BOC2.0_Proposal/Section_07_Cost_Estimate.md) | Detailed cost breakdown with formulas |
| [`BOC2.0_Proposal/Section_09_Monitoring_Observability.md`](file:///c:/Users/ADMIN/Desktop/BOC-2.0/BOC2.0_Proposal/Section_09_Monitoring_Observability.md) | Decision traces + monitoring spec |
| [`my-app/app/page.tsx`](file:///c:/Users/ADMIN/Desktop/BOC-2.0/my-app/app/page.tsx) | Main landing page (1,376 lines) |
| [`my-app/app/layout.tsx`](file:///c:/Users/ADMIN/Desktop/BOC-2.0/my-app/app/layout.tsx) | Navigation, header, footer |
| [`my-app/app/globals.css`](file:///c:/Users/ADMIN/Desktop/BOC-2.0/my-app/app/globals.css) | Design tokens, color palette |
| [`ui/`](file:///c:/Users/ADMIN/Desktop/BOC-2.0/ui) | 12 static HTML prototype screens |
