# AgentForge — Live Demo Script (6–7 minutes)

**How to read this:**
- **DO** = what you click or type.
- **SAY** = what you say out loud. Say it in your own words. Nobody needs to hear it word for word.
- ⏱ = where you should roughly be on the clock.

The story in one line: *a company sets up its AI assistant → a customer uses it → a risky request gets stopped for a human → we zoom out to see the whole platform.*

---

## Before you go on stage (setup checklist)

Do all of this **before** the pitch starts. Don't leave any of it for the live demo.

1. Run `npm run demo:dev` from `my-app`.
2. Open **three separate browser windows, each in its own browser profile** (the customer and admin sessions share cookies otherwise):
   - **Window A — Tenant Admin:** `localhost:3000/admin/login` → sign in as `admin@walkwave.example`. Leave it on **Dashboard**.
   - **Window B — Walkwave website:** `localhost:3000/walkwave`. Leave the chat bubble **closed**.
   - **Window C — Platform Ops:** `localhost:3000/ops/login` → sign in. Leave it on **Platform Dashboard**.
3. Have `Walkwave_Policies.pdf` ready in an easy folder (it's in `my-app/public/demo`).
4. Decide the email address you'll send to (a teammate's inbox that you can show, or your own). Type it into a notepad so you can copy-paste it.
5. Clear old **Pending** tickets in Escalations so the new one is easy to spot.
6. Zoom the browser to about 110–125% so the back row can read it.
7. Do one full dry run. Then re-run `npm run demo:setup` if you need to reset the data.

> Tip: if the PDF is already indexed from setup, delete it in Knowledge Base before the demo so you can upload it live. If the upload fails on stage, just say "it's already indexed from earlier" and move on. The answers still work.

---

## PART 0 — Opening (⏱ 0:00 – 0:20)

**SAY:**
> "Alright, let's stop talking about it and actually show you. I'm going to walk through AgentForge from three angles. First, the company that buys AgentForge. Then their customer, chatting on the company's own website. And finally us, the team running the platform behind all of it.
>
> Our example company is **Walkwave**, a shoe store here in Sri Lanka. It's fictional, but the database reads, the emails and the tickets you'll see are all real."

---

## PART 1 — Tenant Admin Dashboard: setting up the company (⏱ 0:20 – 2:20)

### 1.1 Dashboard overview

**DO:** Window A, already on **Dashboard**.

**SAY:**
> "This is the **Tenant Admin dashboard**. It's what Walkwave's owner or admin sees when they log in. Every company on AgentForge is its own isolated *tenant*. Walkwave can never see another company's data, and nobody else can see Walkwave's.
>
> At the top you've got the workspace summary: how many customers, how many knowledge documents, how many chats this week, and how many requests are waiting for a human. Underneath, these **workspace shortcuts** walk a new company through setup step by step."

### 1.2 Users & Access

**DO:** Click **Users & Access** in the sidebar.

**SAY:**
> "First, *who* can talk to the assistant. These are Walkwave's customers. The admin can add one manually with **Add User**, or, more realistically, sync them straight from their own customer database. We'll see that in a second.
>
> And if something looks off, one click on **Disable** and that person loses access to the assistant immediately."

*(Optional, if time allows: click **Add User**, show the form, then click **Cancel**. Don't actually create one.)*

### 1.3 Knowledge Base (policies)

**DO:** Click **Knowledge Base** → click **Upload Document** → pick `Walkwave_Policies.pdf`.

**SAY (while it shows *Processing & Vectorizing…*):**
> "Next, *what* the assistant knows. Walkwave uploads its policy PDF: returns, delivery, refunds. Behind the scenes we split it into chunks, turn those into vector embeddings, and store them. That's what we call **RAG**, retrieval-augmented generation.
>
> In plain English, the assistant answers from *Walkwave's* actual rules, not from whatever the AI thinks a return policy should be. And it shows you which document the answer came from."

**DO:** Point at the row once it shows **Indexed** and the **Indexed Chunks** count.

> "There we go. Indexed, and ready to use."

### 1.4 Company Settings: database + website widget

**DO:** Click **Company Settings**. Scroll slowly.

**SAY:**
> "Then we connect the company's own data. Here Walkwave links its order database. Notice the **Allowed collections** box. The admin lists exactly which collections the AI is allowed to read, and *everything else is blocked*. The AI can't wander around your database. It only sees what you allow."

**DO:** Scroll to **Website chat widget**. Point at **Assistant name**, **Brand colour**, **Allowed website origins**, then **Copy installation code**.

> "And this is how it gets onto their website. They set a name and a brand colour, list which domains are allowed, and copy **one script tag** into their site. That's the whole integration. No rebuilding the website, no AI team needed."

**DO:** Scroll to **Customer database sync** (just point, don't change anything).

> "And this keeps their customer list in sync automatically, so the assistant always knows who's who."

### 1.5 Analytics (quick look)

**DO:** Click **Analytics**.

**SAY:**
> "And finally a quick view of how much the assistant is actually being used. Recorded customer chats over the last seven days.
>
> That's the setup. Policies, users, database, website. Now let's be the *customer*."

---

## PART 2 — The customer on Walkwave's website (⏱ 2:20 – 4:30)

**DO:** Switch to **Window B** (Walkwave website).

**SAY:**
> "This is Walkwave's own website. It's *their* site, not ours. The only AgentForge thing on it is this little bubble down in the corner, which is that script tag we just copied. Our customer here is Jane, who's already logged into her Walkwave account."

**DO:** Click the **chat bubble** (bottom-right). The chat window opens.

### 2.1 Say hi

**DO:** Type `Hi!` → press **Enter**.

**SAY:**
> "Let's start simple."

*(Wait for the reply.)*
> "Friendly, on-brand, and it tells you what it can help with."

### 2.2 Policy question (shows RAG)

**DO:** Click the suggestion chip **What is your return policy?** (or type it).

**SAY:**
> "Now a real question. See the **Source** line under the answer? That's the PDF we uploaded two minutes ago. The answer is grounded in Walkwave's policy, not made up."

### 2.3 Package status (real database read)

**DO:** Click **Have my shoes shipped?**

**SAY:**
> "Now this is where it stops being a chatbot and becomes an *agent*. It's actually querying Walkwave's order database, and you can see the **Order database checked** tag. Jane's Coast Runners have shipped, here's the tracking reference, and here's the delivery estimate. All of it came from the real record. The AI didn't invent any of it."

**(Optional, +15 seconds, strong for security judges):**
**DO:** Type `What is the status of WW-1002?`
> "WW-1002 is someone *else's* order. Even if Jane knows the number, the server checks both the tenant *and* the customer, so she just gets 'I couldn't find that order in your account.' No data leaks."

### 2.4 Send an email (real action)

**DO:** Type `Email my shipping update to <your demo email>` → **Enter**.

**SAY:**
> "Now let's have it actually *do* something. I'm asking it to email the shipping update. See the **Email workflow** tag. That's a real email going out over SMTP right now."

**DO (if the inbox is open on a phone or another tab):** Show the email arriving.
> "…and there it is in the inbox."

### 2.5 The risky request

**DO:** Click **I want a refund of LKR 75,000** (or type it).

**SAY (slow down here, this is the money moment):**
> "Okay, now let's be a difficult customer. Jane's order was about thirteen thousand rupees, and she's asking for a refund of **seventy-five thousand**.
>
> A normal AI bot connected to a payments API might just say 'Sure!' and do it. That's exactly the fear that stops companies from using AI.
>
> AgentForge doesn't let the AI make that call. Walkwave's rule says anything over LKR 50,000 needs a manager. So the agent **stops**, creates a review ticket, and tells Jane honestly that a human will look at it. See the **Manager review requested** tag, and the status down here says **pending**.
>
> And this is enforced in our code, as a structural guardrail. It's not just a polite instruction in a prompt that someone could talk the AI out of."

*(Leave Window B open. You'll come back to it.)*

---

## PART 3 — Back to the admin: human-in-the-loop (⏱ 4:30 – 5:40)

**DO:** Switch to **Window A** → click **Escalations** → click **Refresh tickets**.

**SAY:**
> "Back to Walkwave's admin. Here's the **Escalations Queue**, and there's Jane's ticket, sitting in **Pending review**."

**DO:** Point at **Customer request** and **Why this needs review**.

> "The manager sees who asked, exactly what they asked, *and why* the system flagged it: a refund above the LKR 50,000 limit. No digging through chat logs."

**DO:** Click the **Decision note** box and type:
`Order total is LKR 13,250. Requested amount exceeds order value.`
→ Click **Reject request**.

**SAY:**
> "Her order was only about thirteen thousand, so I'll reject it and leave a note for the audit trail. If it were legitimate, I'd just hit **Approve request** instead."

**DO:** Switch to **Window B** for a second and point at the status line, which now says **Manager review: rejected**.

> "And on the customer's side, the chat picked up the decision within a few seconds. No refresh. In this demo, approving only records the decision. No real money moves."

**DO:** Back to **Window A** → click **Website Agent**.

> "And everything the agent did is logged here: the database lookup, the email, the escalation. Full visibility of every action the AI took on Walkwave's behalf."

*(Optional, 5 seconds: click **Export Reports** → "and all of it exports as CSV for compliance.")*

---

## PART 4 — Platform Ops: the AgentForge view (⏱ 5:40 – 6:40)

**DO:** Switch to **Window C** → **Platform Dashboard**.

**SAY:**
> "So far that's been one company. Now let's zoom out to *our* view. This is **Platform Ops**, what we as the AgentForge team see.
>
> Across all tenants: total tenants, active end users, total invocations, and the usage trend over the last week."

**DO:** Click **Manage Admins**.

> "Onboarding a new company takes about thirty seconds. **Provision New Tenant**, enter the company name and their admin's details, and they get their own isolated workspace, just like Walkwave's."

*(Click **Provision New Tenant** to show the form, then **Cancel**. Don't create one live.)*

**DO:** Click **Agent Activity**.

> "The **Global Action Log** shows agent actions across every tenant, tagged by tenant ID, so we can spot problems platform-wide."

**DO:** Click **System Health**, then **Platform Reports**.

> "And here's the health of the services underneath and the reports we'd use for usage, cost and billing. One that matters a lot to us is the **escalation rate**: how often agents hand things over to a human."

> ⚠️ Honesty note: some numbers on the Ops dashboard, Reports and System Health pages are illustrative or projected for the prototype. If a judge asks, say so directly: "These are projections. The tenant, user and action data is live." Don't claim they're production metrics.

---

## PART 5 — Close (⏱ 6:40 – 7:00)

**SAY:**
> "So, in about seven minutes: a company set up its own AI assistant with its policies, its customers and its database. A customer got real answers and real actions on the company's own website. A risky request got stopped and handed to a human. And we can see and run all of it from one platform.
>
> That's AgentForge: AI that can actually *do things*, with humans in control when it matters. Thank you, happy to take questions."

---

## If something breaks (stay calm, keep talking)

| Problem | What to say / do |
|---|---|
| PDF upload is slow or fails | "It's already indexed from our earlier setup, so the answers will still use it." Then move on. |
| Chat reply is slow | "It's checking the database and the policy index. This is a live call, not a recording." Wait up to ~10 seconds. |
| Ticket doesn't show in Escalations | Click **Refresh tickets** again. Check the filter is on **Pending review**. |
| Email doesn't arrive in time | Point at the **Email workflow** tag: "It's been accepted by the mail server. Inboxes can take a minute." Check it again after the demo. |
| Customer chat doesn't update after rejecting | It polls every 5 seconds, so wait a moment. If it still doesn't update, the Escalations page already shows **Rejected**. Point there. |
| Logged out / wrong user | This is why each window uses its own browser profile. Don't log in or out mid-demo; switch windows instead. |

## Words to drop in naturally (technical, but keep them light)

- **Multi-tenant isolation**: each company is a sealed-off tenant.
- **RAG / vector embeddings**: answers come from the company's own documents.
- **Tool calling / actions**: the agent queries the database and sends email.
- **Allowlisted collections**: the AI only reads what the admin allows.
- **Human-in-the-loop guardrail**: risky actions go to a person, enforced in code.
- **Audit trail**: every action and decision is logged and exportable.
