# Section 6 — Security, Privacy & Compliance

## Team: [Your Team Name]
## Scenario: 5 — AI Agent Platform for Business Automation

---

## Overview

An AI agent platform handles some of the most sensitive data in enterprise software:
- Businesses' internal system credentials (API keys for their CRM, database, helpdesk)
- End-users' personal information and support queries
- Agent conversations that may include financial, medical, or personal details
- The businesses' proprietary knowledge base documents

A breach in any of these categories would be catastrophic — both for the affected business and for the platform's reputation. This section describes our concrete security architecture, not aspirational goals.

---

## 1. Multi-Tenant Data Isolation

### The Risk
The most dangerous failure mode in a multi-tenant AI platform is "data bleed" — one tenant's data appearing in another tenant's agent responses. This could happen if:
- Vector search queries are not scoped to the requesting tenant's index
- Conversation histories are stored in a shared collection with insecure queries
- The LLM's context window inadvertently includes retrieved chunks from another tenant

### How We Prevent It

**Structural separation (not just policy-based):**
- Each tenant has a **separate Pinecone namespace** with SHA-256 prefix isolation — there is no shared namespace to accidentally query across tenants
- Firebase Firestore uses the path `/tenants/{tenantId}/...` — a Cloud Run service for Tenant A literally cannot construct a valid path to Tenant B's data
- AWS SSM Parameter Store uses path-based namespacing: `/agentforge/{tenantId}/tools/{toolName}/apiKey` — Tenant A's IAM policy only allows reads under its own tenantId prefix
- Cloud Run services receive the tenantId as a verified, gateway-injected header — they never trust a tenantId from the request body (which could be spoofed)

**Query-time enforcement:**
- Every Firestore query includes a `.where('tenantId', '==', verifiedTenantId)` filter — even if the path structure already isolates the data, the filter adds a defense-in-depth layer
- Pinecone queries specify the tenant's namespace explicitly in the API call — it is structurally impossible to retrieve vectors from a different namespace

**Testing:**
- Our test suite includes "cross-tenant bleed tests": mock requests from Tenant A attempting to access Tenant B's data at every layer, verifying 403 Forbidden at each boundary

---

## 2. Encryption

### Data In Transit
- All external communication (end-user browser to Apigee, business admin browser to admin API) uses **TLS 1.3 exclusively** — TLS 1.2 is disabled
- All internal GCP service-to-service communication uses **Google's internal encrypted network** (automatic mTLS via Cloud Run service mesh)
- External tool API calls from Tool Executor to third-party APIs: TLS 1.2 minimum enforced; connections to endpoints without valid certificates are rejected

### Data At Rest
- Firebase Firestore: AES-256 encryption at rest (GCP default, Google-managed keys)
- Pinecone indexes: encrypted at rest (Pinecone platform default, AES-256)
- AWS CloudWatch Logs and AWS DynamoDB: AES-256 encryption at rest (AWS default, KMS-managed)
- AWS SSM Parameter Store: secrets encrypted with **AWS KMS customer-managed keys** — this means even AWS cannot read the secrets without the tenant's KMS key

### Encryption Key Management
- Platform-level encryption uses provider-managed keys (GCP GMK, AWS KMS) — adequate for most data
- Tenant API credentials (tool keys) use **AWS KMS Customer-Managed Keys** via SSM Parameter Store — each tenant can optionally bring their own KMS key, meaning only they can decrypt their secrets

---

## 3. Authentication & Authorization

### End User to Platform
- End users authenticate to their business's agent via the business-issued API key or JWT
- The business controls who gets this key — AgentForge does not manage end-user identities
- All tokens have a maximum 24-hour TTL; refresh tokens are rotated on each use

### Business Admin to Dashboard
- Business admins authenticate via **Google OAuth 2.0** or SAML SSO for enterprise customers
- MFA is enforced for all admin accounts — no exceptions
- Admin sessions are logged to **AWS CloudWatch** (admin activity logs) — every configuration change, key rotation, and approval action is attributable to a specific admin identity

### Service-to-Service (Internal)
- All Cloud Run services use **dedicated service accounts** with minimal IAM permissions (principle of least privilege)
- Example: The Memory Layer service account can: read Pinecone (via API key), read/write its own Firebase Firestore path, write to AWS CloudWatch. It cannot: access AWS SSM Parameter Store, call Gemini LLM directly (only via orchestration), or write to any other tenant's Firestore path
- No service uses the default compute service account (which has overly broad permissions)
- Service accounts are **Workload Identity Federation** bound to specific Cloud Run service identities — credentials cannot be exported or used outside the service

---

## 4. PII Handling

### The Problem
End users frequently include personal information in their messages to agents — phone numbers, email addresses, order IDs, sometimes partial payment card details. This data must not:
- Be stored in plaintext in logs
- Be sent to LLMs unnecessarily (third-party LLMs should see as little PII as possible)
- Persist beyond what is necessary

### Our Approach

**PII Detection & Scrubbing (in Guardrails Pipeline):**
- Before sending any user message to the LLM, the Guardrails Pipeline runs a **PII classifier** (regex + a lightweight NER model) that detects:
  - Email addresses
  - Phone numbers
  - Credit card numbers (PAN)
  - Social security / national ID numbers
  - Full names (when combined with other identifiers)
- Detected PII is replaced with a placeholder token before the message reaches the LLM: "My email is [EMAIL_REDACTED]"
- The original value is stored separately in Firestore (per-session, encrypted at rest with CMEK) so the Tool Executor can retrieve it if the agent genuinely needs it (e.g., to look up an order by email)

**Log Sanitization:**
- AWS CloudWatch audit traces do NOT include raw user message text — they include the scrubbed version and a reference to the secure PII store
- AWS DynamoDB audit tables contain only scrubbed messages; PII lookups require a separate privileged query with explicit access justification

**Data Minimization:**
- Conversation histories are retained for 90 days by default, then automatically deleted via Firestore TTL policies
- Businesses can configure a shorter retention period (e.g., 7 days for high-sensitivity contexts)
- Vector search indexes only contain knowledge base documents, not conversation history — conversations are never embedded and stored in vector search

---

## 5. Tool Execution Security

### The Risk
If an agent can call external APIs, a compromised or misbehaving agent could:
- Exfiltrate data to an attacker-controlled URL
- Trigger destructive actions (bulk delete, mass email send)
- Use the Tool Executor as a proxy to attack internal systems

### How We Prevent It

**Allowlist-only tool configuration:**
- Businesses define exactly which tools their agent can call, with specific allowed HTTP methods and URL patterns
- Example: `{ "tool": "helpdesk", "allowed_url": "https://api.zendesk.com/v2/tickets", "allowed_methods": ["GET", "POST"] }`
- The Tool Executor validates every call against this allowlist — calls to URLs not on the list are blocked unconditionally

**Network egress restrictions:**
- Tool Executor Cloud Run instances run with a **VPC Service Controls perimeter** that blocks outbound traffic to private IP ranges (10.x.x.x, 172.16.x.x, 192.168.x.x) — preventing SSRF attacks against internal GCP services
- Only HTTPS (port 443) outbound traffic is allowed

**Schema validation before execution:**
- The LLM's tool call output is a JSON object specifying the tool name, endpoint, and parameters
- Before execution, this JSON is validated against the tool's pre-defined schema (JSON Schema validation)
- If the LLM hallucinates a parameter that doesn't exist in the schema, the call is rejected and the LLM is asked to retry with a correction prompt

**High-risk action gate:**
- Tools marked as "high-risk" by the business admin (e.g., refund_customer, delete_record, send_email_to_all) require human approval before execution
- The Tool Executor publishes the pending call to the Human Approval Queue (**AWS SQS**) and writes the escalation to **Firebase Firestore** `escalations` collection
- The call is only executed after explicit admin approval via `PATCH /api/escalation`

---

## 6. Access to Audit Logs

- Business admins can view their own tenant's audit logs via the dashboard
- They cannot view other tenants' logs — enforced via **AWS CloudWatch** log-based access conditions tied to `tenant_id` field
- Platform Ops can view all tenants' logs for incident response — all such access is itself logged (who accessed what, when, with what justification)
- Audit logs in **AWS DynamoDB** are immutable: the service account that writes traces has PutItem-only permissions; no service can UpdateItem or DeleteItem on audit log rows

---

## 7. Compliance Posture

| Requirement          | How We Address It                                                      |
|----------------------|------------------------------------------------------------------------|
| GDPR Right to Erasure | Per-tenant data deletion pipeline: deletes Firestore docs, removes Pinecone namespace vectors, purges CloudWatch logs older than 30 days via API |
| Data Residency       | GCP region selection (Cloud Run, Firestore) + AWS region selection (SQS, DynamoDB) at tenant onboarding; data stays in chosen regions |
| Audit Trail          | Immutable AWS CloudWatch + DynamoDB; all admin actions are logged       |
| Incident Response    | CloudWatch alert → PagerDuty → on-call engineer within 15 min         |
| Vulnerability Management | GCP Security Command Center active for Cloud Run; AWS Security Hub for AWS services |

---

## Security Summary

The key principle throughout our security design is **defense in depth with structural enforcement**: wherever possible, security is enforced by the infrastructure's structure (separate indexes, path-based namespacing, allowlist-only tooling) rather than relying solely on application-level checks that could be bypassed by a code bug. Policy-level controls (IAM, network rules) add additional layers on top of structural controls, and logging ensures that any anomaly is detectable.
