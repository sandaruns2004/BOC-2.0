
# File: Autonomous_Enterprise_Operations_Control_Plane.md

``markdown
# Autonomous Enterprise Operations Control Plane

## Working Project Name

**Aegis Control Plane**

### Tagline
> **The operating system for autonomous enterprise workers.**

### Core Positioning

Aegis is a cloud-native control plane for deploying, governing, monitoring, and recovering autonomous AI agents operating across enterprise systems.

The core idea is **bounded autonomy**: AI agents should be able to act autonomously, but they should never receive uncontrolled authority over enterprise data, systems, money, or other agents.

---

# 1. Problem Statement

Businesses are beginning to deploy AI agents that do more than answer questions. These agents can research information, modify records, send emails, create transactions, call APIs, delegate tasks, and execute multi-step workflows.

As organizations move from a few experimental agents to hundreds or thousands of autonomous agents, a new infrastructure problem appears:

> **How can an enterprise safely operate large numbers of autonomous AI workers across critical business systems without losing control of permissions, data, decisions, cost, accountability, or recovery?**

A normal chatbot architecture is not sufficient.

Aegis treats AI agents as **autonomous distributed workloads that require identity, authorization, policy enforcement, runtime isolation, observability, risk management, and incident response**.

---

# 2. Why This Is Bigger Than an AI Agent Platform

A generic AI-agent platform usually focuses on:

- Calling an LLM
- Giving the model tools
- Adding RAG/memory
- Running workflows

Aegis focuses on the harder enterprise problem surrounding those agents:

- Who is this agent?
- What is it allowed to do?
- Who authorized it?
- Can it delegate authority?
- What data can it access?
- How much money can it spend?
- What happens when its behavior becomes abnormal?
- How do we stop it immediately?
- What systems and records could it affect?
- Can we reconstruct exactly what happened?
- Can we safely recover from an incident?
- Can one tenant's agents affect another tenant?
- How do we prevent runaway AI costs?

This makes Aegis closer to an **enterprise AI operating/control plane** than a chatbot application.

---

# 3. Main Architectural Thesis: Bounded Autonomy

The central design principle is:

> **Give agents enough authority to complete goals, but never enough authority to cause uncontrolled damage.**

Every agent operates under an explicit and dynamically evaluated authority boundary.

```text
                 AGENT
                   │
          ┌────────▼────────┐
          │ AUTHORITY CARD  │
          ├─────────────────┤
          │ Identity        │
          │ Permissions     │
          │ Data access     │
          │ Budget          │
          │ Time limit      │
          │ Risk limit      │
          │ Delegation      │
          └────────┬────────┘
                   │
                   ▼
             ACTION REQUEST
                   │
          ┌────────▼────────┐
          │ POLICY ENGINE   │
          └────────┬────────┘
                   │
          ┌────────▼────────┐
          │ RISK ENGINE     │
          └────────┬────────┘
                   │
             ┌─────┴─────┐
             │           │
          ALLOW       APPROVAL
             │           │
             └─────┬─────┘
                   ▼
             TOOL GATEWAY
                   │
                   ▼
             ENTERPRISE API
```

The AI agent makes a decision, but the **control plane owns the authority to execute the action**.

---

# 4. Core Enterprise Scenario

Aegis can be demonstrated with an autonomous Finance Agent.

### Example user goal

> “Process all pending supplier invoices and pay the approved ones.”

The agent may:

1. Retrieve pending invoices.
2. Identify suppliers.
3. Check invoice details.
4. Retrieve relevant company policies.
5. Verify supplier information.
6. Calculate payment amounts.
7. Classify each action by risk.
8. Execute low-risk payments automatically.
9. Request approval for medium-risk transactions.
10. Block critical-risk transactions.
11. Verify the result.
12. Record the complete audit trail.

Example policy:

```text
Payment ≤ $2,500       → autonomous execution
$2,500–$10,000        → enhanced verification / approval
> $10,000             → human approval
Suspicious supplier   → BLOCK
Unusual volume        → QUARANTINE
```

This scenario demonstrates autonomy, tool calling, policy enforcement, human oversight, security, observability, and recovery in one flow.

---

# 5. Six Major Architecture Planes

Aegis is divided into six logical planes.

## 5.1 Identity Plane

Responsible for agent and user identity.

Components:

- Agent identity
- User identity
- Service identity
- Credential management
- Authentication
- Role/attribute information
- Delegation credentials
- Tenant identity

Every agent should have an identity comparable to a service account.

---

## 5.2 Execution Plane

Runs autonomous agents and long-running workflows.

Components:

- Agent runtime
- Planner
- Task executor
- Workflow engine
- Event-driven execution
- Retry handling
- State management
- Agent lifecycle management
- Model router
- Memory access

Long-running agent jobs should not depend on one synchronous HTTP request remaining alive.

A workflow can pause for approval and resume later.

---

## 5.3 Knowledge Plane

Provides agents with relevant business knowledge without sending entire organizational histories to the model.

Layers:

```text
SHORT-TERM MEMORY
Current task / conversation
        │
        ▼
EPISODIC MEMORY
Important previous interactions
        │
        ▼
KNOWLEDGE MEMORY
Documents / policies / manuals / enterprise data
```

Capabilities:

- Vector search
- Semantic retrieval
- Document indexing
- Conversation memory
- Episodic memory
- Knowledge-base access
- Tenant-scoped retrieval

All retrieval must respect tenant and authorization boundaries.

---

## 5.4 Policy Plane

Controls what agents are permitted to do.

Components:

- Policy engine
- Permission engine
- Authority manager
- Risk engine
- Budget manager
- Approval engine
- Data access policy
- Action restrictions

Example policy:

```text
SalesAgent
    Can read CRM
    Can create opportunities
    Can draft emails
    Cannot modify contracts
    Cannot issue refunds
```

---

## 5.5 Trust & Safety Plane

Prevents unsafe, incorrect, or unexpected autonomous behavior.

Components:

- Input validation
- Output validation
- Risk scoring
- Policy enforcement
- Human approval
- Action verification
- Anomaly detection
- Agent quarantine
- Credential revocation
- Incident response
- Optional simulation / digital twin

---

## 5.6 Observability Plane

Provides complete visibility into agent behavior.

Components:

- Distributed traces
- Execution graphs
- Audit logs
- Metrics
- Cost tracking
- Agent evaluation
- Incident timelines
- Replay
- Alerts
- Blast-radius analysis

Aegis should answer not only **what happened**, but also **why it happened**.

---

# 6. Agent Lifecycle

Aegis manages the full lifecycle of an autonomous agent.

```text
CREATE
  ↓
CONFIGURE
  ↓
AUTHORIZE
  ↓
DEPLOY
  ↓
RUN
  ↓
MONITOR
  ↓
EVALUATE
  ↓
RESTRICT / UPDATE
  ↓
SUSPEND / REVOKE
  ↓
RETIRE
```

Agent versions should be tracked so the platform can compare behavior between versions and safely roll out updates.

---

# 7. Authority Card

Every agent receives an explicit authority definition.

Example:

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

This authority can change dynamically.

Example:

```text
Normal state
    ↓
FinanceAgent may approve ≤ $2,500

Suspicious behavior
    ↓
Limit reduced to $100

Security incident
    ↓
READ-ONLY

Confirmed compromise
    ↓
CREDENTIALS REVOKED
```

---

# 8. Risk-Aware Action Engine

Not all agent actions have the same risk.

Example classification:

```text
Read CRM                         → LOW
Search documents                → LOW
Draft email                     → LOW
Update customer record          → MEDIUM
Create contract                 → HIGH
Send external email             → HIGH
Issue refund                    → HIGH
Delete records                  → CRITICAL
Large financial transaction     → CRITICAL
```

A conceptual risk model:

```text
Risk Score =
    Action sensitivity
  + Data sensitivity
  + Financial impact
  + User/agent authority
  + Agent confidence
  + Behavioral anomaly
  + Contextual factors
```

Example response:

```text
Risk < 30
→ Execute automatically

30–70
→ Enhanced verification

70–90
→ Human approval

> 90
→ Block
```

Thresholds should be configurable per tenant and business domain.

---

# 9. Agent Firewall

The **Agent Firewall** is one of the central Aegis components.

Every meaningful external action passes through it.

```text
                 AGENT FIREWALL

      ┌──────────────────────────┐
      │ Identity                 │
      │ Tenant                   │
      │ Permission               │
      │ Data classification      │
      │ Risk score               │
      │ Rate limit               │
      │ Budget                   │
      │ Behavioral anomaly       │
      │ Human approval           │
      └────────────┬─────────────┘
                   │
               ALLOW/BLOCK
```

The firewall creates a control boundary between autonomous reasoning and real-world side effects.

---

# 10. Tool Gateway

Agents should **never directly access enterprise APIs**.

All tool use passes through the Tool Gateway.

```text
Agent
 ↓
Tool Gateway
 ↓
Identity verification
 ↓
Tenant verification
 ↓
Permission check
 ↓
Policy check
 ↓
Risk check
 ↓
Parameter validation
 ↓
Enterprise API
```

Possible tools:

```text
search_web()
search_documents()
get_customer()
update_customer()
create_invoice()
issue_refund()
send_email()
create_ticket()
schedule_meeting()
create_payment()
```

Each tool has its own contract.

Example:

```text
Tool: issue_refund

Allowed agents: FinanceAgent
Maximum amount: $500
Approval required: > $100
Tenant scope: Current tenant only
Audit: Mandatory
```

---

# 11. Agent-to-Agent Delegation

Agents may delegate work, but delegation must not silently transfer unrestricted authority.

Example:

```text
SalesAgent
    │
    │ restricted delegation
    ▼
ResearchAgent
```

SalesAgent may have:

```text
CRM access
Create opportunities
Draft outreach
```

But ResearchAgent may receive only:

```text
Public web search
Document research
```

ResearchAgent must NOT inherit:

```text
CRM write access
Email sending
Financial permissions
Contract modification
```

This creates a **least-privilege delegation model for autonomous AI**.

A delegation token should contain:

- Delegating agent
- Receiving agent
- Allowed actions
- Allowed resources
- Maximum duration
- Maximum delegation depth
- Data restrictions
- Budget restrictions

---

# 12. Dynamic Authorization

Authorization should respond to runtime conditions.

An agent that behaves normally can receive broader authority.

An agent showing unusual behavior can automatically have its authority reduced.

```text
Behavior monitoring
       ↓
Risk increases
       ↓
Authority reduced
       ↓
Restricted execution
       ↓
Potential quarantine
```

This turns authorization into an adaptive control mechanism rather than a static role assignment.

---

# 13. Behavioral Monitoring

Traditional monitoring looks at infrastructure metrics such as CPU and memory.

Aegis also monitors **agent behavior**.

Example normal profile:

```text
20–40 CRM reads/hour
5–15 email drafts/hour
0–2 record updates/hour
```

Observed behavior:

```text
8,000 CRM reads
2,400 record updates
900 emails
```

The system detects a behavioral anomaly.

```text
Behavior anomaly
      ↓
Risk score increases
      ↓
Agent Firewall activates
      ↓
Authority reduced
      ↓
Agent suspended
      ↓
Incident created
```

This is effectively **runtime security for AI agents**.

---

# 14. Incident Response

Aegis should include an AI-specific incident response process.

Example:

```text
Agent anomaly detected
      ↓
Freeze agent
      ↓
Revoke credentials
      ↓
Stop queued actions
      ↓
Quarantine dependent agents
      ↓
Identify affected resources
      ↓
Create incident
      ↓
Generate explanation
      ↓
Rollback reversible actions
```

The system should preserve the full event history needed for investigation.

---

# 15. Blast Radius Analysis

When an agent becomes compromised or behaves abnormally, Aegis should calculate the potential impact.

Example:

```text
Compromised Agent
       │
       ├── 3 tools
       ├── 2 databases
       ├── 4 downstream agents
       ├── 182 pending jobs
       └── 27 affected records
```

The platform should visualize:

- Directly affected resources
- Downstream agents
- Queued actions
- Connected tools
- Accessible data
- Financial exposure
- Potential tenant impact

This helps security teams contain incidents quickly.

---

# 16. Human-in-the-Loop Approval

High-risk actions should not be forced into all-or-nothing automation.

Example:

```text
Agent creates payment
       ↓
Risk Engine
       ↓
HIGH RISK
       ↓
Human approval request
       ↓
Manager reviews
       ↓
APPROVE / REJECT
       ↓
Tool Gateway
       ↓
Execute
```

Approval requests should show:

- Requested action
- Agent identity
- Reason / goal
- Data used
- Risk score
- Policy that triggered approval
- Expected impact
- Proposed API operation
- Relevant trace

---

# 17. Simulation / Digital Twin

For critical actions, Aegis can optionally simulate the operation before execution.

```text
High-risk action
      ↓
Digital Twin / Simulation
      ↓
Predict consequences
      ↓
Calculate risk
      ↓
Human / policy decision
      ↓
Real execution
```

Example:

> Delete 4,200 customer records.

Simulation result:

```text
4,200 records affected
12 downstream workflows affected
3 reports affected
2 agents depend on affected records

Risk = CRITICAL

→ BLOCK
```

This creates a **simulate-before-execute** safety model for high-impact actions.

---

# 18. Long-Running Autonomous Workflows

Aegis should support workflows lasting minutes or hours.

Example:

```text
Goal created
   ↓
Event bus
   ↓
Planner
   ↓
Task 1
   ↓
Task 2
   ↓
Human approval
   ↓
Resume
   ↓
Task 3
   ↓
Verification
   ↓
Completion
```

This should use durable workflow/event mechanisms rather than a single long-lived API request.

---

# 19. Model Router

LLM inference cost can grow rapidly as the number of agents increases.

Aegis should choose models based on task complexity.

```text
Task
 ↓
Complexity classifier
 ↓
Model Router
 ├── Fast / low-cost model
 ├── General model
 └── Reasoning / high-capability model
```

Examples:

```text
Simple classification      → cheap model
Simple summarization       → cheap / medium model
Document analysis          → medium model
Complex multi-step planning → reasoning model
```

The router can consider:

- Task complexity
- Required latency
- Expected quality
- Tenant budget
- Agent priority
- Token history
- Model health/availability

---

# 20. Cost Governance

Aegis should treat AI spending as a first-class resource.

Budget hierarchy:

```text
Tenant budget
     ↓
Agent budget
     ↓
User budget
     ↓
Task budget
     ↓
Token budget
```

Example responses to excessive usage:

```text
Budget healthy
→ Normal execution

Budget approaching limit
→ Prefer cheaper models

Budget near limit
→ Rate limit / reduce concurrency

Budget exceeded
→ Pause or block non-critical work
```

Track:

- Tokens
- Inference cost
- Cost per task
- Cost per tenant
- Cost per agent
- Tool-call cost
- Cost trends
- Failed/duplicate work

---

# 21. Multi-Tenant Architecture

Aegis is designed as a multi-tenant enterprise platform.

```text
Platform
 │
 ├── Tenant A
 │    ├── Users
 │    ├── Agents
 │    ├── Policies
 │    ├── Data
 │    └── Budget
 │
 ├── Tenant B
 │    ├── Users
 │    ├── Agents
 │    ├── Policies
 │    ├── Data
 │    └── Budget
 │
 └── Tenant C
      ├── Users
      ├── Agents
      ├── Policies
      ├── Data
      └── Budget
```

Every request and event should carry strong context such as:

```text
tenant_id
user_id
agent_id
execution_id
trace_id
```

Isolation must apply to:

- Identity
- Data
- Vector search
- Runtime workloads
- Secrets
- Queues
- Caches
- Observability
- Usage and billing

A traffic spike or runaway agent in Tenant A should not degrade Tenant B.

---

# 22. Tenant-Scoped Retrieval

Every knowledge retrieval operation must be tenant-aware.

Conceptually:

```sql
SELECT *
FROM knowledge
WHERE tenant_id = current_tenant
  AND ...relevance conditions...;
```

Authorization must be applied before retrieval results reach the agent.

Tenant identity must not be inferred solely from user-supplied values.

---

# 23. Agent Sandbox

Agents that need code execution should not execute arbitrary code directly on the main application server.

Use isolated execution environments.

```text
Agent
 ↓
Sandbox
 ↓
Temporary isolated environment
 ↓
Execute
 ↓
Collect result
 ↓
Destroy
```

Restrictions can include:

- CPU limits
- Memory limits
- Runtime timeout
- Network restrictions
- Temporary filesystem
- No unrestricted host access
- Short-lived credentials
- No permanent secrets

---

# 24. Observability and Execution Graph

Every agent execution should produce a structured trace.

Example:

```text
Request #83921

User Goal
   ↓
Supervisor
   ↓
Retrieved 7 memories
   ↓
CRM.search()
   ↓
Tool result
   ↓
Planner decision
   ↓
Risk score: 62
   ↓
Human approval
   ↓
send_email()
   ↓
Success
```

For each step record:

- Prompt/input
- Model
- Model version
- Retrieved context
- Tool invoked
- Tool parameters
- Tool result
- Decision
- Policy result
- Risk score
- Approval state
- Latency
- Token usage
- Cost
- Timestamp
- Actor / agent identity
- Trace and execution IDs

---

# 25. Agent Replay and Debugging

One of the strongest platform features is **execution replay**.

When an agent makes a mistake, an administrator can inspect the exact execution path.

```text
Input
 ↓
Retrieval
 ↓
Model decision
 ↓
Tool call
 ↓
Tool response
 ↓
Next decision
 ↓
Policy evaluation
 ↓
Final action
```

The platform should support:

- Replay of previous executions
- Compare agent versions
- Compare policy versions
- Identify where behavior diverged
- Reproduce failures where possible
- Inspect model/tool/context combinations

Example:

```text
Agent v1.4
vs.
Agent v1.5
```

This is critical for testing and trust.

---

# 26. Agent Self-Evaluation

After completing a task, an evaluation layer can assess the result.

```text
Agent executes
      ↓
Evaluator
      ↓
Goal achieved?
      ↓
Policy violated?
      ↓
Evidence sufficient?
      ↓
Unnecessary tools?
      ↓
Quality score
```

Possible metrics:

```text
Task success
Factual accuracy
Policy compliance
Tool efficiency
Cost efficiency
Human intervention rate
```

Aegis can store these results to support continuous improvement.

---

# 27. AI Operations Command Center

The primary administrative dashboard should resemble an enterprise operations/security center rather than a chatbot screen.

Example:

```text
┌───────────────────────────────────────────────┐
│ AI OPERATIONS CENTER                         │
├───────────────────────────────────────────────┤
│                                               │
│ Active Agents          842                    │
│ Running Tasks          3,921                  │
│ Blocked Actions          47                   │
│ Human Approvals         128                   │
│ Today's AI Cost       $1,824                  │
│                                               │
├───────────────────────────────────────────────┤
│ SECURITY                                      │
│                                               │
│ ● 3 High Risk Agents                          │
│ ● 17 Policy Violations                        │
│ ● 2 Active Incidents                          │
│                                               │
├───────────────────────────────────────────────┤
│ AGENT ACTIVITY                                │
│                                               │
│ SalesAgent        ● Running                   │
│ FinanceAgent      ● Running                   │
│ SupportAgent      ● Running                   │
│ ResearchAgent     ⚠ Restricted                │
│                                               │
└───────────────────────────────────────────────┘
```

Agent detail view:

```text
Agent: FinanceAgent

Authority        ████████████░░ 82%
Risk             LOW → MEDIUM
Cost today       $43.18
Actions          4,821
Blocked          31
Delegations      6
```

---

# 28. Execution Graph UI

Every autonomous goal should be explorable visually.

```text
User Goal
   │
   ▼
Supervisor
   │
   ├──────────► ResearchAgent
   │                 │
   │                 ▼
   │             Web Search
   │
   ├──────────► CRM Agent
   │                 │
   │                 ▼
   │              CRM API
   │
   ▼
Email Agent
   │
   ▼
Risk Engine
   │
   ▼
Human Approval
   │
   ▼
Email Sent
```

Clicking any node should reveal the relevant trace, model, context, policies, risk decisions, and tool interactions.

---

# 29. Reference End-to-End Flow

```text
                 BUSINESS GOAL
                       │
                       ▼
                AGENT ORCHESTRATOR
                       │
                 ┌─────┴─────┐
                 ▼           ▼
             MEMORY/RAG   MODEL ROUTER
                 │           │
                 └─────┬─────┘
                       ▼
                  PLAN ACTION
                       │
                       ▼
                 AGENT FIREWALL
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
        POLICY ENGINE         RISK ENGINE
             │                   │
             └─────────┬─────────┘
                       ▼
                APPROVAL CHECK
                  │         │
                ALLOW     APPROVE
                  │         │
                  └────┬────┘
                       ▼
                  TOOL GATEWAY
                       │
                       ▼
               ENTERPRISE SYSTEM
                       │
                       ▼
                 VERIFY RESULT
                       │
              ┌────────┴────────┐
              ▼                 ▼
          AUDIT / TRACE      NEXT TASK
                                │
                                └──→ LOOP
```

---

# 30. High-Level Cloud Architecture

A cloud implementation can use AWS, Azure, GCP, or a justified combination. The architecture should explain **why each capability is needed**, not simply list services.

A possible AWS-oriented mapping is:

```text
Users / Applications
        ↓
CDN / WAF
        ↓
API Gateway
        ↓
Identity + Tenant Layer
        ↓
Agent Control Plane
        ↓
Event / Queue Infrastructure
        ↓
Agent Runtime / Workflow Engine
        ↓
Managed LLM / Agent Runtime
        ↓
Memory / RAG / Vector Store
        ↓
Agent Firewall
        ↓
Tool Gateway
        ↓
Enterprise Systems
```

Supporting capabilities can include:

```text
Relational database
Object storage
Vector search
Event bus
Message queues
Cache
Secrets management
Encryption/key management
Identity and access control
Monitoring/logging
Audit trails
```

The final competition proposal should select a focused set of services and justify each one based on the actual workload.

---

# 31. Reliability and Failure Handling

Autonomous systems must assume components will fail.

Important mechanisms:

- Retries with backoff
- Idempotency
- Dead-letter queues
- Timeouts
- Circuit breakers
- Workflow checkpoints
- Durable state
- Graceful degradation
- Rate limiting
- Backpressure
- Regional failover where justified
- Duplicate-action prevention

For example:

```text
Payment request
 ↓
Network timeout
 ↓
Retry?
 ↓
Idempotency check
 ↓
Prevent duplicate payment
```

This is especially important for financial or irreversible operations.

---

# 32. Security Model

Security should not be described only as generic “encryption and IAM.”

The architecture should explicitly enforce:

### Zero-trust principles

Never trust an agent merely because it is inside the platform.

### Least privilege

Agents receive only the minimum permissions needed for the current task.

### Short-lived credentials

Prefer temporary credentials over permanent API keys.

### Tenant isolation

No agent can directly cross tenant boundaries.

### Action-level authorization

Authorization is checked for each side-effecting action.

### Data classification

Agents should not access data above their allowed classification.

### Auditability

All important actions are traceable to identity, policy, and execution context.

---

# 33. Important Security Questions the Platform Should Answer

For every action:

```text
WHO?
Which agent / user / service identity?

WHAT?
Which action was requested?

WHY?
Which goal or workflow caused it?

WITH WHAT AUTHORITY?
Which policy granted permission?

ON WHAT DATA?
Which enterprise information was used?

WITH WHAT RISK?
What risk score was calculated?

WHO APPROVED IT?
Was human approval required?

WHAT HAPPENED AFTERWARD?
What was the outcome?
```

These questions form the basis of enterprise trust.

---

# 34. Example Incident

### Normal behavior

FinanceAgent usually processes:

```text
50–100 invoices/day
```

### Attack / failure scenario

The agent suddenly attempts:

```text
5,000 payments
in 2 minutes
```

Aegis detects:

```text
Behavior anomaly
       ↓
Risk increases
       ↓
Agent authority reduced
       ↓
New payment requests blocked
       ↓
Credentials revoked
       ↓
Agent quarantined
       ↓
Downstream workflows inspected
       ↓
Incident generated
```

Dashboard:

```text
INCIDENT #4912

Agent: FinanceAgent
Severity: CRITICAL

Reason:
Abnormal payment volume detected

Potential exposure:
$1.8M

Actions blocked:
4,912

Affected resources:
2 payment APIs
1 database
3 downstream agents
```

This is a strong demonstration of autonomous security and containment.

---

# 35. Prototype Scope for a Competition

Do **not** attempt to fully implement every part of the architecture.

A focused prototype should demonstrate one complete vertical slice.

## Recommended prototype

### Finance Agent

```text
User goal
   ↓
Finance Agent
   ↓
Retrieve invoices
   ↓
Retrieve company policy
   ↓
Verify suppliers
   ↓
Calculate payment
   ↓
Risk evaluation
   ↓
 ┌────────────────────────────┐
 │ Low risk  → auto execute   │
 │ Medium    → human approval │
 │ Critical  → block          │
 └────────────────────────────┘
   ↓
Tool Gateway
   ↓
Payment system mock/API
   ↓
Verify result
   ↓
Audit + trace
```

## Then demonstrate an attack/failure

Make the agent suddenly attempt many abnormal transactions.

Show:

```text
Anomaly detected
      ↓
Authority reduced
      ↓
Agent frozen
      ↓
Actions blocked
      ↓
Incident generated
      ↓
Blast radius shown
```

This single demo communicates most of the platform's core ideas.

---

# 36. What to Build vs. What to Simulate

## Build deeply

- Agent orchestration
- Authority model
- Policy engine
- Risk scoring
- Tool gateway
- Tenant isolation
- Approval flow
- Execution trace
- Agent monitoring
- Incident handling

## Simulate or simplify

- Large enterprise ERP integrations
- Production-scale LLM inference
- Real banking/payment rails
- Global multi-region disaster recovery
- Hundreds of physical agents
- Massive enterprise datasets

The architecture should clearly distinguish implemented prototype components from proposed production components.

---

# 37. Suggested Demo Story

### Act 1 — Normal autonomy

User asks:

> “Process approved supplier invoices.”

The agent autonomously retrieves data, reasons over policy, and performs low-risk actions.

### Act 2 — Controlled autonomy

One transaction exceeds the automatic authority limit.

The platform requests human approval.

### Act 3 — Dangerous behavior

The agent begins generating unusual payment activity.

The behavior monitor detects the anomaly.

### Act 4 — Containment

Aegis automatically:

- Reduces authority
- Blocks additional actions
- Revokes credentials
- Quarantines the agent
- Generates an incident

### Act 5 — Investigation

The operator opens the execution graph and sees:

```text
Goal
 ↓
Agent reasoning
 ↓
Retrieved information
 ↓
Tool calls
 ↓
Risk decision
 ↓
Abnormal behavior
 ↓
Containment
```

### Act 6 — Recovery

The operator can identify the blast radius and replay/review the execution history.

This is far more compelling than a basic “look, our AI can send an email” demo.

---

# 38. Main Differentiators

Aegis should emphasize these differentiators:

### 1. Bounded autonomy

Agents can act independently while operating inside explicit authority boundaries.

### 2. Dynamic authority

Permissions can change based on task context and runtime behavior.

### 3. Agent Firewall

Every high-impact action is evaluated before reaching enterprise systems.

### 4. Secure delegation

Agents can delegate work without automatically transferring their full authority.

### 5. Behavioral security

The system detects anomalous agent behavior, not only infrastructure failures.

### 6. AI incident response

Agents can be frozen, quarantined, revoked, and investigated like distributed workloads.

### 7. Blast-radius analysis

Security teams can understand the potential impact of an agent failure or compromise.

### 8. Replayable execution

Every important agent decision can be reconstructed and investigated.

### 9. Cost-aware autonomy

Model selection, budgets, and rate limits prevent uncontrolled inference spending.

### 10. Multi-tenant isolation

Agents, data, budgets, and workloads are separated between organizations.

---

# 39. Positioning for Beauty of Cloud 2.0 — Scenario 5

The solution should not be described as:

> “An AI chatbot for businesses.”

It should not even be described simply as:

> “An AI agent platform.”

The stronger positioning is:

> **A secure cloud control plane for deploying, governing, observing, and recovering autonomous AI workers operating across enterprise infrastructure.**

The central argument is:

> **As AI becomes autonomous, the enterprise needs an operating/control plane that manages the authority, risk, cost, and lifecycle of AI workers.**

---

# 40. Competition Evaluation Strengths

Potential strengths against the scenario requirements:

| Scenario Requirement | Aegis Capability |
|---|---|
| LLM inference at scale | Model Router + Agent Runtime |
| Memory/context | Knowledge Plane + RAG |
| Tool calling | Tool Gateway |
| Multi-step actions | Durable Agent Orchestration |
| Guardrails | Agent Firewall + Policy Engine |
| Safety | Risk Engine + Human Approval |
| Observability | Execution Graph + Distributed Tracing |
| Cost control | Model Routing + Budgets + Rate Limiting |
| Multi-tenancy | Tenant Isolation Layer |
| Reliability | Queues + retries + checkpoints |
| Trust | Audit + Replay |
| Incident handling | Detection + Quarantine + Recovery |
| Enterprise security | Identity + Least Privilege + Dynamic Authority |

---

# 41. Project Maturity Target

The architecture should communicate three levels.

## Level 1 — Prototype

One or two agent types operating against mocked enterprise tools.

## Level 2 — Production-ready architecture

Multi-tenant execution, dynamic authorization, durable workflows, observability, cost controls, and incident response.

## Level 3 — Enterprise scale vision

Hundreds or thousands of agents, regional resilience, advanced simulation, organization-wide policy management, and large-scale AI governance.

The competition submission can focus deeply on Level 1 while explaining how the architecture scales toward Levels 2 and 3.

---

# 42. Core Components Summary

```text
Aegis Control Plane
│
├── Tenant Manager
├── Agent Registry
├── Identity Manager
├── Authority Manager
├── Policy Engine
├── Risk Engine
├── Approval Engine
├── Budget Manager
├── Agent Runtime
├── Workflow Engine
├── Model Router
├── Memory / RAG
├── Agent Firewall
├── Tool Gateway
├── Delegation Manager
├── Behavior Monitor
├── Incident Response
├── Blast Radius Engine
├── Audit Log
├── Distributed Tracing
├── Replay / Debugging
├── Agent Evaluation
└── Operations Dashboard
```

---

# 43. Final Architecture Concept

```text
                    ┌──────────────────────┐
                    │ ENTERPRISE USERS     │
                    └──────────┬───────────┘
                               │
                           API / UI
                               │
                ┌──────────────▼──────────────┐
                │       CONTROL PLANE         │
                │                              │
                │ Agent Registry               │
                │ Identity                     │
                │ Policy Engine                │
                │ Authority Manager            │
                │ Risk Engine                  │
                │ Budget Manager               │
                │ Approval Manager             │
                └──────────────┬──────────────┘
                               │
                         EVENT / QUEUE BUS
                               │
                ┌──────────────▼──────────────┐
                │       AGENT RUNTIME         │
                │                              │
                │ Planner                      │
                │ Memory / RAG                 │
                │ Workflow Executor            │
                │ Model Router                 │
                └──────────────┬──────────────┘
                               │
                         AGENT FIREWALL
                               │
                ┌──────────────▼──────────────┐
                │       TOOL GATEWAY          │
                └──────┬──────────┬───────────┘
                       │          │
                       ▼          ▼
                     CRM        ERP
                       │          │
                       ▼          ▼
                    FINANCE      HR
                       │          │
                       └────┬─────┘
                            ▼
                   ENTERPRISE SYSTEMS

       ┌────────────────────────────────────────┐
       │          OBSERVABILITY / TRUST         │
       │                                        │
       │ Tracing • Audit • Replay • Cost        │
       │ Anomaly Detection • Incident Response  │
       │ Blast Radius • Evaluation              │
       └────────────────────────────────────────┘
```

---

# 44. One-Sentence Pitch

> **Aegis is a cloud-native enterprise AI control plane that gives autonomous agents bounded authority to operate business systems while continuously evaluating their risk, behavior, cost, and impact—and automatically preventing, containing, and explaining unsafe actions.**

---

# 45. Recommended Central Message

The strongest message for the project is not:

> **“AI can automate enterprise tasks.”**

It is:

> **“Autonomous AI creates a new class of enterprise infrastructure problem: organizations need a control plane that makes autonomous agents powerful enough to work, but constrained enough to trust.”**

That is the foundation of the Aegis architecture.

``

# File: BOC2.0_Full_Report.md

``markdown
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

``

# File: BOC2.0_Proposal_Submission.md

``markdown
# BOC 2.0 — Proposal Submission
## Scenario 5: AI Agent Platform for Business Automation

---

**Team Name:** ___________________________________

**Scenario Chosen:** Scenario 5 — AI Agent Platform for Business Automation

**Cloud Platform(s) Used:** GCP (Google Cloud Platform) — primary platform.
Anthropic Claude API used as an external LLM fallback only; all core infrastructure runs on GCP.

---

## Team Members

| # | Full Name | Role in Team | University | Faculty | Email | Contact Number |
|---|-----------|-------------|------------|---------|-------|----------------|
| 1 | | Team Lead / Cloud Architect | | | | |
| 2 | | Backend Engineer / LLM Orchestration | | | | |
| 3 | | Security & Observability Lead | | | | |
| 4 | | Documentation & Diagrams | | | | |

*(2–4 members per team, as per registration rules)*

---

---

## Section 1 — Problem Understanding

Businesses today want AI that can actually do things — not just answer questions in a chat window. A growing number of companies need AI agents that can look up a customer's order history, check internal policy documents, trigger a refund, or send a follow-up email — all autonomously, across multiple steps, without a human supervising each one.

The real problem is not the AI itself. The problem is everything that needs to exist **around** the AI to make it safe and reliable enough to trust in a real business environment. Consider what a company actually needs to deploy even a simple "AI customer support agent":

- The agent needs to remember what the customer said last week — but storing and retrieving that context efficiently, without stuffing a company's entire conversation history into every LLM call, is a significant engineering problem on its own.
- The agent needs to look up order status from a live internal database — but how do you let an AI make real API calls without risking it calling the wrong endpoint, passing bad parameters, or triggering an irreversible action based on a hallucinated output?
- The business needs to know why the agent gave a wrong answer — not just that it did. Debugging an LLM-based system that has no trace of its decision-making is nearly impossible in production.
- The business needs to control costs — LLM inference charges by the token, and an unconstrained agent running thousands of conversations a day can generate bills far beyond what was budgeted.
- Multiple businesses on the same platform must be completely isolated from each other — one company's data, agent behavior, and usage spikes must never affect another's.

**Who is affected:** Small and medium-sized businesses are the most severely impacted. Large enterprises can afford to hire teams of ML engineers and cloud architects to build this infrastructure from scratch. Smaller businesses cannot — they are forced to either use a basic chatbot with no real capability, pay for a proprietary black-box product they cannot understand or audit, or attempt to build it themselves and spend months on infrastructure before writing a single line of actual business logic.

End users — the customers interacting with these agents — are affected when agents give confidently wrong answers, take unintended actions (cancelling a subscription instead of pausing it), or provide no way to escalate to a human when something goes wrong.

**Why existing solutions fall short:** Raw LLM APIs like Gemini or GPT-4 provide the model only — no memory across sessions, no tool-calling infrastructure, no guardrails, and no multi-tenancy. Frameworks like LangChain are exactly that: frameworks. They require a significant engineering team to turn into a production system. Managed agent services from individual cloud providers are deeply tied to one ecosystem and offer limited ability to customise safety and isolation behavior. None of these give a business a "configure and deploy" path to a safe, observable, cost-controlled AI agent.

**Our specific focus:** Rather than building a shallow solution across every dimension, our team focused deeply on three interconnected areas:

1. **Safe tool-calling with a 3-layer guardrails pipeline** — the mechanism that allows agents to take real actions (calling APIs, triggering workflows) without risking harmful, incorrect, or unintended executions. This is the most dangerous part of any AI agent system and the part most likely to cause real-world harm if done carelessly.

2. **Tenant-isolated memory using RAG (Retrieval-Augmented Generation)** — allowing agents to remember relevant past context without exploding token costs, and ensuring no business's data ever appears in another business's agent responses.

3. **Per-decision audit trails** — a structured record of every step an agent took to reach a decision, stored in a queryable format so a business can answer "why did the agent do that?" for any interaction in history.

We explicitly did not go deep on the UI/UX of the agent configuration dashboard, the platform's own billing and payment systems, or LLM fine-tuning — all real requirements for a full production system, but outside our chosen focus for this proposal.

---

## Section 2 — Proposed Solution Overview

We are building **AgentForge** — a cloud platform where any business can sign up, configure an AI agent for their use case, and have it running in production within hours, without setting up a single server, database, or vector store themselves.

A business using AgentForge connects their agent to their own tools — their helpdesk system, their customer database, their order management API — through a dashboard. They define what the agent is and is not allowed to do. AgentForge then handles everything underneath: routing each conversation to the right language model, retrieving only the relevant past context rather than sending the entire history to the model, validating every action the agent proposes before it executes, logging every decision the agent makes, and stopping the agent from doing anything it shouldn't.

Here is what that looks like in practice: a customer messages a business's support bot saying "I want to cancel my subscription." AgentForge checks the conversation history, retrieves the two or three past interactions most relevant to this query, sends that context along with the message to a language model, receives the model's decision to call a "cancel subscription" tool, validates that tool call against a pre-defined safety schema, identifies it as a high-risk action, and routes it to a human reviewer before executing — all while logging every single step as a structured, queryable record. The customer receives a response in under two seconds. The agent never executes an irreversible action without authorisation. The business can query exactly what happened and why at any point in the future.

Think of AgentForge as the infrastructure layer between "a language model that can reason" and "a business system that needs to be operated safely." The business focuses on what their agent should do. We handle how it does it safely.

---

## Section 3 — Architecture Diagram

*Submit as a labelled PDF or PNG built in draw.io, Lucidchart, Excalidraw, or Figma.*

### Diagram Structure — Five Layers

Draw the diagram as five horizontal bands inside a GCP cloud boundary, with external actors outside that boundary.

---

**EXTERNAL ACTORS (outside the cloud boundary)**
- Business Admin (browser — configures agents, reviews audit logs, approves high-risk actions)
- End User (browser / mobile app / REST API client — interacts with the deployed agent)
- External Tool APIs (third-party services the agent calls: CRM, helpdesk, order management, payment systems)
- Anthropic Claude API (external LLM fallback — called only when Gemini API is degraded)

---

**LAYER 1 — Entry & API Gateway**
`Apigee API Gateway`
- Receives HTTPS requests from Business Admin and End User
- Validates JWT / API key, identifies which business tenant the request belongs to
- Enforces per-tenant rate limits (e.g. max 500 requests/minute per tenant)
- Injects a verified tenant ID header — downstream services never trust tenant identity from the request body
- Meters usage per tenant for billing
- Routes to: Admin Dashboard Backend (for configuration requests) or Agent Orchestration Service (for agent invocations)

*Arrows:* "Authenticated HTTPS + JWT" → Apigee → "Tenant-tagged routed request" → Layer 2

---

**LAYER 2 — Core Agent Processing** *(all services run on Cloud Run — stateless, auto-scaling containers)*

`Agent Orchestration Service (Cloud Run)`
The coordinator — manages the full pipeline per agent invocation.
Flow: Load agent config from Firestore → Retrieve memory context → Input guardrail check → LLM call → Output guardrail check → Tool execution (if needed) → Write audit trace → Return response

`Memory & Context Layer (Cloud Run + Vertex AI Vector Search + Firestore)`
- Embedding Service: converts the user message to a vector using Vertex AI text-embedding-004 model
- Vector Search: queries the tenant's isolated vector index for the top-5 most semantically relevant past context chunks
- Conversation Store: reads the last 10 conversation turns from Firestore for the current user session
- Returns: assembled context block to the Orchestration Service

`LLM Router (Cloud Run + Memorystore Redis + Vertex AI)`
- Checks Memorystore (Redis) semantic cache: has a very similar question been answered before for this tenant? If yes → return cached response (no LLM call, ~0 cost)
- Classifies prompt complexity: simple/factual → Gemini Flash; complex/multi-step → Gemini 1.5 Pro; if Gemini is degraded → Anthropic Claude via external API
- Logs token usage to Cost Metering Service
- Writes response to semantic cache (24-hour TTL)

`Guardrails Pipeline (Cloud Run)`
Phase 1 — Input: prompt injection detector, PII scrubber (regex + lightweight NER model), business rule check (is this topic allowed for this agent?)
Phase 2 — Output: JSON schema validation of tool calls, confidence threshold check, sensitive action gate (high-risk tool calls → publish to Human Approval Queue instead of executing)

*Arrows between services are labelled: "Load agent config," "Retrieve relevant context," "Validate user input," "Send assembled prompt," "Validate LLM response," "Execute tool call request," "Write decision trace"*

---

**LAYER 3 — Tool Execution**

`Tool Executor (Cloud Run Jobs — ephemeral per-call containers)`
- Spins up an isolated container per tool call
- Fetches the tenant's external API credentials from Secret Manager at runtime (never stored in the container)
- Validates the tool call against the business-defined URL allowlist (blocks calls to any URL not explicitly whitelisted)
- Blocks outbound traffic to private IP ranges via VPC Service Controls (SSRF prevention)
- Executes the HTTP request to the external API
- Returns result to Orchestration Service; container terminates

`Human Approval Queue (Cloud Pub/Sub topic)`
- Receives high-risk tool call requests from the Guardrails Pipeline
- Business Admin is notified (email + in-dashboard badge)
- Admin can Approve (triggers Tool Executor) or Reject (logs the block)

*Arrows: "Fetch tool credentials (tenant-scoped)" → Secret Manager; "GET /orders/{id}" → External CRM API; "High-risk action detected" → Cloud Pub/Sub*

---

**LAYER 4 — Persistence, Audit & Observability** *(write-only from application services; never written to by external users)*

`Firestore` — Agent configs, conversation histories, approval queue items (per-tenant document collections at path /tenants/{tenantId}/...)

`Cloud Logging — Audit Trail` — Every agent step written as a structured, immutable JSON log entry. No service has delete permissions on the log bucket. Fields include: trace_id, tenant_id, user_session_id, step type, prompt tokens, completion tokens, model used, retrieved context chunk IDs, tool called, output safety result, timestamp.

`BigQuery — Analytics & Replay` — Audit logs streamed to BigQuery via a Log Sink. Dataset has a deletion lock (tamper-evident). Enables SQL queries across the full agent decision history.

`Cloud Trace` — Every request propagates a trace ID across all services. Visualises the full call chain with per-service latency breakdowns.

`Cloud Monitoring` — Per-tenant dashboards and platform-wide dashboards. Alert thresholds configured for error rate, latency, guardrail block rate, token usage anomaly.

---

**LAYER 5 — Cost Metering Service** *(Cloud Run + BigQuery)*

- Aggregates token usage logs from LLM Router per tenant
- Writes daily per-tenant usage summaries to BigQuery
- Triggers quota enforcement (hard stop) when a tenant exceeds their monthly token budget
- Powers the cost dashboard in the Business Admin panel

---

### Tenant Isolation Callout Box (label in the diagram)

| Layer | Isolation Mechanism |
|---|---|
| Firestore | Separate collection path per tenant |
| Vector Search | Separate vector index per tenant |
| Secret Manager | Per-tenant path namespacing |
| Cloud Run | Tenant ID from verified gateway header only |
| IAM | Service accounts scoped to own tenant only |
| Logging | Log-based access conditions by tenant_id |

---

## Section 4 — Technology Choices & Justification

### Cloud Run — Core Compute for All Services

We chose Cloud Run (serverless containers) for every application service in our architecture because an AI agent platform has fundamentally unpredictable traffic. A single business might be idle for hours, then spike to hundreds of concurrent agent requests when they run a product campaign. Traditional VM-based compute would either waste money idling or fail to scale fast enough. Cloud Run scales to zero when idle (zero cost) and scales to hundreds of instances within seconds during bursts.

More importantly, each service in our architecture — the Orchestration Service, Memory Layer, LLM Router, Guardrails Pipeline, and Tool Executor — scales **independently**. If we get a wave of tool-heavy requests, only the Tool Executor needs to scale; the memory layer does not. This is impossible with a monolithic deployment and unnecessarily complex with a Kubernetes cluster at our expected pilot scale. Cloud Run gives us per-service auto-scaling with no cluster management overhead.

We considered Cloud Functions and rejected it because our services hold stateful connections (Redis, Firestore) and multi-step agent reasoning can take 5–30 seconds per request — well beyond what Cloud Functions handles gracefully. We considered GKE and rejected it because it adds significant cluster management overhead without meaningful benefit at pilot scale.

### Apigee — API Gateway & Multi-Tenant Entry Point

The core problem with multi-tenancy is that every request must be authenticated and attributed to the correct business tenant *before* any backend processing begins. Doing this in application code across five separate services is error-prone, duplicative, and creates opportunities for bugs that could allow one tenant to access another's resources. Apigee handles this at the perimeter: it validates the tenant's API key, injects a verified tenant context header into every downstream request, enforces per-tenant rate limits (preventing a single misbehaving tenant from consuming the entire platform's LLM quota), and meters usage per tenant for billing — all before a single line of business logic executes.

This is not just about convenience. If Apigee were not in place, a traffic spike from one tenant would be indistinguishable from platform-wide load, and we would have no reliable way to throttle or isolate it. We considered Cloud Endpoints (simpler, but lacks per-tenant policy management) and NGINX Ingress (requires manual policy management and does not integrate with GCP IAM or billing). Neither met the multi-tenant isolation requirement.

### Vertex AI Vector Search — Tenant-Isolated Agent Memory

The fundamental challenge with agent memory in a multi-tenant context is cost and isolation. Sending an agent's entire conversation history to the LLM on every call is prohibitively expensive (large prompts mean high token costs and high latency) and quickly hits context window limits. We solve this using Retrieval-Augmented Generation (RAG): we embed every conversation turn and knowledge base document into vectors, store them, and at query time retrieve only the top 5 most semantically relevant chunks. The LLM only sees what is actually relevant to the current query.

We chose Vertex AI Vector Search specifically because each tenant gets a **separate vector index**. This means cross-tenant data leakage is structurally impossible — not just policy-enforced. There is no shared index that a misconfigured query could accidentally return results from. We considered Pinecone (good product, but data would reside outside GCP, complicating compliance and adding an external API dependency in a latency-critical path) and PostgreSQL with pgvector (viable at small scale, but not managed at our target throughput, and requires significant ops work as the knowledge base grows).

### Gemini via Vertex AI — Primary LLM with Model Routing

We chose Gemini through Vertex AI rather than an external LLM provider for three specific reasons relevant to this problem. First, LLM inference stays within the GCP network — no external HTTPS call adds latency or creates a network boundary that could cause failures. Second, Vertex AI access is controlled by standard GCP IAM — no separate API key management for LLM calls, which removes a credential management problem. Third, all LLM requests are automatically logged through GCP Audit Logs, contributing to our audit trail without additional engineering.

We route between models based on complexity: simple, factual queries go to Gemini Flash ($0.075/1M input tokens) and complex, multi-step reasoning goes to Gemini 1.5 Pro ($3.50/1M input tokens). Routing 65% of traffic to Flash versus sending everything to Pro saves approximately $110/month at pilot scale alone. If Gemini is degraded, the LLM Router automatically falls back to Claude 3.5 Sonnet via the Anthropic API. We considered OpenAI GPT-4o — excellent quality but an external API dependency with no native GCP IAM integration and higher cross-network latency.

### Memorystore (Redis) — Semantic Response Cache

A significant portion of queries to a business support agent are semantically identical: "What are your business hours?" and "When do you open?" and "Are you open on weekends?" are all the same question phrased differently. Without a semantic cache, each of these triggers a separate, costly LLM call. Our semantic cache works by embedding the incoming query, checking whether any stored embedding is within a cosine similarity threshold (>0.92) of a previous response, and if so returning the cached response at near-zero cost and under 5ms latency — versus 400–800ms and real token charges for a fresh LLM call.

We estimated a 25–40% cache hit rate for a typical customer support agent, translating directly to a 25–40% reduction in LLM inference costs. This also acts as a performance buffer during traffic spikes: cache hits bypass the LLM entirely, reducing peak load on the upstream API. We considered application-layer caching and rejected it because it would not persist across Cloud Run instance restarts and would not be shared across the fleet of instances.

### Firestore — Agent Configuration & Conversation State

Agent configuration data — the system prompt, allowed tools, guardrail rules, model preferences — has a flexible, nested structure that varies significantly between tenants. A relational schema would require constant migrations as we add new agent capabilities. Firestore's document model accommodates this naturally without schema changes. For conversation history, we need per-user sub-collections that can be queried efficiently by session ID — Firestore's collection-document hierarchy maps directly to this (`tenants/{tenantId}/conversations/{sessionId}/messages`). We considered Cloud Spanner — strong consistency is unnecessary for agent config data and adds significant cost. Cloud SQL (PostgreSQL) is viable but adds connection pool management complexity and requires schema migrations for flexible agent config.

### Secret Manager — Tool Credentials per Tenant

Each business connects their agent to their own external APIs and provides API keys for those systems. These credentials are highly sensitive — a leak would allow anyone to impersonate that business's backend systems. We store each credential in Secret Manager at a path namespaced by tenant: `/tenants/{tenantId}/tools/{toolName}/apiKey`. The Tool Executor service account has IAM permission to read only secrets under its current tenant's namespace — cross-tenant credential access is structurally prevented, not just policy-enforced. We rejected storing credentials in Firestore (even encrypted) because application code handling decryption becomes a single point of compromise. Environment variables in Cloud Run were rejected immediately — credentials would appear in deployment configs and logs.

### Cloud Logging + BigQuery — Immutable Audit Trail

The problem statement explicitly requires explaining "why an agent made a given decision — not just that it made one." This requires storing every intermediate step: what context was retrieved from memory, what prompt was sent to the LLM, what tool call the LLM requested, what the tool returned, and what the final response was. Cloud Logging captures all of this as structured JSON at sub-second granularity. A Log Sink streams these records to BigQuery, where businesses can query arbitrary questions across months of agent history using standard SQL. The BigQuery dataset has a deletion lock — the service account that writes logs has INSERT-only permissions, making the audit trail tamper-evident. We considered raw log files in Cloud Storage (queryable but requires external tooling) and Elasticsearch (powerful but operationally expensive and not GCP-native).

### Cloud Pub/Sub — Human Escalation Queue & Async Decoupling

When the Guardrails Pipeline identifies a high-risk action (for example, an agent that wants to issue a refund above a configured threshold), we cannot hold the user's connection open waiting for a human reviewer — this would leave the end user staring at a loading screen indefinitely. Instead, the Guardrails Pipeline publishes the pending action to a Pub/Sub topic and immediately returns a response to the user ("This request has been sent for review"). The admin is notified separately and can approve or reject from their dashboard. Pub/Sub also decouples audit log writing from the critical response path — audit trace events are published asynchronously, so any slowdown in the audit layer does not affect response latency for the end user.

---

## Section 5 — Scalability & Performance

Our system has four distinct load patterns that require different scaling approaches:

**Pattern 1 — Gradual baseline growth:** As more businesses onboard, total request volume grows proportionally. This is handled by Cloud Run's standard horizontal auto-scaling.

**Pattern 2 — Per-tenant spikes:** A single business runs a marketing campaign and their agent goes from 10 requests/minute to 2,000 within minutes. The critical requirement here is that this spike should not degrade any other tenant's experience at all. This is different from a typical scaling problem, where more traffic means slower responses for everyone. Our architecture prevents this through per-tenant rate limits at Apigee (which cap any single tenant before they reach backend services), per-tenant token buckets in Redis (independently metered LLM usage), per-tenant concurrency limits in the Tool Executor, and per-tenant vector search indexes (a query spike in one tenant's index has no effect on another's).

**Pattern 3 — Global concurrency spikes:** Multiple tenants spike simultaneously. Cloud Run scales each service independently, and Apigee begins queueing requests per-tenant before they reach backend services if any single tenant is approaching their limit.

**Pattern 4 — LLM API rate limits:** Scaling our platform aggressively does nothing if we hit the upstream Gemini API's tokens-per-minute ceiling. We manage this specifically: the LLM Router lowers its complexity threshold during high load, routing more traffic to Gemini Flash (which has a 10× higher rate limit than Gemini Pro). If the Gemini API approaches its rate limit, the router queues Pro-tier requests via Pub/Sub rather than returning errors. If all LLM APIs are degraded, the system returns graceful "temporarily unavailable" responses — it never silently returns stale or wrong answers.

**Latency budget (typical request, no tool call, cache miss):** Apigee routing: 10–20ms → embedding generation: 30–50ms → vector search retrieval: 20–40ms → guardrails input check: 15–25ms → LLM call (Gemini Flash): 400–800ms → guardrails output check: 10–20ms → Total P50: ~550ms. Audit log writing is asynchronous and does not contribute to response latency.

For chat interfaces where 800ms "thinking time" feels slow, we support streaming responses using Server-Sent Events — the first tokens from the LLM appear in the user's browser within 200–300ms of the model beginning generation.

---

## Section 6 — Security, Privacy & Compliance

The key principle across our entire security design is **structural enforcement over policy-only enforcement**: wherever possible, security is built into the structure of the infrastructure itself, so that a code bug cannot bypass it. Policy controls (IAM rules, network restrictions) add additional layers on top of structural controls.

**Who can access what, and how it is enforced:**

Business admins authenticate via Google OAuth 2.0 or SAML SSO. MFA is enforced for all admin accounts with no exceptions. Admin sessions are logged to Cloud Audit Logs — every configuration change, key rotation, and approval action is attributable to a specific admin identity. Each admin can only access their own tenant's data: Firestore uses path-based isolation (`/tenants/{tenantId}/...`), Vector Search uses per-tenant indexes, and Cloud Logging uses log-based access conditions that restrict tenant admins to their own tenant_id.

Internal services use dedicated service accounts with minimal IAM permissions. The Memory Layer service account can read Vector Search, read/write its own Firestore path, and write to Cloud Logging. It cannot access Secret Manager, call Vertex AI LLM endpoints, or read any other tenant's data. Service accounts are bound via Workload Identity Federation to specific Cloud Run service identities — credentials cannot be exported or used outside their assigned service.

End users authenticate via a business-issued API key or JWT. The business controls who gets this key. All tokens have a maximum 24-hour TTL with rotation on each use.

**Encryption at rest and in transit:**

All external communication (browser to Apigee, Business Admin to admin API) uses TLS 1.3 — TLS 1.2 is disabled at the Apigee configuration level. All internal service-to-service communication uses Google's internal encrypted network with automatic mTLS via the Cloud Run service mesh. External tool API calls from the Tool Executor enforce TLS 1.2 minimum and reject endpoints without valid certificates.

At rest: Firestore, Vector Search indexes, Cloud Logging, and BigQuery are all encrypted with AES-256 (GCP default, Google-managed keys). Secret Manager uses Cloud KMS Customer-Managed Encryption Keys (CMEK) — even Google cannot read tenant secrets without the tenant's KMS key. Memorystore (Redis) is encrypted at rest and in transit with AUTH enabled.

**Consent and data minimisation:**

Before sending any user message to the LLM, the Guardrails Pipeline runs a PII classifier (regex combined with a lightweight named-entity recognition model) that detects phone numbers, email addresses, credit card numbers, national ID numbers, and full names. Detected PII is replaced with a placeholder token ("My email is [EMAIL_REDACTED]") before the message reaches the LLM. The original value is stored separately in Firestore, encrypted with CMEK, retrievable only if the agent genuinely needs it (for example, to look up an order by email address). Raw user message text is never written to Cloud Logging — traces contain only the scrubbed version plus a reference to the secure PII store.

Conversation histories are retained for 90 days by default, then automatically deleted via Firestore TTL policies. Knowledge base documents are indexed in Vector Search but conversation history is never embedded or stored there — only business-provided documents enter the vector index.

**Tool execution security:**

Agents can only call tools explicitly configured by the business admin, with specific allowed URL patterns and HTTP methods. The Tool Executor validates every call against this allowlist — calls to any URL not on the list are blocked unconditionally. Tool Executor instances run inside a VPC Service Controls perimeter that blocks outbound traffic to private IP ranges (10.x.x.x, 172.16.x.x, 192.168.x.x), preventing server-side request forgery attacks against internal GCP services. Tools classified as "high-risk" by the business admin require explicit human approval before execution — the agent proposes the action and a human authorises it.

---

## Section 7 — Cost Estimate

**Assumptions — Pilot Scale:**
- 10 business tenants, 1 deployed agent each
- 500 agent conversations/day across all tenants = 15,000 conversations/month
- 5 turns per conversation, ~600 input tokens + ~300 output tokens per turn
- LLM routing split: 65% Gemini Flash, 30% Gemini Pro, 5% served from semantic cache
- 1.5 tool calls per conversation on average
- 5,000 knowledge base documents per tenant (~500 tokens each)

| Component | Estimated Monthly Cost | Notes |
|---|---|---|
| LLM Inference — Gemini Flash (65% of turns) | $6.58 | 29.25M input + 14.63M output tokens at Flash pricing |
| LLM Inference — Gemini Pro (30% of turns) | $118.13 | 13.5M input + 6.75M output tokens at Pro pricing |
| Compute — Cloud Run (all 6 services) | $20.00 | Scales to zero outside business hours |
| Redis Semantic Cache — Memorystore | $11.68 | 1 GB instance, 730 hours/month at $0.016/GB-hour |
| Database — Firestore | $0.86 | ~525,000 reads + 375,000 writes/month |
| Vector Search — Vertex AI | $0.16 | 50,000 vectors stored + 75,000 queries/month |
| Embedding Model — Vertex AI text-embedding | $0.25 | 7.5M query embedding tokens + re-indexing |
| API Gateway — Apigee | $0.45 | ~150,000 API calls/month; within entry-tier pricing |
| Secrets — Secret Manager | $0.30 | ~10 tenants × $0.03 per secret version |
| Async Messaging — Cloud Pub/Sub | $0.002 | ~37.5 MB of message data/month |
| Audit Logging — Cloud Logging + BigQuery | $0.00 | Within GCP free tier at pilot scale |
| **TOTAL** | **~$158/month** | **~$15.84 per tenant/month; ~$0.0106 per conversation** |

**Key cost control mechanisms:**
- Semantic cache: every cache hit eliminates an LLM call, saving $0.0017–$0.085 per turn
- Model routing: sending 65% of traffic to Gemini Flash rather than 100% to Pro saves ~$110/month at pilot scale
- Per-tenant token quotas: hard stop prevents any single tenant from generating runaway costs; warning alert at 80% of quota
- Conversation history pruning: only last 10 turns stored in Firestore, reducing context size and token usage per call
- Embedding reuse: knowledge base documents are embedded once at indexing time and reused across all queries

---

## Section 8 — Availability & Resilience

Not every system requires multi-region active-active failover. For an AI agent platform, we assessed failure modes in order of severity:

- **Data loss**: not tolerable. A business's agent configuration, knowledge base, or conversation history disappearing would destroy trust and require manual reconstruction. This is our highest-priority resilience concern.
- **Silent wrong behavior**: also not tolerable. An agent that gives wrong answers or executes incorrect tool calls without anyone knowing is more dangerous than an agent that is visibly unavailable. We design every failure mode to fail visibly (return an error), never silently.
- **Brief downtime (1–5 minutes)**: tolerable for this type of B2B SaaS platform. A business's customer gets an error and tries again. Unlike a safety-critical system, delayed response is not catastrophic.

**How we handle specific failure scenarios:**

*LLM API degradation:* The LLM Router monitors Gemini API error rates. If errors exceed 5% over 60 seconds, it automatically routes complex queries to Claude 3.5 Sonnet via the Anthropic API. For simple queries, it returns the closest cached response with a disclaimer. If all LLM APIs are degraded, it returns a graceful "temporarily unavailable" message. A circuit breaker pattern prevents retry storms: after 10 consecutive failures to an API, the router stops calling it for 60 seconds.

*Firestore unavailability:* Agent configurations are cached in Redis with a 5-minute TTL, allowing most requests to continue without Firestore. Conversation history for active sessions is cached in Redis with a 30-minute TTL. Write failures (saving new conversation turns) are queued to Pub/Sub and retried when Firestore recovers — no turn is permanently lost. Firestore uses multi-region replication within the GCP region: RPO = 0, RTO < 60 seconds for AZ-level failure.

*Redis unavailability:* The LLM Router detects the cache connection failure and switches to cache-bypass mode — all requests go directly to the LLM. Config reads fall back to Firestore (adds ~10ms latency, no correctness impact). Redis is deployed in high-availability mode with a replica — automatic failover within 1–2 seconds if the primary fails.

*Tool call timeout:* Every tool call has a hard 10-second timeout. On timeout, the Tool Executor returns a structured error to the Orchestration Service, which passes it to the LLM with a prompt: "The tool call timed out. Inform the user the information is temporarily unavailable." The agent generates a graceful, user-facing error message. The timeout is logged to the audit trail.

*Agent enters a tool-calling loop:* The Orchestration Service enforces a hard limit of 10 tool calls per conversation turn and 50 per session. If either limit is reached, execution stops and the agent returns a "task too complex" message. Anomaly detection alerts Platform Ops if any tenant's tool call rate exceeds three times their 7-day moving average for more than 5 minutes.

**Disaster recovery:** Firestore is exported daily to Cloud Storage (30-day retention). Vector Search indexes are snapshotted weekly (4-week retention). Secret Manager versions every credential change (90-day retention). At pilot scale with 10 tenants, we deploy in a single GCP region (us-central1, 3 availability zones). For a complete regional failure — extremely rare — our RTO is 4 hours (restore services from backup data in a secondary region). This is acceptable for a non-safety-critical B2B SaaS product at pilot scale. Multi-region active-active would approximately double infrastructure cost and is not justified until we have enterprise SLA customers requiring it.

---

## Section 9 — Monitoring & Observability

For a standard web application, monitoring means: is it up? How fast is it? For an AI agent platform, those questions are necessary but not sufficient. An agent can return a 200 OK status code in 600ms with a response that is factually wrong, takes an unintended action, or violates a business rule — and standard uptime monitoring would report everything as healthy.

Our observability strategy therefore covers two distinct layers.

**Infrastructure observability (is the system working as expected?):**

We track per-tenant metrics in Cloud Monitoring with specific alert thresholds: request error rate (alert threshold: >5% over 5 minutes — indicates systemic failure), P99 end-to-end latency (alert threshold: >3,000ms — user experience degradation), LLM API error rate (alert threshold: >3% over 2 minutes — triggers our fallback routing logic), tool call success rate (alert threshold: <90% over 10 minutes — indicates external API degradation), guardrails block rate (alert threshold: >20% over 5 minutes — possible prompt injection attack or misconfigured guardrail rule), and semantic cache hit rate (alert threshold: <10% sustained — suggests cache failure or a sudden shift in query patterns).

These alerts route to PagerDuty for on-call response.

**Agent behavior observability (is the agent making correct, safe decisions?):**

Every agent invocation produces a **Decision Trace** — a structured, ordered chain of log entries written to Cloud Logging and queryable in BigQuery. This is not a single log line; it is a linked sequence of steps that together answer "why did the agent do what it did."

For example, for a conversation where a customer asks "I want to cancel my subscription," the trace would contain: the scrubbed user message and the guardrails input check result → the top-5 memory chunks retrieved from the knowledge base with their similarity scores → the LLM call details including model used, token counts, and the tool call the model requested → the guardrails output check result showing that "cancel_subscription" was classified as high-risk and escalated to human review rather than executed → the response sent to the user → the notification sent to the admin for approval.

This trace answers questions that standard monitoring cannot: Which past context chunks influenced the agent's response? Why did the agent propose a particular action? Why was that action not immediately executed? What did this interaction cost in tokens?

Because all traces are streamed to BigQuery, business admins and Platform Ops can run arbitrary SQL queries: find all conversations from the last 30 days where the agent was blocked from executing a tool call; find which knowledge base documents are retrieved most often and might need updating; compare token usage per agent over time to identify efficiency regressions.

We additionally track agent-quality metrics per tenant in the dashboard: escalation rate (percentage of conversations routed to human review), guardrails block rate, tool call success rate, semantic cache hit rate, and average memory retrieval similarity score (a low average score suggests the knowledge base is not well-matched to the questions users are actually asking).

For diagnosing latency issues, Cloud Trace propagates a trace ID across all services — Apigee through to the Tool Executor. When P99 latency spikes, a Platform Ops engineer can select any slow request and see exactly which service was the bottleneck, without grepping through multiple separate service logs.

---

## Section 10 — Conclusion & Future Improvements

**What we built:** AgentForge is a multi-tenant AI agent platform on GCP where businesses can deploy production-ready AI agents — with memory, tool-calling, safety guardrails, cost controls, and full observability — without managing any of that infrastructure themselves. Our proposal focused on three areas in depth: the 3-layer guardrails pipeline that makes tool-calling safe, the tenant-isolated RAG memory system that keeps context relevant and costs low, and the per-decision audit trail that makes agent behavior explainable.

**Honest limitations:**

*LLM non-determinism:* Our guardrails pipeline reduces the risk of harmful outputs, but it does not eliminate the possibility of a subtly wrong or misleading answer that passes all safety checks. The same input can produce different outputs on different runs. Fully addressing this requires ongoing human review of a sample of all interactions, fine-tuned models for high-stakes domains, and adversarial testing by subject-matter experts. We have the logging infrastructure for this — the review process itself is out of scope for this proposal.

*Complex multi-step planning:* Our architecture handles single-turn tool calls and short multi-step sequences well. It is not optimised for agents that need to execute complex, multi-session plans spanning hours or days — for example, "research this topic for 2 hours and then draft a full report." This would require a persistent task queue, long-running agent state management, and a more sophisticated planning architecture. It is an extension of the current design, not an incompatibility, but it is not in this proposal.

*Knowledge base freshness:* Our vector index is re-indexed incrementally on a weekly schedule. For businesses with rapidly changing information (daily price changes, new product launches), weekly re-indexing is too slow. Real-time streaming updates to the vector index would require a streaming indexing pipeline, which adds cost and complexity we chose not to design in detail here.

*Configuration dashboard UX:* The backend infrastructure is described in depth, but the business-facing dashboard for configuring agents, connecting tools, and reviewing audit logs is mentioned but not designed. Poor UX on the configuration side would limit adoption regardless of how capable the backend is.

**What we would build next (priority order):**

*Priority 1 — Multi-turn planning with persistent task state:* Extend the Orchestration Service to support multi-step plans with checkpointed state in Firestore, allowing agents to break complex requests into sub-tasks, execute them sequentially or in parallel, and report progress back to the user. Add streaming response delivery so the first tokens appear in the browser within 200ms rather than the user waiting for the full response.

*Priority 2 — Agent template marketplace:* Allow businesses to share anonymised agent configurations with other AgentForge customers. A "Customer Support Agent" template pre-configured with common helpdesk tool integrations, starter guardrail rules, and a sample knowledge base could reduce onboarding time from hours to minutes and create a platform network effect.

*Priority 3 — Fine-tuning pipeline for high-volume tenants:* For tenants where Gemini Flash's general-purpose quality is insufficient for their specific domain, provide a pipeline to fine-tune a smaller base model on their conversation history and knowledge base. A well-tuned smaller model can outperform a general-purpose large model on specific tasks at 10–20× lower cost per token.

*Priority 4 — Real-time knowledge base updates:* Build a streaming indexing pipeline (document change → Cloud Pub/Sub → Embedding Service → Vector Search upsert) that updates the vector index within seconds of a knowledge base document being modified. This enables agents for fast-moving business domains.

*Priority 5 — Multi-region active-active deployment:* As the platform grows to serve enterprise customers with strict SLA requirements, deploy the full stack in two GCP regions (us-central1 + europe-west1) with active-active traffic routing and Firestore multi-region replication. This reduces RTO for a complete regional failure from the current 4 hours to under 1 minute.

The most important design decision in this entire proposal is treating safety and auditability as foundational — not features added after the core system was built. Every tool call is validated before it executes. Every agent decision is traced. Every guardrail block is logged with full context. A business that deploys an AI agent that can take real actions in their systems must be able to trust it. That trust is built through transparency and control, not through capability alone.

``

# File: BOC2.0_Round_1_Problem_Statements.md

``markdown
# Beauty of Cloud 2.0 - Round 1 Problem Statements (v3)

## General Information
- **Released:** Aug 12
- **Scenario lock-in:** Aug 18
- **Submission deadline:** Sep 6, 11:59 PM
- **Cloud platforms allowed:** AWS, GCP, or Microsoft Azure — pick whichever fits your solution, and justify the choice. You may mix providers if you can explain why.
- **Changes from v2:** Added a 5th scenario focused on AI/AI agents, and de-localized every scenario — none are tied to a specific country anymore. Teams can set their own regional context if they want one, but it's not assumed or required.

## How to Read These Problem Statements
- Each statement below describes a real-world problem — not a solution. No AWS/GCP/Azure services are named on purpose. Your job as a team is to research, choose, and justify your own architecture. A proposal that just names services without explaining why they fit this specific problem will score lower than one with fewer services but clearer reasoning.
- These are large, multi-faceted systems — you are not expected to design every corner of them in full depth. Pick the parts of the system you'll go deep on, and say so explicitly, rather than skimming everything shallowly.
- There is no single correct answer. Two teams solving the same statement with completely different architectures can both score well, if both are well-justified.

---

## 1. Scenario 1 - Disaster Early Warning System

### Background
Many regions around the world face recurring natural disasters - floods, landslides, earthquakes, wildfires - where warnings often arrive too late, or don't reach the people most at risk, especially in areas with weak connectivity. A credible system needs to operate at scale, pulling data from multiple sources and multiple response agencies, not just one location at a time.

### Who This Is For
Residents in at-risk areas, local government/emergency officials, disaster relief agencies, and emergency response teams. You may choose any disaster type and region as your working context - just state your assumption clearly.

### The Problem
Build a cloud-based system that ingests risk data at scale (weather feeds, sensor networks, satellite data, crowd-sourced reports), determines when risk is rising in specific areas, and gets targeted alerts to the right people fast - without alert fatigue for people outside the affected area.

### Your Solution Needs to Handle
- Ingesting data continuously from many independent sources (sensors, weather APIs, citizen reports) at once
- A sudden, massive spike in activity across multiple regions simultaneously during an actual event
- Targeting alerts geographically - people outside the affected zone shouldn't be alerted
- Getting alerts to people with slow or unreliable internet (SMS fallback, offline-first considerations)
- The system staying fully operational during the disaster it's warning about, including partial connectivity loss
- Multiple agencies needing different views/access to the same underlying data

### Special Considerations
This is safety-critical infrastructure. If your system goes down exactly when it's needed most, that's a real-world failure - explain your resilience approach specifically, including how you'd handle a regional outage without losing the whole system.

---

## 2. Scenario 2 - Photo & Video Social Platform

### Background
A social platform (think Instagram-scale) where users share photos, short videos, and stories, follow each other, and interact through likes/comments/DMs. This is a full consumer social product aimed at global scale, not a small feature.

### Who This Is For
A broad consumer user base (launch audience in the hundreds of thousands, with a path to scaling further), content creators within that community, and the platform's own moderation/ops team.

### The Problem
Design the cloud architecture for a media-heavy social platform: users upload photos/videos, get an algorithmically ranked feed, follow/interact with others, and the platform stays fast and available at scale.

### Your Solution Needs to Handle
- Massive media upload volume - storage, processing (e.g., resizing/transcoding), and fast delivery worldwide
- Feed generation that's personalized per user and stays fast even as users and posts grow
- Real-time-ish interactions: likes, comments, notifications arriving promptly
- Read-heavy traffic that dwarfs write traffic (many more viewers than posters)
- Search and discovery (finding people, hashtags, or content) at scale
- Content moderation - some mechanism for catching harmful/abusive content, even at a high level
- Cost control - media storage and bandwidth are usually the biggest cost driver here; show you've thought about it

### Special Considerations
You don't need a perfect feed-ranking ML model - a reasonable, explained approach is fine. What's being judged is whether your infrastructure choices make sense for a media-heavy, read-heavy, high-growth consumer app.

---

## 3. Scenario 3 - Short-Form Video & Live Streaming Platform

### Background
A short-form video platform (think TikTok/YouTube Shorts) combined with live streaming (think Twitch), aimed at a global audience. Users upload short videos that get algorithmically distributed to a personalized feed, and creators can go live with real-time viewer chat.

### Who This Is For
General content viewers, content creators, and live streamers - potentially hundreds of thousands of concurrent users during peak/viral moments.

### The Problem
Design the cloud architecture powering both the recorded short-video feed and the live-streaming side of the platform, including infrastructure for handling a video or stream suddenly going viral.

### Your Solution Needs to Handle
- Video ingestion and processing (transcoding into multiple qualities/formats) at scale
- Fast global video delivery with low buffering
- Live streaming specifically - low-latency delivery plus real-time chat for potentially thousands of concurrent viewers on one stream
- A sudden, unpredictable spike in traffic to one specific piece of content without slowing the rest of the platform
- A personalized recommendation feed that serves fresh content quickly, not just a fixed replay list
- Storage lifecycle - not all video needs to stay on the most expensive storage tier forever

### Special Considerations
Focus your depth on either the recorded-video path or the live-streaming path (or both, if your team can manage it) - say explicitly which you're prioritizing and why, rather than giving shallow treatment to everything.

---

## 4. Scenario 4 - Ride-Hailing & On-Demand Delivery Platform

### Background
A ride-hailing and delivery platform (think Uber/Lyft/DoorDash) operating across multiple cities globally, matching riders/customers with drivers in real time, with live location tracking and in-app payments.

### Who This Is For
Riders and delivery customers, drivers/couriers, and platform operations staff monitoring the system across multiple cities simultaneously.

### The Problem
Design the cloud architecture for a real-time matching and logistics platform — from the moment a request comes in, to matching it with a nearby driver, to live tracking, to payment.

### Your Solution Needs to Handle
- Real-time, high-frequency location updates from many drivers simultaneously (continuous GPS pings)
- Geospatial matching - finding the nearest available driver to a request quickly, at city scale
- Live tracking updates pushed to the rider/customer's app in near real time
- Surge/demand spikes at predictable times (e.g., rush hour, bad weather, big events) across multiple cities at once
- Payment processing, including handling failed/retried payments without double-charging
- The system continuing to operate correctly if one city's traffic spikes heavily while others stay normal

### Special Considerations
Payment and location data are both sensitive - your proposal must explicitly address how each is protected, not just state "we use encryption." Also address what happens to an in-progress ride/delivery if a component fails mid-transaction.

---

## 5. Scenario 5 - AI Agent Platform for Business Automation

### Background
Businesses increasingly want AI agents that can autonomously carry out multi-step tasks — answering customer questions, researching information, drafting documents, or triggering actions in other systems - rather than a single chatbot that just answers questions. This scenario is about the cloud infrastructure behind a platform that lets many businesses deploy and run their own AI agents at once.

### Who This Is For
Businesses (the platform's customers) who configure and deploy agents, their end users interacting with those agents, and the platform's own team monitoring agent behavior across all tenants.

### The Problem
Design the cloud architecture for a multi-tenant platform where each business can deploy one or more AI agents that use large language models, call external tools/APIs, retain some memory of past interactions, and take multi-step actions toward a goal - reliably, safely, and at reasonable cost.

### Your Solution Needs to Handle
- Running LLM inference at scale for many businesses and end users simultaneously, with acceptable latency for an interactive experience
- Agent memory/context - retrieving relevant past information (e.g., via a knowledge base) without every request becoming enormous and expensive
- Tool-calling - agents safely calling external APIs or internal systems to actually take action, not just talk
- Guardrails - preventing an agent from taking a harmful, incorrect, or unintended action, and having a way to catch it when it does
- Observability - being able to see why an agent made a given decision, not just that it made one, for debugging and trust
- Cost control - LLM inference cost can spiral quickly; show you've thought about managing it (e.g., caching, model selection, rate limiting)
- Multi-tenant isolation - one business's data, agents, or usage spikes should not affect another's

### Special Considerations
You are not expected to train your own model - assume you're calling existing LLM APIs/managed AI services. The focus is the platform and orchestration layer around the model, not the model itself. Given agents can take real actions, safety and auditability are scored seriously here, not treated as an afterthought.

---

## Submission Requirements
- 1. Architecture diagram - see the separate Report & Diagram Template document for structure and formatting
- 2. Written proposal report (max 5 pages) - same template
- 3. Optional: a rough prototype or repo link - not required, and not scored separately if missing

## What We Are NOT Looking For
- A copy of a tutorial architecture with your scenario's name swapped in
- Every possible cloud service crammed in "just in case" - pick what the problem actually needs
- Generic security/compliance language with no specifics
- Shallow, one-line treatment of every feature instead of real depth on the parts you chose to focus on

## Judging
See the separate Evaluation Criteria document for the full scoring rubric.

``

# File: BOC2.0_Proposal\00_Overview_and_Ideas.md

``markdown
# BOC 2.0 — Scenario 5: AI Agent Platform for Business Automation
## Master Overview, Ideas & Strategy Guide

---

## WHY SCENARIO 5 IS A STRONG CHOICE

Scenario 5 is the newest and most forward-looking problem statement in BOC 2.0. It sits at the intersection of:
- Multi-tenant SaaS architecture (standard cloud engineering)
- LLM orchestration (cutting-edge AI infra)
- Safety & guardrails (high-trust enterprise systems)
- Cost optimization (real-world cloud economics)

Judges will weight this scenario highly because it requires teams to go beyond "deploy a model" — you must design the platform layer around LLMs: memory, tool-calling, multi-tenancy, observability, and cost control. Very few teams wivll tackle this confidently, which gives you a competitive edge.

---

## CORE CONCEPT: WHAT ARE YOU ACTUALLY BUILDING?

Platform Name: AgentForge
Tagline: "Deploy intelligent agents. Own the results."

AgentForge is a cloud-native, multi-tenant AI Agent Platform that lets businesses deploy autonomous AI agents with memory, tool-calling, and guardrails — without building any of the infrastructure themselves.

Think of it as Vercel for AI Agents — businesses configure agents through a dashboard, and AgentForge handles everything underneath: LLM routing, memory retrieval, tool execution, safety checks, cost metering, and audit logs.

---

## KEY IDEAS & ANGLES

### Idea 1: Multi-Model Router (Cost Control + Performance)
Instead of always calling the most expensive LLM, the platform intelligently routes requests:
- Simple queries → smaller, cheaper models (Gemini Flash, GPT-4o-mini) — ~$0.00015/1K tokens
- Complex reasoning → larger models (Claude 3.5 Sonnet, Gemini 1.5 Pro) — ~$0.003/1K tokens
- Repeated/similar queries → Semantic cache layer (no LLM call at all, ~0 cost)

This is a concrete, judge-friendly cost control strategy. Estimated savings: 40–70% on inference costs.

### Idea 2: Retrieval-Augmented Generation (RAG) for Agent Memory
Each business tenant gets an isolated vector store. When an agent receives a message, the platform:
1. Embeds the user query using a small embedding model
2. Retrieves top-K relevant past interactions / knowledge base docs
3. Injects only the relevant context into the LLM prompt (not the full history)

This keeps prompts lean → lower cost, lower latency, better answers.

### Idea 3: Tool-Calling with Sandboxed Execution
Agents can call external tools (APIs, databases, webhooks). The platform runs tool calls inside:
- Isolated containers per tenant (no cross-tenant access possible)
- Rate-limited API gateway (prevents abuse and runaway costs)
- Schema validation before execution (prevents hallucinated tool calls from actually firing)
- Dry-run mode for high-risk actions before committing

### Idea 4: Guardrails as a Service (3-Layer Safety)
A dedicated Guardrails Pipeline sits between LLM output and tool executor:
- Layer 1 — Input Classifier: blocks prompt injection, jailbreaks, PII leakage
- Layer 2 — Output Validator: checks LLM response against business-defined rules (JSON schema, allowed action list, confidence threshold)
- Layer 3 — Human-in-the-Loop Escalation: for flagged high-risk actions (e.g., "delete all records"), route to human approval queue before execution

### Idea 5: Full Audit Trail for Observability
Every agent decision (prompt sent, tool called, output generated, action taken) is logged as an immutable trace in an append-only store. Businesses can:
- Replay any interaction step-by-step
- See exactly which retrieved memory fragments influenced the LLM
- Set alerts for anomalous agent behavior patterns

---

## KEY USER PERSONAS

1. Business Admin — configures agents, sets tool permissions, views cost dashboard, reviews audit logs
2. End User — chats with the agent via embedded widget, mobile app, or REST API
3. Platform Ops (your team) — monitors all tenants, flags anomalies, manages LLM API quotas

---

## SCORING-CRITICAL AREAS (GO DEEP HERE)

Based on the problem statement, judges specifically call out:

1. Safety & Auditability — "scored seriously, not treated as an afterthought"
   → Describe 3+ concrete mechanisms, not just "we use guardrails"

2. Cost Control — "show you've thought about managing it"
   → Provide specific strategies: caching, model selection, rate limiting, token budgets

3. Multi-tenant Isolation — "one business's data, agents, or usage spikes should not affect another's"
   → Explain namespace isolation, resource quotas, separate vector stores

4. Observability — "why an agent made a given decision, not just that it made one"
   → Describe trace structure with prompt + retrieved context + decision + action

---

## CLOUD PLATFORM RECOMMENDATION: GCP (Google Cloud Platform)

Justification:
| Need                     | GCP Service              | Why GCP Wins Here                            |
|--------------------------|--------------------------|----------------------------------------------|
| LLM Inference            | Vertex AI (Gemini APIs)  | Native, managed, no cold start               |
| Vector Search            | Vertex AI Vector Search  | Fully managed, scales automatically          |
| Agent Orchestration      | Cloud Run                | Per-request billing, auto-scales to zero     |
| Message Queue            | Cloud Pub/Sub            | High-throughput, multi-tenant friendly       |
| Audit Logging            | Cloud Logging + BigQuery | Append-only, queryable, tamper-evident       |
| Secrets / Tool Auth      | Secret Manager           | Per-tenant secret namespacing                |
| API Gateway              | Apigee                   | Rate limiting, tenant auth, metering         |
| Monitoring               | Cloud Monitoring + Trace | End-to-end distributed tracing               |
| Database                 | Firestore                | Per-tenant document collections, real-time   |
| Semantic Cache           | Memorystore (Redis)      | Sub-millisecond cache lookups                |

GCP's tight Vertex AI integration means you avoid stitching together third-party LLM APIs with separate infrastructure — everything is native, IAM-controlled, and audit-logged by default.

---

## HIGH-LEVEL ARCHITECTURE SUMMARY

[Business Admin Dashboard (React Web App)]
         |
         v
[Apigee API Gateway] — Rate limiting, JWT auth, tenant routing, usage metering
         |
         v
[Agent Orchestration Service (Cloud Run — stateless, auto-scaling)]
         |
    +----+------------------------------------------+
    |                                               |
    v                                               v
[Memory & Context Layer]                   [Guardrails Pipeline (Cloud Run)]
  - Embedding model (Vertex AI)              - Layer 1: Input Classifier
  - Vector Search (Vertex AI)                - Layer 2: Output Validator
  - Conversation store (Firestore)           - Layer 3: Human Escalation Queue
    |                                               |
    v                                               v
[LLM Router (Cloud Run)]                   [Tool Executor (Cloud Run)]
  - Model selection logic                    - Sandboxed per-tenant containers
  - Semantic cache check (Redis)             - Schema validation before execution
  - Calls Vertex AI Gemini / Claude API      - External API calls (HTTP)
    |
    v
[Audit & Observability Layer]
  - Cloud Logging (immutable step traces)
  - BigQuery (analytics, replay queries)
  - Cloud Trace (distributed tracing)
  - Cloud Monitoring + Alerting dashboards

    |
    v
[Cost Metering Service]
  - Per-tenant token usage tracking
  - Quota enforcement (hard + soft limits)
  - Monthly invoice data export

---

## SECTION-BY-SECTION WRITING STRATEGY

| Section | Key Message                              | Depth Level |
|---------|------------------------------------------|-------------|
| S1      | Enterprise pain: building agents in-house is unsafe, expensive, slow | Medium |
| S2      | AgentForge as PaaS for AI agents         | Low (accessible) |
| S3      | Full architecture diagram with flows     | HIGH        |
| S4      | Justify every tech choice with problem fit | HIGHEST   |
| S5      | Per-tenant isolation + LLM throttling    | High        |
| S6      | Tenant data isolation, secrets, PII scrub | HIGHEST    |
| S7      | Actual token/compute cost numbers        | High        |
| S8      | Async queues, graceful LLM fallback      | Medium      |
| S9      | Per-decision traces, anomaly detection   | High        |
| S10     | Honest limits + roadmap                  | Medium      |

---

## QUICK CHECKLIST BEFORE SUBMISSION

[ ] Architecture diagram clearly shows tenant isolation boundary
[ ] Every tech choice has a "why for this problem" justification
[ ] Guardrails section mentions at least 3 concrete safety mechanisms
[ ] Cost section has actual numbers (even rough estimates)
[ ] Observability section explains how to debug a bad agent decision
[ ] Security section mentions encryption at rest + in transit + access control
[ ] Resilience section covers LLM API failure fallback
[ ] Problem understanding is written in own words, not copied from statement

``

# File: BOC2.0_Proposal\COVER_SHEET.md

``markdown
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

``

# File: BOC2.0_Proposal\Section_01_Problem_Understanding.md

``markdown
# Section 1 — Problem Understanding

## Team: [Your Team Name]
## Scenario: 5 — AI Agent Platform for Business Automation

---

## The Problem in Our Own Words

Businesses today face a significant and growing challenge: they want AI to do more than just answer questions. They need AI that can autonomously complete multi-step tasks — scheduling meetings, drafting reports, querying internal databases, triggering workflows in other software, and handling customer queries end-to-end — without a human having to supervise each step.

The problem is that building this capability in-house is prohibitively hard. A business that wants to deploy an "AI customer support agent" doesn't just need to call an LLM API. They need to solve:
- How does the agent remember what the customer said last week?
- How does it safely look up the customer's order status from the internal database?
- What stops it from accidentally triggering a refund for the wrong order?
- How does the business know *why* the agent said something wrong so they can fix it?
- How do they control how much it costs per month?

None of these questions have easy off-the-shelf answers. Companies that try to build this themselves spend months on infrastructure, security reviews, and debugging — before they've even written the business logic they actually care about.

**The specific gap we are addressing:**  
There is no widely available, multi-tenant platform that provides businesses with a complete, production-ready environment to deploy AI agents — with memory, tool-calling, safety guardrails, cost controls, and full observability — without building any of that infrastructure themselves.

---

## Who Is Affected and How

### Businesses (Platform Customers)
Small-to-medium businesses are most severely affected. Large enterprises can afford to hire ML engineers and DevOps teams to build agent infrastructure. Smaller businesses cannot. They're left choosing between:
- Using a basic chatbot (which can't take actions or remember context)
- Paying a large vendor for a proprietary, black-box solution with no transparency
- Attempting to build it themselves and getting stuck on the infrastructure

The result: businesses that could genuinely benefit from AI automation are either locked out or exposed to unsafe, untested agent deployments.

### End Users (Customers of Those Businesses)
End users interacting with business AI agents are affected when:
- The agent gives confidently wrong answers because it has no memory of prior context
- The agent takes unintended actions (e.g., cancels a subscription when asked to pause it)
- There is no way to escalate or override the agent's decision

### Platform Operators (The AgentForge Team)
Without the right infrastructure, monitoring multi-tenant agent behavior becomes impossible. A single misbehaving tenant's agent can flood LLM quotas, affecting all other tenants. Without observability, diagnosing the root cause of agent failures becomes a guessing game.

---

## Why Existing Solutions Fall Short

| Existing Option              | Limitation                                                                 |
|------------------------------|----------------------------------------------------------------------------|
| Raw LLM APIs (OpenAI, Gemini)| No memory, no tool-calling infra, no guardrails, no multi-tenancy         |
| LangChain / LlamaIndex       | Framework, not a platform — requires significant engineering to productionize |
| Azure AI Foundry / AWS Bedrock Agents | Tied to a single cloud ecosystem, limited cross-tenant isolation, limited custom guardrails |
| Building in-house            | 3–6 months of infrastructure work before any business logic, ongoing ops burden |
| Generic chatbot platforms    | Cannot take real-world actions, no tool integration, no memory across sessions |

None of these give a business a "configure and deploy" path to a safe, observable, cost-controlled AI agent.

---

## Our Specific Focus

Rather than trying to solve every edge case in the problem statement shallowly, our team focuses on three interconnected pillars:

### Pillar 1: Safe Tool-Calling with Guardrails
We go deep on the mechanism that allows agents to actually *do things* — call APIs, query databases, send messages — safely. This is the hardest part to get right, and the part most likely to cause real-world harm if done wrong.

### Pillar 2: Tenant-Isolated Memory with RAG
We go deep on how agent memory works in a multi-tenant context, ensuring no tenant's data ever leaks into another's context, while keeping memory retrieval fast and cost-efficient.

### Pillar 3: Per-Decision Audit Trails
We go deep on the observability layer — specifically how every agent decision is traced, stored, and made queryable, so a business can answer "why did the agent do that?" for any interaction in history.

We explicitly acknowledge that we are not going deep on: UI/UX of the agent builder dashboard, billing and payment processing for the platform itself, or fine-tuning LLM models. These are real components of a production system but outside our chosen depth for this proposal.

``

# File: BOC2.0_Proposal\Section_02_Solution_Overview.md

``markdown
# Section 2 — Proposed Solution Overview

## Team: [Your Team Name]
## Scenario: 5 — AI Agent Platform for Business Automation

---

## Plain-Language Summary

We are building **AgentForge** — a cloud platform where any business can sign up, configure an AI agent suited to their use case, and have it running in production within hours — with full memory of past interactions, the ability to call their own systems and APIs, built-in safety guardrails, and a complete audit log of every decision the agent ever made.

The business never has to worry about hosting a language model, managing vector databases, writing guardrail logic, or figuring out how to keep their agent's costs under control. AgentForge handles all of that. The business focuses only on what their agent should do — we handle how it safely does it.

---

## What AgentForge Provides

### For the Business (Admin)
- A web dashboard to create and configure AI agents
- Connect the agent to their own tools: CRM, helpdesk, database, email, custom API
- Set guardrails: what the agent is and isn't allowed to do
- View a live cost dashboard: tokens used, actions taken, estimated monthly bill
- Review full audit logs: every conversation, every decision, every action taken

### For the End User (Customer)
- Interact with the agent through a chat widget embedded on the business's website
- Or call the agent through a REST API (for mobile apps, internal tools)
- The agent remembers past interactions within a session and across sessions
- If the agent is unsure or the action is risky, it escalates to a human seamlessly

### For the Platform Team (AgentForge Ops)
- A global monitoring dashboard showing all tenants
- Anomaly alerts: agents making unusual numbers of tool calls, spiking in token usage, failing repeatedly
- Per-tenant resource quotas enforced automatically
- LLM API usage centralized and metered

---

## How It Works (Simple Flow)

1. A business signs up for AgentForge and creates an agent named "Support Bot"
2. They connect it to their helpdesk API and their product FAQ document
3. A customer sends a message: "What's the status of my order #1234?"
4. AgentForge:
   a. Checks the conversation history and retrieves relevant memory
   b. Runs the message through the input safety classifier
   c. Sends the context + message to the LLM (routed to the appropriate model based on complexity)
   d. The LLM decides to call the "get_order_status" tool
   e. AgentForge validates the tool call against the business's allowed-action list
   f. Executes the tool call in an isolated container
   g. Returns the result to the LLM
   h. LLM generates a response: "Your order #1234 shipped yesterday and will arrive Thursday"
   i. Output is validated against the output safety rules
   j. Every step is logged as an immutable audit trace
5. The customer receives the response in under 2 seconds

---

## What Makes AgentForge Different

| Capability                  | Generic LLM API | LangChain (DIY) | AgentForge       |
|-----------------------------|-----------------|-----------------|------------------|
| Multi-tenant isolation       | No              | No              | Yes              |
| Production-ready memory/RAG  | No              | Requires work   | Yes, out of box  |
| Guardrails pipeline          | No              | Requires work   | Yes, 3-layer     |
| Cost metering per tenant     | No              | No              | Yes              |
| Full audit trail             | No              | No              | Yes              |
| Human escalation queue       | No              | No              | Yes              |
| Deploy in < 1 hour           | Kind of         | No              | Yes              |

---

## The Platform in One Sentence

> AgentForge turns the complex, risky, expensive infrastructure of running AI agents into a simple configuration problem — so businesses can focus on what their agents do, not how they work.

``

# File: BOC2.0_Proposal\Section_03_Architecture_Diagram.md

``markdown
# Section 3 — Architecture Diagram (Description & Data Flows)

## Team: [Your Team Name]
## Scenario: 5 — AI Agent Platform for Business Automation

---

## NOTE
This file describes the architecture in text form. Your actual diagram must be created in draw.io, Lucidchart, Excalidraw, or Figma and submitted as PDF/PNG. Use this document as the blueprint for drawing the diagram.

---

## Diagram Structure: Layers

The architecture is organized into 5 horizontal layers. Draw each as a distinct band/zone in your diagram.

---

### Layer 0: External Actors (outside the cloud boundary)
Components:
- Business Admin (browser user)
- End User (browser / mobile app / API consumer)
- External APIs (third-party tools the agent can call — e.g., a CRM, helpdesk, payment system)

Draw these OUTSIDE the cloud boundary box. Label them clearly as "external."

---

### Layer 1: Entry / API Gateway
Component: Apigee API Gateway (GCP)

Data flows IN:
- Business Admin → HTTPS request with JWT token → Apigee
- End User → HTTPS chat message with tenant API key → Apigee

Apigee does:
- JWT/API key validation (authenticate the request)
- Tenant identification (which business does this key belong to?)
- Rate limiting (enforce per-tenant request quotas)
- Usage metering (count requests for billing)
- Route to correct backend service

Data flows OUT:
- Apigee → Admin Dashboard Backend (for config changes)
- Apigee → Agent Orchestration Service (for agent invocations)

Label the arrows:
- "Authenticated HTTPS with JWT"
- "Tenant-tagged routed request"

---

### Layer 2: Core Agent Processing
This is the heart of the system. Four services run here, all on Cloud Run (serverless containers).

#### 2a. Agent Orchestration Service (Cloud Run)
This is the "conductor" — it coordinates all other services per agent invocation.

Flow:
1. Receives tenant-tagged request from Apigee
2. Loads agent configuration from Firestore (allowed tools, system prompt, model choice)
3. Calls Memory & Context Layer to get relevant history
4. Sends assembled prompt to Guardrails Pipeline (input check)
5. Sends approved prompt to LLM Router
6. Receives LLM response, sends to Guardrails Pipeline (output check)
7. If LLM wants to call a tool → calls Tool Executor
8. Assembles final response → logs audit trace → returns to user

Arrows to draw:
- Orchestration → Firestore: "Load agent config"
- Orchestration → Memory Layer: "Retrieve relevant context"
- Orchestration → Guardrails (input): "Validate user input"
- Orchestration → LLM Router: "Send assembled prompt"
- Orchestration → Guardrails (output): "Validate LLM response"
- Orchestration → Tool Executor: "Execute tool call request"
- Orchestration → Audit Logger: "Write decision trace"

#### 2b. Memory & Context Layer (Cloud Run + Vertex AI Vector Search + Firestore)
Handles all agent memory operations.

Sub-components (draw as a box with 3 internal parts):
1. Embedding Service: converts user message into a vector using Vertex AI embedding model
2. Vector Search: queries the tenant's isolated vector store for top-K relevant context chunks
3. Conversation Store: Firestore collection per tenant, stores last N conversation turns

Data flows:
- Receives: raw user message + tenant ID
- Calls: Vertex AI Embedding Model → get vector
- Queries: Vertex AI Vector Search (tenant-scoped index) → get top-5 relevant passages
- Reads: Firestore (last 10 conversation turns for this user)
- Returns: assembled context block to Orchestration Service

Arrows to draw:
- Memory Layer → Vertex AI Embedding: "Embed user query"
- Memory Layer → Vertex AI Vector Search: "Similarity search (tenant index)"
- Memory Layer → Firestore: "Read conversation history"

#### 2c. LLM Router (Cloud Run + Memorystore Redis + Vertex AI)
Decides which model to use and whether to use a cached response.

Logic flow:
1. Check semantic cache in Redis: has a very similar question been answered before for this tenant?
   - If cache HIT → return cached response (no LLM call, cost = ~$0)
   - If cache MISS → proceed
2. Classify prompt complexity:
   - Simple / factual → Gemini Flash (cheapest, fastest)
   - Moderate reasoning → Gemini 1.5 Pro
   - Complex / multi-step reasoning → Gemini 1.5 Pro or Claude 3.5 Sonnet via API
3. Call selected LLM via Vertex AI or direct API
4. Store response in semantic cache (with TTL = 24 hours)
5. Log token usage to Cost Metering Service

Arrows to draw:
- LLM Router → Memorystore Redis: "Check/write semantic cache"
- LLM Router → Vertex AI Gemini Flash: "Simple query call"
- LLM Router → Vertex AI Gemini Pro: "Complex query call"
- LLM Router → Anthropic API: "Fallback / overflow call"
- LLM Router → Cost Metering: "Log token usage"

#### 2d. Guardrails Pipeline (Cloud Run)
Two-phase safety layer: runs before and after LLM.

Phase 1 — Input Validation:
- Prompt injection detector (classifier model, checks for "ignore previous instructions" patterns)
- PII scrubber (regex + NER model, removes phone numbers, SSNs, emails before sending to LLM)
- Business rule check (is this topic allowed for this agent? e.g., a support agent shouldn't answer competitor pricing questions)
- If any check fails → return safe error message to user, log the blocked attempt

Phase 2 — Output Validation:
- JSON schema check (if LLM produces a tool call — does it match the expected schema?)
- Confidence threshold check (if LLM output contains uncertainty markers below threshold → escalate)
- Sensitive action gate (if tool call is in the "high-risk" category → push to human approval queue instead of executing)
- If output passes → forward to Tool Executor (if tool call) or return to user

Arrows to draw:
- Guardrails → Cloud Pub/Sub "Human Escalation": "High-risk action detected"
- Guardrails → Audit Logger: "Log blocked attempt"

---

### Layer 3: Tool Execution & External Integration
Component: Tool Executor Service (Cloud Run)

Each tool call runs in an ephemeral, isolated Cloud Run job:
- Container spins up with only the permissions for that tenant's configured tools
- Tool call is validated against allowed schema
- HTTP request is made to external API (CRM, helpdesk, database, etc.)
- Response is returned to Orchestration Service
- Container terminates

Secrets (API keys for external tools) are never stored in the container — they are retrieved at runtime from Secret Manager, namespaced by tenant ID.

Arrows to draw:
- Tool Executor → Secret Manager: "Fetch tool credentials (tenant-scoped)"
- Tool Executor → External CRM API: "GET /orders/{id}"
- Tool Executor → External Helpdesk API: "POST /tickets"
- Tool Executor → Any external API: labeled with the action type

Cloud Pub/Sub: Human Approval Queue
- Receives high-risk tool calls from Guardrails Pipeline
- Business Admin is notified (email / in-dashboard)
- Admin can Approve or Reject
- Approval triggers Tool Executor; Rejection logs the block

---

### Layer 4: Persistence, Audit & Observability
All components write here — this layer never takes writes from external users directly.

#### Firestore (per-tenant document collections)
- Agent configurations (system prompt, tools, model settings, guardrail rules)
- Conversation histories (per user session)
- Human approval queue items

#### Cloud Logging — Audit Trail (append-only)
Every agent step is written as a structured log entry:
```
{
  "trace_id": "uuid",
  "tenant_id": "business_A",
  "user_session_id": "session_xyz",
  "step": "llm_call",
  "timestamp": "2026-09-01T12:00:00Z",
  "prompt_tokens": 450,
  "completion_tokens": 120,
  "model_used": "gemini-flash",
  "retrieved_context_ids": ["chunk_12", "chunk_45"],
  "tool_called": null,
  "output_safety_passed": true
}
```
These logs are immutable — no service has delete permissions on the log bucket.

#### BigQuery — Analytics & Replay
- Audit logs are streamed to BigQuery via Logging export
- Businesses can query: "Show me all agent decisions in the last 30 days that involved a tool call"
- Platform Ops can query: "Which tenants have the highest token usage this week?"

#### Cloud Trace — Distributed Tracing
- Every request gets a trace ID propagated across all services
- Cloud Trace visualizes the full call chain (Apigee → Orchestration → Memory → LLM Router → Tool → Response)
- Latency breakdowns per component visible per request

#### Cloud Monitoring — Alerting
- Dashboard: per-tenant token usage, error rates, average latency, tool call success rates
- Alerts: agent failure rate > 5% for any tenant → PagerDuty notification
- Alerts: tenant token usage approaching quota → warning email to business admin

---

### Layer 5: Cost Metering Service
Component: Lightweight Cloud Run service + BigQuery

- Aggregates token usage logs from LLM Router
- Aggregates tool execution counts from Tool Executor
- Writes per-tenant daily usage summaries to BigQuery
- Powers the Business Admin cost dashboard
- Triggers quota enforcement (hard stop) when tenant exceeds monthly token budget

---

## Tenant Isolation Summary (Draw as a callout box)

All data is isolated at multiple levels:
- Firestore: each tenant has a separate top-level collection path (/tenants/{tenantId}/...)
- Vector Search: each tenant has a separate vector index
- Secret Manager: each tenant's secrets use the path /tenants/{tenantId}/tools/{toolName}/apiKey
- Cloud Run: tenant ID is injected as an environment variable and validated on every request
- IAM: service accounts are scoped to read only their own tenant's resources
- Logging: all logs are tagged with tenant_id, and log-based access policies restrict tenant admins to their own logs only

---

## System Boundary Summary

INSIDE GCP boundary:
- All Cloud Run services
- Apigee
- Vertex AI (Gemini, Vector Search, Embedding)
- Firestore
- Cloud Logging, BigQuery, Cloud Trace, Cloud Monitoring
- Memorystore (Redis)
- Secret Manager
- Cloud Pub/Sub

OUTSIDE GCP boundary (draw outside the box):
- Business Admin's browser
- End User's browser / mobile app
- External tool APIs (CRM, helpdesk, payment gateways, etc.)
- Anthropic Claude API (if used as fallback LLM)

``

# File: BOC2.0_Proposal\Section_04_Technology_Choices.md

``markdown
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

``

# File: BOC2.0_Proposal\Section_05_Scalability_Performance.md

``markdown
# Section 5 — Scalability & Performance

## Team: [Your Team Name]
## Scenario: 5 — AI Agent Platform for Business Automation

---

## The Nature of Load in This System

Unlike a simple web application where load grows predictably with user count, an AI agent platform has multiple distinct load patterns that must be handled differently:

**Pattern 1: Gradual baseline growth**
As more businesses onboard, the steady-state request volume grows proportionally. This is standard horizontal scaling.

**Pattern 2: Per-tenant spikes**
A single business runs a product launch or marketing campaign. Their agent goes from 10 requests/minute to 2,000 requests/minute within minutes — while other tenants remain at baseline. The system must absorb this spike for that tenant without degrading any other tenant's experience.

**Pattern 3: Global concurrency spikes**
Multiple tenants spike simultaneously (e.g., Monday morning across time zones). Total system load increases without a single clear "hotspot."

**Pattern 4: LLM API rate limits**
Unlike compute resources, LLM APIs have hard rate limits (tokens per minute, requests per minute). Scaling the platform aggressively does not help if we hit the upstream LLM API ceiling — we need active management of this constraint.

Our architecture addresses all four patterns.

---

## How Each Service Scales

### Apigee API Gateway
- Apigee is fully managed and globally distributed — it scales horizontally without any configuration from us.
- Per-tenant rate limits are enforced at the gateway: even if a tenant has no rate limit contractually, a hard ceiling (e.g., 500 req/min) prevents any single tenant from overwhelming backend services.
- During a global spike, Apigee begins queuing or shedding requests per-tenant before they reach backend services, protecting the LLM budget.

### Agent Orchestration Service (Cloud Run)
- Configured with: min instances = 2 (always warm), max instances = 200, concurrency per instance = 10 (because each request holds an LLM call in flight)
- Scales from 2 to 200 instances in under 60 seconds via Cloud Run's automatic scaling
- Each instance is stateless — no session state stored in memory, all state in Firestore/Redis
- Scaling is per-service: only the Orchestration Service scales during a request spike, not all services simultaneously

### Memory & Context Layer (Cloud Run)
- Typical latency: 80–150ms (embedding call + vector search + Firestore read)
- Vector Search scales automatically: Vertex AI Vector Search is a managed service with autoscaling node pools
- Firestore reads are sub-10ms at any scale for document lookups by ID
- This layer is not a bottleneck under normal load; scales with Cloud Run auto-scaling

### LLM Router (Cloud Run + Redis)
- The semantic cache (Redis) handles 25–40% of queries with <5ms latency, dramatically reducing LLM API pressure during spikes
- Model selection is the primary mechanism for managing LLM API rate limits:
  - During high load: classifier threshold is lowered — more requests routed to Gemini Flash (10x higher rate limit than Pro)
  - If Gemini API is approaching rate limit: router queues Pro-tier requests (via Pub/Sub) rather than failing them
  - Hard rate limit reached: graceful degradation — router returns cached/approximate responses from Redis with a disclaimer, rather than returning errors

**LLM Token Budget Management:**
- Each tenant has a monthly token quota stored in Firestore
- Every LLM call decrements the tenant's available quota atomically (using Firestore transactions)
- At 80% quota: warning notification sent to tenant admin
- At 100% quota: agent returns a friendly "usage limit reached" message rather than calling LLM
- This prevents one tenant from consuming the entire platform's LLM allocation

### Tool Executor (Cloud Run Jobs)
- Each tool call runs as a short-lived Cloud Run Job (not a long-running service)
- Jobs are isolated: one tenant's tool calls cannot consume containers belonging to another tenant
- Concurrency limit per tenant: configurable per plan (e.g., max 10 simultaneous tool calls per tenant)
- External API calls that timeout (>10 seconds) are terminated and reported as failures — no indefinite hanging

### Guardrails Pipeline (Cloud Run)
- Lightweight ML classifiers — CPU-based inference, fast (~20ms per check)
- Scales linearly with Orchestration Service — no special scaling considerations

---

## Latency Budget: End-to-End Request

For a typical agent request (no tool call, cache miss):

| Step                          | Expected Latency | Notes                          |
|-------------------------------|-----------------|--------------------------------|
| Apigee auth + routing         | 10–20ms         | Edge-located                   |
| Orchestration: config load    | 5–10ms          | Firestore cached in Redis      |
| Embedding generation          | 30–50ms         | Vertex AI embedding model      |
| Vector Search retrieval       | 20–40ms         | ANN search, ~50ms P99          |
| Conversation history load     | 5–10ms          | Firestore document read        |
| Guardrails (input)            | 15–25ms         | Lightweight classifier         |
| LLM call (Gemini Flash)       | 400–800ms       | Dominant latency factor        |
| Guardrails (output)           | 10–20ms         |                                |
| Audit log write (async)       | 0ms (async)     | Written via Pub/Sub background |
| Response serialization        | 5ms             |                                |
| **Total (P50 estimate)**      | **~550ms**      |                                |
| **Total (P95 estimate)**      | **~1,200ms**    | With Pro model + cold start    |

For requests with a semantic cache hit:
- Total latency: ~50ms (embedding + Redis lookup + response)

---

## Performance for Streaming Responses

For user-facing chat interfaces, 800ms "thinking time" before any text appears feels slow. We support **streaming responses** (Server-Sent Events):
- As soon as the LLM begins generating tokens, they are streamed back to the end user in real time
- This means the user sees text appearing within 200–300ms of the LLM starting
- Even if total response generation takes 2 seconds, the UX feels fast because the first tokens appear quickly

---

## Multi-Tenant Spike Isolation: Concrete Mechanism

The key mechanism ensuring one tenant's spike doesn't affect others:

1. Apigee enforces per-tenant rate limits before any backend processing
2. LLM Router maintains per-tenant token buckets in Redis — each tenant's LLM calls are metered independently
3. Tool Executor has per-tenant concurrency limits (Cloud Run Jobs with namespace-based quotas)
4. Firestore reads are per-tenant document paths — no shared scan queries that could be slowed by another tenant's data volume
5. Vector Search uses per-tenant indexes — a spike in one tenant's queries does not affect search latency for others

If Tenant A spikes to 10x normal volume and hits their rate limit at the gateway, their requests are queued or rejected. Tenants B, C, D experience no degradation whatsoever because they were never competing for the same resources — they have separate quotas, separate indexes, and separate tool execution slots.

``

# File: BOC2.0_Proposal\Section_06_Security_Privacy.md

``markdown
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
- Each tenant has a **separate Vertex AI Vector Search index** — there is no shared index to accidentally query
- Firestore uses the path `/tenants/{tenantId}/...` — a service account for Tenant A literally cannot construct a valid path to Tenant B's data
- Secret Manager uses path-based namespacing: `/tenants/{tenantId}/tools/{toolName}/apiKey` — Tenant A's service account is IAM-bound to only read secrets under its own tenantId prefix
- Cloud Run services receive the tenantId as a verified, gateway-injected header — they never trust a tenantId from the request body (which could be spoofed)

**Query-time enforcement:**
- Every Firestore query includes a `.where('tenantId', '==', verifiedTenantId)` filter — even if the path structure already isolates the data, the filter adds a defense-in-depth layer
- Vector Search queries specify the tenant's index ID explicitly — the service account does not have permission to query any other index

**Testing:**
- Our test suite includes "cross-tenant bleed tests": mock requests from Tenant A attempting to access Tenant B's data at every layer, verifying 403 Forbidden at each boundary

---

## 2. Encryption

### Data In Transit
- All external communication (end-user browser to Apigee, business admin browser to admin API) uses **TLS 1.3 exclusively** — TLS 1.2 is disabled
- All internal GCP service-to-service communication uses **Google's internal encrypted network** (automatic mTLS via Cloud Run service mesh)
- External tool API calls from Tool Executor to third-party APIs: TLS 1.2 minimum enforced; connections to endpoints without valid certificates are rejected

### Data At Rest
- Firestore: AES-256 encryption at rest (GCP default, Google-managed keys)
- Vertex AI Vector Search indexes: encrypted at rest (GCP default)
- Cloud Logging and BigQuery: AES-256 encryption at rest
- Secret Manager: secrets are encrypted with **Cloud KMS customer-managed encryption keys (CMEK)** — this means even Google cannot read the secrets without the tenant's KMS key
- Memorystore (Redis): encrypted at rest and in transit (AUTH enabled, TLS enabled)

### Encryption Key Management
- Platform-level encryption uses Google-managed keys (GMEK) — adequate for most data
- Tenant API credentials (tool keys) use **Customer-Managed Encryption Keys (CMEK)** via Cloud KMS — each tenant can optionally bring their own KMS key, meaning only they can decrypt their secrets

---

## 3. Authentication & Authorization

### End User to Platform
- End users authenticate to their business's agent via the business-issued API key or JWT
- The business controls who gets this key — AgentForge does not manage end-user identities
- All tokens have a maximum 24-hour TTL; refresh tokens are rotated on each use

### Business Admin to Dashboard
- Business admins authenticate via **Google OAuth 2.0 (via Cloud Identity)** or SAML SSO for enterprise customers
- MFA is enforced for all admin accounts — no exceptions
- Admin sessions are logged to Cloud Audit Logs (admin activity logs) — every configuration change, key rotation, and approval action is attributable to a specific admin identity

### Service-to-Service (Internal)
- All Cloud Run services use **dedicated service accounts** with minimal IAM permissions (principle of least privilege)
- Example: The Memory Layer service account can: read Vertex AI Vector Search, read/write its own Firestore path, write to Cloud Logging. It cannot: access Secret Manager, call Vertex AI LLM, or write to any other tenant's Firestore path
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
- Cloud Logging agent traces do NOT include raw user message text — they include the scrubbed version and a reference to the secure PII store
- BigQuery audit tables contain only scrubbed messages; PII lookups require a separate privileged query with explicit access justification

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
- The Tool Executor publishes the pending call to the Human Approval Queue (Pub/Sub)
- The call is only executed after explicit admin approval

---

## 6. Access to Audit Logs

- Business admins can view their own tenant's audit logs via the dashboard
- They cannot view other tenants' logs — enforced via Cloud Logging log-based access conditions tied to tenant_id field
- Platform Ops can view all tenants' logs for incident response — all such access is itself logged (who accessed what, when, with what justification)
- Audit logs in BigQuery are immutable: the service account that writes logs has INSERT-only permissions; no service can UPDATE or DELETE audit log rows

---

## 7. Compliance Posture

| Requirement          | How We Address It                                                      |
|----------------------|------------------------------------------------------------------------|
| GDPR Right to Erasure | Per-tenant data deletion pipeline: deletes Firestore docs, removes vector embeddings, purges logs older than 30 days via API |
| Data Residency       | GCP region selection at tenant onboarding; data stays in chosen region |
| Audit Trail          | Immutable Cloud Logging + BigQuery; all admin actions are logged       |
| Incident Response    | Cloud Monitoring alert → PagerDuty → on-call engineer within 15 min   |
| Vulnerability Management | Cloud Security Command Center active for all GCP resources        |

---

## Security Summary

The key principle throughout our security design is **defense in depth with structural enforcement**: wherever possible, security is enforced by the infrastructure's structure (separate indexes, path-based namespacing, allowlist-only tooling) rather than relying solely on application-level checks that could be bypassed by a code bug. Policy-level controls (IAM, network rules) add additional layers on top of structural controls, and logging ensures that any anomaly is detectable.

``

# File: BOC2.0_Proposal\Section_07_Cost_Estimate.md

``markdown
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

``

# File: BOC2.0_Proposal\Section_08_Availability_Resilience.md

``markdown
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

### Failure: Vertex AI Gemini API is Degraded or Rate-Limited

**What happens without mitigation:** All agent requests fail; users receive errors.

**Our response (cascading fallback):**
1. LLM Router detects elevated error rate (>5% in 60s) or latency (>3s P99) from Gemini
2. Automatically switches to Claude 3.5 Sonnet via Anthropic API for complex queries
3. For simple queries: force-routes to semantic cache — return the closest cached response with a disclaimer ("Based on a similar previous question...")
4. If all LLM APIs are degraded: return a graceful "Agent temporarily unavailable, try again in a moment" message — never silently return a stale/wrong answer
5. LLM Router implements **circuit breaker pattern**: after 10 consecutive failures to an API, it opens the circuit (stops calling that API for 60 seconds), preventing timeout pile-up

**Detection:** Cloud Monitoring alert triggers on Gemini API error rate >3% — PagerDuty notification within 2 minutes.

---

### Failure: Firestore is Temporarily Unavailable

**What happens:** Agent configurations and conversation history cannot be read.

**Our response:**
1. Agent configurations are cached in Memorystore (Redis) with a 5-minute TTL — most requests can proceed using the cached config without hitting Firestore
2. Conversation history (last 10 turns) is also cached in Redis per session ID with a 30-minute TTL — active sessions continue seamlessly
3. New sessions (no cache entry yet) return a graceful "starting fresh context" response — the agent works but without history, which is clearly better than failing
4. Write failures (saving new conversation turns): these are queued to Pub/Sub and retried automatically when Firestore recovers — no turn is permanently lost

**Data durability:** Firestore uses multi-region replication within a GCP region (us-central1). A single availability zone failure does not cause data loss. RPO (recovery point objective) = 0 — no data is lost. RTO (recovery time objective) = <60 seconds for automatic failover to another AZ.

---

### Failure: Memorystore (Redis) is Unavailable

**What happens:** Semantic cache and configuration cache are unavailable.

**Our response:**
1. LLM Router detects cache connection failure and switches to **cache-bypass mode** — all requests go directly to the LLM
2. Config cache miss: Orchestration Service reads agent config directly from Firestore (adds ~10ms latency, not a correctness issue)
3. Effect: higher LLM API costs and slightly higher latency, but zero correctness impact
4. Redis is configured in **high-availability mode** (Memorystore with replica enabled) — automatic failover to replica within 1–2 seconds if primary fails

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
| Vector Search indexes   | Weekly snapshot export | 4 weeks | Re-import from snapshot |
| Secret Manager          | Versioned (every change) | 90 days | Roll back to any previous version |
| Cloud Logging / BigQuery | Continuous streaming | Indefinite | No recovery needed; append-only |
| Redis cache             | Not backed up | N/A | Cache is ephemeral; rebuild from Firestore on restart |

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
| LLM API degraded            | Higher latency or fallback    | Circuit breaker + fallback LLM | Seconds  |
| Firestore unavailable       | Config from cache, writes queued | Redis cache + Pub/Sub queue | Minutes  |
| Redis unavailable           | Cache bypass mode             | Auto-failover to replica      | <60s     |
| Tool call timeout           | Graceful error message        | Hard timeout + LLM error prompt | N/A    |
| Agent tool loop             | Hard turn/session limit       | Automatic stop + alert        | Immediate|
| Cloud Run service crash     | New instances auto-started    | Health check + SIGTERM drain  | <30s     |
| Full region failure         | Complete outage               | Restore from backup to new region | 4h    |

``

# File: BOC2.0_Proposal\Section_09_Monitoring_Observability.md

``markdown
# Section 9 — Monitoring & Observability

## Team: [Your Team Name]
## Scenario: 5 — AI Agent Platform for Business Automation

---

## The Core Observability Challenge for AI Agents

Traditional web services are easy to monitor: did the request succeed? How long did it take? For AI agents, these questions are necessary but not sufficient. An agent can return a 200 OK response with a perfectly formatted answer that is factually wrong, takes an unintended action, or reveals information the user shouldn't have.

Our observability strategy therefore has two distinct layers:
1. **Infrastructure observability**: is the system up, fast, and error-free? (Standard)
2. **Agent behavior observability**: is the agent making correct, safe, and explainable decisions? (Novel)

---

## Layer 1: Infrastructure Observability

### Key Metrics (All in Cloud Monitoring)

**Request-level metrics (per tenant, per service):**
| Metric | Alert Threshold | Why It Matters |
|--------|----------------|----------------|
| Request error rate | >5% over 5 min | Systemic failure indicator |
| P99 end-to-end latency | >3,000ms | User experience degradation |
| LLM API error rate | >3% over 2 min | Triggers fallback logic |
| Tool call success rate | <90% over 10 min | External API degradation |
| Cache hit rate | <10% sustained | Suggests cache failure |
| Guardrails block rate | >20% in 5 min | Possible attack or misconfiguration |

**System-level metrics:**
| Metric | Alert Threshold | Why It Matters |
|--------|----------------|----------------|
| Cloud Run instance count | >150 instances | Unexpected traffic spike |
| Firestore read latency | >500ms P99 | Database degradation |
| Redis memory utilization | >85% | Cache eviction imminent |
| Pub/Sub queue depth (approval) | >100 messages | Human escalation backlog building |

### Dashboards (Cloud Monitoring)

**Platform Health Dashboard (Platform Ops view):**
- Real-time: total requests/min across all tenants, error rate, P99 latency
- LLM API usage: tokens/min by model, cost burn rate today vs. budget
- Circuit breaker status: which APIs are currently in open/closed state
- Active alerts list

**Per-Tenant Dashboard (Business Admin view):**
- Conversations today/this week/this month
- Agent success rate (% of conversations that completed without error)
- Tool call breakdown: which tools are being called, success rates, latency
- Cost tracker: tokens used today, estimated month-end cost vs. quota
- Guardrails activity: how many inputs were blocked today, categories

---

## Layer 2: Agent Behavior Observability (The Novel Part)

### Decision Traces — The Core Mechanism

Every agent invocation produces a **Decision Trace** — a structured, ordered log of every step the agent took to produce its output. This is not a single log entry; it is a linked chain of events (stored in Cloud Logging and queryable in BigQuery) that answers "why did the agent do X?"

**Decision Trace Structure:**
```
Trace ID: tr_8f3a9bc2
Tenant: business_support_co
Session: user_4821_session_92
Timestamp: 2026-09-01T10:14:32.001Z

Step 1 - INPUT_RECEIVED
  raw_message: "I want to cancel my subscription" [PII scrubbed: none]
  scrubbed_message: "I want to cancel my subscription"
  guardrails_input_check: PASS (no injection detected, no PII found)
  blocked: false

Step 2 - MEMORY_RETRIEVAL
  query_vector: [0.021, -0.144, ...] (768 dims, not stored)
  top_k_results:
    - chunk_id: doc_faq_45, score: 0.94, text: "To cancel, visit Settings > Billing > Cancel Plan"
    - chunk_id: doc_faq_12, score: 0.87, text: "Cancellations take effect at end of billing period"
    - chunk_id: conv_user_4821_turn_3, score: 0.81, text: "User previously inquired about pausing subscription"
  conversation_history_turns_included: 3

Step 3 - LLM_CALL
  model_used: gemini-flash (selected: query classified as 'informational')
  cache_hit: false
  prompt_token_count: 612
  completion_token_count: 148
  llm_response_type: TOOL_CALL_REQUEST
  tool_call_requested:
    tool: cancel_subscription
    parameters: { user_id: "[SECURE_REF:user_id_4821]", reason: "user_requested" }

Step 4 - GUARDRAILS_OUTPUT_CHECK
  check: schema_validation → PASS (valid tool call JSON)
  check: risk_classification → HIGH_RISK (cancel_subscription is in high-risk list)
  action: ESCALATE_TO_HUMAN (not AUTO_EXECUTE)
  escalation_queue_message_id: pub_sub_msg_9f2a

Step 5 - RESPONSE_TO_USER
  response: "I've noted your cancellation request and it has been sent for review. 
             You'll receive a confirmation within 2 hours. Is there anything else I can help with?"
  response_safety_check: PASS
  total_duration_ms: 892

Step 6 - HUMAN_APPROVAL_PENDING
  approval_queue_id: approval_7823
  admin_notified: true (email + dashboard badge)
  expires_at: 2026-09-01T22:14:32Z (12 hour SLA)
```

This trace answers:
- **Why did the agent respond the way it did?** (It retrieved 3 specific memory chunks that shaped the LLM's context)
- **What did the agent try to do?** (Call cancel_subscription)
- **Why wasn't it executed immediately?** (cancel_subscription is classified high-risk, requiring human approval)
- **What was the cost of this interaction?** (612 + 148 = 760 tokens on Gemini Flash)

---

### Querying Traces in BigQuery

Because all traces are streamed to BigQuery, business admins and Platform Ops can run arbitrary analytical queries:

**Example 1: Debug a specific bad outcome**
```sql
SELECT step_details
FROM agent_traces
WHERE trace_id = 'tr_8f3a9bc2'
ORDER BY step_order
```

**Example 2: Find all conversations where the agent tried to call a tool but was blocked**
```sql
SELECT trace_id, session_id, timestamp, tool_call_requested
FROM agent_traces
WHERE tenant_id = 'business_support_co'
  AND step_type = 'GUARDRAILS_OUTPUT_CHECK'
  AND action = 'ESCALATE_TO_HUMAN'
  AND timestamp > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
```

**Example 3: Which retrieved memory chunks are most influencing agent responses?**
```sql
SELECT chunk_id, COUNT(*) as times_retrieved, AVG(similarity_score) as avg_score
FROM agent_traces,
UNNEST(memory_retrieval_results) as result
WHERE tenant_id = 'business_support_co'
  AND timestamp > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
GROUP BY chunk_id
ORDER BY times_retrieved DESC
LIMIT 20
```
*This tells a business which of their knowledge base documents the agent relies on most — useful for knowing which ones to keep updated.*

---

### Agent Quality Metrics (Beyond Raw Infrastructure)

We track the following agent-behavior metrics per tenant, surfaced in their dashboard:

| Metric | Definition | Why It Matters |
|--------|-----------|----------------|
| Escalation rate | % of conversations routed to human approval | High rate = agent encountering many edge cases |
| Guardrails block rate | % of inputs or outputs blocked | Spike = potential attack or misconfigured guardrail |
| Tool call success rate | % of tool calls that returned expected data | Low rate = external API degradation |
| Cache hit rate | % of turns answered from semantic cache | Low rate = new query patterns emerging |
| Avg context retrieval score | Mean similarity score of retrieved memory chunks | Low score = knowledge base may need updating |
| Human approval resolution rate | % of escalated actions approved vs. rejected by admin | High rejection rate = agent misclassifying user intent |

---

### Anomaly Detection

Cloud Monitoring is configured with **metric anomaly alerts** (not just threshold alerts):

1. **Token usage anomaly**: if a tenant's hourly token usage is >3 standard deviations above their 14-day moving average → alert Platform Ops
2. **Guardrails spike**: if guardrail blocks spike >5× normal in 10 minutes → alert (possible prompt injection attack)
3. **Tool call loop detection**: if any single session triggers >20 tool calls in 5 minutes → flag for immediate investigation
4. **Latency regression**: if P99 latency increases >50% day-over-day → alert (likely upstream LLM degradation or new agent config issue)

---

### Distributed Tracing (Cloud Trace)

Every HTTP request propagates a `X-Cloud-Trace-Context` header through all services. Cloud Trace captures:
- Time spent in each service (Apigee, Orchestration, Memory, LLM Router, Guardrails, Tool Executor)
- Which service is the latency bottleneck for any given request
- Parallel vs. sequential execution patterns

**Example use:** A Platform Ops engineer sees P99 latency spiking. They open Cloud Trace, filter to the slowest 1% of requests, and see that the Tool Executor is consistently taking 7–8 seconds — pointing to a degraded external API, not an LLM issue. Without distributed tracing, this diagnosis would require grepping through multiple service logs.

---

## Monitoring Summary

Our observability design ensures that for any agent behavior or system event, we can answer:
1. **Did it happen?** (Cloud Logging + Cloud Monitoring alerts)
2. **When and how often?** (BigQuery analytics queries)
3. **Why?** (Decision traces with full prompt, retrieved context, tool call, and guardrail check)
4. **Where in the system did it occur?** (Cloud Trace distributed tracing)
5. **Was it anomalous?** (Metric anomaly detection in Cloud Monitoring)

``

# File: BOC2.0_Proposal\Section_10_Conclusion_Future.md

``markdown
# Section 10 — Conclusion & Future Improvements

## Team: [Your Team Name]
## Scenario: 5 — AI Agent Platform for Business Automation

---

## What We've Proposed

AgentForge is a multi-tenant AI agent platform built on GCP that allows businesses to deploy production-ready AI agents — with memory, tool-calling, safety guardrails, cost controls, and full observability — without building any of that infrastructure themselves.

Our proposal focused on three areas in depth:
1. **Safe tool-calling with a 3-layer guardrails pipeline** — the most dangerous part of an AI agent platform, done right
2. **Tenant-isolated RAG-based memory** — keeping agent context relevant, cheap, and completely isolated per business
3. **Per-decision audit trails** — making agent behavior explainable and debuggable for any interaction in history

We chose GCP as our platform specifically because Vertex AI's native integration with Vector Search, Gemini, and Cloud IAM removes the need to stitch together third-party services — reducing both latency and security surface area.

---

## Honest Limitations of This Proposal

Being candid about what this proposal does not fully solve is important. Judges value intellectual honesty over claiming a proposal is complete when it isn't.

### 1. LLM Non-Determinism
The fundamental challenge of LLM-based agents is that the same input can produce different outputs on different runs. Our guardrails pipeline reduces the risk of harmful outputs, but it does not eliminate the possibility of an agent giving a subtly wrong or misleading answer that passes all safety checks. Fully solving this problem requires:
- Human review of a sample of all interactions (ongoing quality review, not just security review)
- Fine-tuned models on domain-specific data for high-stakes use cases
- Adversarial testing (red-teaming) by domain experts

We have the logging infrastructure for this, but the review process itself is not designed in this proposal.

### 2. Complex Multi-Step Planning
This proposal handles single-turn tool calls and short multi-step sequences well. It is not optimized for agents that need to execute complex, multi-session plans spanning hours or days (e.g., "research this topic for 2 hours, then draft a report"). This would require a persistent task queue, long-running agent state management, and a more sophisticated planning architecture (e.g., ReAct or Plan-and-Execute patterns). These are extensions to the current architecture, not incompatibilities.

### 3. Knowledge Base Freshness
The RAG system retrieves from a vector index that is periodically re-indexed (we proposed weekly incremental updates). In a fast-changing business context (e.g., daily price changes, new products), weekly re-indexing is too slow. Real-time index updates for high-velocity knowledge bases would require a streaming indexing pipeline, which adds cost and complexity.

### 4. Agent Configuration UI
This proposal describes the technical backend in depth. The business-facing configuration dashboard (the UI for setting up agents, connecting tools, reviewing audit logs) is mentioned but not designed in detail. A poor UX on the configuration side would be a barrier to adoption regardless of how good the backend is.

### 5. Evaluation & Regression Testing Framework
When a business updates their agent's configuration or knowledge base, they need a way to test that the change doesn't break existing working behaviors. A regression testing framework (a set of test conversations with expected responses, run automatically on every config change) is not included in this proposal.

---

## What We Would Build Next

If given more time and resources, our priority roadmap would be:

### Priority 1: Streaming Response + Multi-Turn Planning
Implement full streaming token delivery (Server-Sent Events) to improve perceived latency to <300ms for first token. Then extend the Orchestration Service to support multi-step plans with a persistent task state stored in Firestore — allowing agents to break down complex requests into sub-tasks, execute them sequentially or in parallel, and report progress.

### Priority 2: Agent Marketplace
Allow businesses to share their agent configurations (anonymized) with other AgentForge customers. A "Customer Support Agent Template" pre-configured with common helpdesk tool integrations, guardrail rules, and a starter knowledge base — reducing onboarding time from hours to minutes. This creates a platform network effect.

### Priority 3: Fine-Tuning Pipeline
For high-volume tenants where Gemini Flash's quality is insufficient for their specific domain, provide a pipeline to fine-tune a smaller base model on their conversation history and knowledge base. A fine-tuned smaller model can outperform a general-purpose large model on specific tasks while costing 10–20× less per token.

### Priority 4: Real-Time Knowledge Base Updates
Build a streaming indexing pipeline (Cloud Pub/Sub → Embedding Service → Vector Search upsert) that updates the vector index within seconds of a knowledge base document being changed. This enables agents for fast-moving domains like e-commerce pricing or breaking news.

### Priority 5: Multi-Region Active-Active
As the platform grows to enterprise SLA customers, deploy the full stack in two GCP regions (e.g., us-central1 + europe-west1) with active-active traffic routing via Cloud Load Balancer and Firestore multi-region replication. This reduces RTO for regional failures from 4 hours to under 1 minute.

---

## Final Reflection

The most important design decision in this proposal is the choice to treat **safety and auditability as foundational, not bolt-on**. Every tool call is validated before execution. Every agent decision is traced. Every guardrail block is logged with context. This means the system's behavior is always explainable, even when the LLM's output isn't.

An AI agent that takes real-world actions — cancelling subscriptions, sending emails, querying sensitive data — must earn trust through transparency and control, not just through capability. AgentForge is designed around that principle.

---

## Team Reflection on Scope Choices

We explicitly chose NOT to go deep on:
- The UI/UX of the admin dashboard (real but out of scope for this technical proposal)
- LLM training/fine-tuning (out of scope per the problem statement)
- Billing and payment processing for the platform itself
- Edge cases in very niche industry compliance frameworks (HIPAA, PCI-DSS beyond encryption basics)

These are all real requirements for a production system, but spreading depth across all of them equally would have left the core architecture — tool-calling safety, RAG memory, and observability — underspecified. We believe the judging criteria reward depth in the right places over breadth everywhere.

``
