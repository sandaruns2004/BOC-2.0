# Working demo runbook

Updated 10 October 2026. This implementation is a local hackathon prototype with real database reads, document ingestion, API requests, SMTP sending, and manager tickets. Products, customers, orders, tracking references, and payments are fictional.

Validation completed: production build and TypeScript passed. Actual HTTP tests passed for PDF/TXT ingestion, customer and company order isolation, enterprise API authentication, manager rejection, and email send deduplication. Gmail accepted a shipping update sent to the Walkwave inbox; inbox placement still needs a manual check.

## Start

From `my-app`, run `npm run demo:dev`. This uses Node's system certificate store, which this machine needs for the configured cloud services. Open:

- Walkwave widget: http://localhost:3000/walkwave
- Nova enterprise interface: http://localhost:3000/nova
- Company administration: http://localhost:3000/admin/login

The `/demo` page and its navigation links have been removed. Open the company URLs above directly.

## Prepared data

| Company | Tenant | Customer | Order | Status |
| --- | --- | --- | --- | --- |
| Walkwave | tnt_sample01 | Jane / walkwave_jane | WW-1001 / Coast Runner | Shipped |
| Walkwave | tnt_sample01 | Bob / walkwave_bob | WW-1002 / City Stride | Processing |
| Nova Electronics | tnt_nova_demo | Alice / nova_alice | NV-1001 / Nova Air Headphones | Delivered |
| Nova Electronics | tnt_nova_demo | Sam / nova_sam | NV-1002 / NovaBook 14 | Shipped |

Orders live in the separate `demo_orders` collection in the configured company Firestore database. Both tenant and customer ownership are checked by the server. Demo account selection creates a session only for specifically seeded demo users, and is enabled by default for these public fictional storefronts.

## Presentation

1. Open Walkwave and select Jane. Click the bottom-right bubble.
2. Ask `What is your return policy?` The response identifies its indexed policy source.
3. Ask `Have my shoes shipped?` Expect WW-1001, Shipped, and its sample tracking reference.
4. Ask `What is the status of WW-1002?` Expect a non-disclosing not-found response.
5. Ask `Email my shipping update to YOUR_RECIPIENT_ADDRESS`. Use a real recipient who expects the demo email. `Email me my shipping update` uses `DEMO_EMAIL_TO`.
6. Ask `I want a refund of LKR 75,000`. This triggers a real manager-review ticket. No payment occurs.
7. In a separate browser profile/window, sign in as the Walkwave manager, open Escalations, and click Refresh tickets. Reject the new ticket. The customer's bubble checks status every five seconds.
8. Open Nova and select Alice. Ask for the order status in the custom concierge interface. Expand Inspect API response to show the actual structured response.
9. Optionally select Sam or Bob to show different customer-owned data.

The two pages share a cookie within one browser profile. Selecting a customer changes that profile's session. Use separate browser profiles for simultaneous company/admin sessions; the server rejects requests from stale customer selections.

## Manager login

Open `/admin/dashboard` directly (or `/admin/login` when signed out). The homepage console CTA and Tech Stack section have been removed. The Website Agent section explains the company website widget/API integration and shows actual agent actions. It does not require customers to use an AgentForge portal.

Users & Access displays existing customer identities, including the prepared demo accounts, and supports enabling/disabling access. External company login database integration is deferred until after the hackathon. Run `node --use-system-ca scripts/verify-admin-demo.cjs` to check the admin flows.

Escalations now show the customer, original request, review rule, timestamps, and optional manager decision note. Filter Pending/Approved/Rejected to inspect the history. Approval records a decision only; no financial payment is executed.

- Walkwave: `admin@walkwave.example`; password is the local `WALKWAVE_ADMIN_PASSWORD` environment value.
- Nova: `admin@nova.example`; password is the local `NOVA_ADMIN_PASSWORD` environment value.
- Existing admin accounts were preserved.

Do not put passwords or API keys on slides, in these documents, or in screenshots. They are stored only in the ignored `my-app/.env.local` file.

## PDF upload

Ready files are in `my-app/public/demo`:

- `Walkwave_Policies.pdf` and `Walkwave_Policies.txt`
- `Nova_Electronics_Policies.pdf` and `Nova_Electronics_Policies.txt`

Sign in to the appropriate company admin account, open Knowledge Base, and upload its file. Selectable-text PDFs and TXT are supported. Empty/scanned-only files fail with a readable error. A document is marked indexed only after embedding and vector storage succeed. Setup already indexed the company policies, so answers work before a live presentation upload.

## Enterprise integration

Nova's browser calls `/api/demo/enterprise-chat`. Nova's server reads `NOVA_DEMO_API_KEY` from the environment and makes an actual HTTP request to `/api/v1/chat`. It supplies the verified session customer; the API checks that this customer belongs to the API key's tenant.

Example server request body: `{ "message": "What is my order status?", "customerId": "nova_alice", "requestId": "YOUR_UNIQUE_REQUEST_ID" }`. Use `Authorization: Bearer YOUR_SERVER_API_KEY`. The response contains `reply`, `actions`, `sources`, and any relevant order/ticket information. Never put the API key in browser code.

## Email

The configured sender is `Walkwave Support <walkwavesupport@gmail.com>`. The recipient can be explicitly specified in the customer's current request; recipients are never taken from model output or policy documents. Without an explicit recipient, demo accounts use `DEMO_EMAIL_TO`, currently the Walkwave inbox.

Settings: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, and `DEMO_EMAIL_TO`. The app password stays in `.env.local`. SMTP acceptance is verified; actual inbox/spam placement must be checked in Gmail. Nova currently uses the same demo SMTP sender.

## Verify or reseed

- `npm run demo:verify`: tests actual HTTP handlers, including uploads and ticket decisions. Creates verification documents and a rejected demo ticket as evidence.
- `npm run demo:verify -- --send-email`: also sends one real shipping email to `DEMO_EMAIL_TO` and verifies that repeating the request does not send twice.
- `npm run demo:setup`: creates/updates only the named demo records and policies. It does not clear collections. It also configures the demo company's allowed order collection and writes generated PDFs. Restart the server if setup adds environment values.

Demo setup and verification are intended for this named sample environment. No deployment has been performed. For a later hosted demo, configure its environment values separately and set `DEMO_API_BASE_URL` to the deployed application's trusted base URL. These routes intentionally expose only the allowlisted demo customers. Remove the public demo routes before using this prototype for real customers.
