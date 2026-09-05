# BOC 2.0 — Proposal Cover Sheet
## Scenario 5: AI Agent Platform for Business Automation

---

## COVER SHEET (Fill in before submission)

- **Team Name:** ___________________________________
- **Scenario Chosen:** Scenario 5 — AI Agent Platform for Business Automation
- **Cloud Platform(s) Used:** GCP (Google Cloud Platform) — Primary platform
  - Fallback LLM: Anthropic Claude API (external, used only as LLM fallback)

---

## Team Members

| # | Full Name | Role in Team | University | Faculty | Email | Contact Number |
|---|-----------|-------------|------------|---------|-------|----------------|
| 1 | | Team Lead / Cloud Architect | | | | |
| 2 | | Backend Engineer / LLM Orchestration | | | | |
| 3 | | Security & Observability Lead | | | | |
| 4 | | Documentation & Diagrams | | | | |

(2–4 members per team, as per registration rules)

---

## Platform Name

**AgentForge**
*"Deploy intelligent agents. Own the results."*

---

## Proposal File Index

| File | Contents |
|------|----------|
| 00_Overview_and_Ideas.md | Master strategy guide, ideas, architecture summary |
| Section_01_Problem_Understanding.md | Section 1 — Problem Understanding |
| Section_02_Solution_Overview.md | Section 2 — Proposed Solution Overview |
| Section_03_Architecture_Diagram.md | Section 3 — Architecture Diagram description (use to draw your diagram) |
| Section_04_Technology_Choices.md | Section 4 — Technology Choices & Justification |
| Section_05_Scalability_Performance.md | Section 5 — Scalability & Performance |
| Section_06_Security_Privacy.md | Section 6 — Security, Privacy & Compliance |
| Section_07_Cost_Estimate.md | Section 7 — Cost Estimate |
| Section_08_Availability_Resilience.md | Section 8 — Availability & Resilience |
| Section_09_Monitoring_Observability.md | Section 9 — Monitoring & Observability |
| Section_10_Conclusion_Future.md | Section 10 — Conclusion & Future Improvements |
| COVER_SHEET.md | This file |

---

## Submission Checklist

- [ ] Cover sheet filled in (team name, members, emails)
- [ ] Architecture diagram created in draw.io / Lucidchart / Excalidraw (PNG + PDF)
- [ ] All 10 sections written in proposal report (max 5 pages)
- [ ] All tech choices have "why for this problem" justification
- [ ] Security section covers: who accesses what, encryption at rest + in transit, PII handling
- [ ] Cost section has actual dollar estimates
- [ ] Resilience section covers what happens when the LLM API fails
- [ ] Observability section explains per-decision traces
- [ ] Conclusion acknowledges honest limitations

---

## Quick Architecture Recap (for the 5-page report)

Platform: AgentForge on GCP

Key services and their role:
- Apigee: multi-tenant API gateway, rate limiting, metering
- Cloud Run: stateless, auto-scaling compute for all services
- Vertex AI Gemini: primary LLM (Flash for simple, Pro for complex)
- Vertex AI Vector Search: tenant-isolated RAG memory stores
- Memorystore (Redis): semantic response cache, 25-40% cost saving
- Firestore: agent configs + conversation history
- Secret Manager: tenant-namespaced tool credentials
- Cloud Pub/Sub: async audit logging + human escalation queue
- Cloud Logging + BigQuery: immutable per-decision audit trail
- Cloud Trace: distributed request tracing
- Cloud Monitoring: dashboards, anomaly alerts, PagerDuty integration

3 depth focus areas:
1. Safe tool-calling with 3-layer guardrails (input classifier → output validator → human escalation)
2. Tenant-isolated RAG memory (separate vector index per tenant, top-K retrieval)
3. Per-decision audit traces (every step logged: prompt, retrieved context, tool call, output)

Pilot cost: ~$158/month for 10 tenants, ~15,000 conversations/month (~$0.0106/conversation)
