# AgentForge: Hackathon Demo Survival Plan

Implementation update (10 October 2026): Walkwave and Nova pages, customer-scoped demo orders, PDF/TXT uploads, enterprise API integration, SMTP sending, and manager review are now implemented. See `../walkwave/demo-runbook.md` for actual routes, seeded accounts, commands, and verified behavior. SMTP accepted a shipping-update test email; inbox placement still needs confirmation. The remaining text below records the original preparation plan.

Updated: 9 October 2026. Hackathon: tomorrow morning, 10 October 2026 (Asia/Colombo).

## The goal

Show every required capability through one reliable, prepared demonstration. Do not build a full enterprise platform tonight.

Use one fictional shoe company, Acme Shoes, fixed company settings, two prepared customer accounts, a small seeded order database, one policy PDF, and one demo inbox. Reuse the current chat, API, email, and escalation code wherever possible. Make only the fixes and connections needed for this story.

The demonstration has two integration modes:

- A ready-made floating chat bubble on the fictional company's website.
- One working enterprise API request showing how a company could build its own custom interface.

A single company page and an API-client demonstration are sufficient. No second frontend or general integration framework is required.

## What to show and how little to build

| Requirement | Demo evidence | Smallest implementation |
| --- | --- | --- |
| PDF upload | Upload a prepared return-policy PDF, then ask a question answered by that document. | Fix the current PDF ingestion path; keep existing knowledge retrieval. TXT remains supported. |
| Website bubble | Click the bottom-right circle on Acme Shoes and chat. | One page and one compact panel using the existing backend. Fixed branding is fine. |
| Enterprise API | Send a prepared authenticated request and show a real response. | Reuse /api/v1/chat; correct only the response/customer context needed for this request. |
| Customer database | Ask whether the signed-in customer's shoes shipped. | One read-only order lookup against seeded Firestore records, scoped to that customer and company. |
| Email workflow | Ask for the shipping update by email and show it in the inbox. | Reuse SMTP sending with actual order data and one verified demo recipient. |
| Human handoff | Ask for a $5,000 refund, show the pending ticket, and reject it. | Reuse the existing escalation and admin screens; make this prepared scenario reliable. |

## Prepared demo assets

- One Acme Shoes landing page, proposed route /demo-company within the existing app.
- Small selectable-text Acme_Return_Policy.pdf and matching TXT backup. Example policy: 30-day returns; refunds above $100 require manager review.
- Two customers mapped to existing authenticated user accounts, with one shoe order each.
- Example order A: ACME-1001, running shoes, Shipped, demo tracking reference.
- Example order B: ACME-1002, sneakers, Processing.
- Order fields: tenantId, customerId, orderId, productName, shippingStatus, trackingNumber, estimatedDelivery.
- One mailbox the team can inspect and SMTP configuration already prepared.
- One tenant API key held server-side and one saved API request.
- Separate browser sessions for customer and admin; a customer B session only if demonstrating the second account.

The company, orders, and tracking references are fictional sample data. Store orders in the existing database and actually retrieve them during the demonstration. No checkout, inventory system, courier integration, or enterprise database onboarding is needed.

## Implementation boundaries

### PDF

Reproduce the reported failure using the prepared PDF and fix extraction. The upload route currently calls pdf-parse as a function while package.json declares version 2.4.5; parser compatibility is a suspected cause to verify, not a confirmed diagnosis.

Also prevent upload from reporting indexed when no embeddings were stored. Verify the prepared PDF produces retrievable knowledge. Support text-based PDFs for this demo; scanned PDF OCR is deferred. Do not fake successful upload or silently answer from a hardcoded policy after ingestion fails.

### Bubble

Build one company page with a circular bottom-right launcher, open/close panel, welcome text, messages, loading state, and visible error handling. Use the existing authenticated customer session and show who is signed in. Company name, greeting, and color can be fixed configuration values; no branding-settings screen is needed.

Keep the sample website within the existing app to avoid cross-domain setup tonight. Present it as a sample website integration. A universal installation script is future work.

### Enterprise API

Show one request through an API client or a small server-side demo caller. Retain the current tenant-key authentication; never expose the secret key in the website's browser code.

For an order query, use the preconfigured trusted caller and customer mapping. Customer identity must come from the authenticated session or trusted company backend, not a name or ID typed into chat.

The current /api/v1/chat puts the generation result object inside reply. Make the demonstrated response easy to consume, for example a reply string plus actions. Do not build a new API version, onboarding flow, token platform, or complete conversation API tonight.

Explain that the enterprise owns its custom interface and calls this API from its backend. Showing the real request and response is enough to demonstrate that option.

### Order lookup

Add or adapt one narrow order-status tool. Query by company and authenticated customer; add order ID when supplied. The current broad database tool does not enforce customer ownership and its searchQuery is only logged, so do not use unfiltered results for the demo.

Use one seeded order per customer to avoid ambiguous matching. Customer A must not see B's order. Missing records should produce an honest 'I couldn't find that order in your account' response. Remove any instruction to invent operational facts for this flow.

No generic SQL execution, arbitrary collection access, multi-database connector framework, or separate external company database is required. Explain that the seeded database represents Acme's company data.

### Email

Use one explicit request: 'Email me that shipping update.' Resolve the recipient from the prepared customer's verified profile and send the retrieved order details using the existing tool. Show the received email and, if convenient, its existing action log.

Report tool failures accurately. Avoid automatically retrying a completed email send. No event triggers, workflow builder, bulk email, or arbitrary recipients are needed.

### Escalation

Make the prepared $5,000 refund request reliably create a real pending escalation using a simple server-side demo rule consistent with the policy. Do not leave the central presentation moment solely to model discretion.

Reuse the current admin review screen and reject the ticket. If a small customer-scoped status refresh is easy, show the rejection in the bubble. Otherwise finish this step by showing the persisted admin decision; automatic notification and full conversation pause/resume are optional.

Keep customer/order and admin access scoped to the demo company. Fix access checks on the paths used for this demonstration without expanding into a general security redesign. Refund payment execution remains simulated; no money moves.

## Work order tonight

1. Fix PDF ingestion and verify one PDF-derived answer; confirm TXT still works.
2. Prepare the two customer accounts and seed their orders; make one scoped lookup work.
3. Build the Acme Shoes page and floating panel around the existing chat.
4. Connect the shipping-update email and verify the inbox.
5. Make the prepared refund escalation and admin rejection work.
6. Prepare one real enterprise API request and correct only what it needs.
7. Rehearse the full story three times, then freeze feature work.

Prefer small targeted changes. Extract shared logic only where needed to avoid inconsistent demo behavior; a full chat-service refactor is not a prerequisite.

If time slips, simplify styling and skip optional customer notification, trace consoles, and dashboard tours. Keep the six demo moments above. A successful TXT upload does not replace the required PDF demonstration.

## Presentation script

1. Admin: upload Acme_Return_Policy.pdf and show successful indexing.
2. Customer: open Acme Shoes, show the signed-in identity, and click the bubble.
3. Ask: 'What is your return window?' Show the answer from the uploaded policy.
4. Ask: 'Have my shoes shipped?' Show customer A's retrieved order status.
5. Ask: 'Email me that update.' Open the inbox and show the message.
6. Ask: 'I want a $5,000 refund.' Show the pending ticket, switch to admin, and reject it.
7. Enterprise mode: send the saved API request and show its response. Explain that the company can use its own interface.
8. Optional proof: request customer B's order while signed in as A, or switch to B to show a different status.

Pitch: 'AgentForge lets a company offer AI support through a ready-made widget or its own interface. It uses company documents, checks the customer's orders, sends requested emails, and hands risky requests to a manager.'

## Essential rehearsal checklist

- [ ] Prepared PDF actually uploads, indexes, and supplies the policy answer; TXT also works.
- [ ] Bubble opens/closes and displays real chat responses and failures.
- [ ] The signed-in customer's shipping status comes from seeded database records.
- [ ] Customer A cannot retrieve customer B's order.
- [ ] Requested email arrives in the demo inbox.
- [ ] Large refund creates a real ticket and admin rejection persists.
- [ ] Saved enterprise API request returns a real, readable response.
- [ ] Company/tenant mapping is consistent across accounts, documents, orders, API key, and tickets.
- [ ] Run the complete story three times in the chosen presentation environment.
- [ ] Prepare localhost and a clearly labeled recording as backup; keep an already indexed policy ready and disclose any failed live upload.

## Explicitly deferred

Universal embed SDK, cross-domain session integration, configurable onboarding, full branding editor, many companies, arbitrary enterprise databases, OCR, payment execution, workflow builder, event-driven emails, automated approval/resumption, full API lifecycle, infrastructure migrations, and production hardening beyond the paths required for the demo.

Do not repair or tour unrelated screens just to make the platform appear complete. The existing /demo page expects JSON while /api/chat returns a session-protected event stream; use the new company page rather than making that console a separate project.

PDF report generation is optional and separate from PDF ingestion. The previous filesystem warning is stale: current report code builds the PDF in memory and stores base64 in Firestore; live download still needs verification if shown.

## Describe the demo accurately

Company data and payments are simulated; document ingestion, database reads, SMTP emails, API calls, and Firestore tickets should be actual operations. Clearly label prerecorded or mock results. Tenant separation uses logical checks and Pinecone metadata filters, not physical GCP isolation. Do not claim production readiness or certifications.

This update changes the plan only. Application fixes and live verification remain to be done.
