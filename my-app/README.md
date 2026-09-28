# AgentForge MVP

AgentForge is a BOC 2.0 Scenario 5 prototype for safely operating multi-tenant business AI agents. The MVP includes an agent configuration studio, guarded chat console, human approval queue, and decision-trace APIs.

## Run locally

1. Copy the Firebase values and Gemini key described in [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) into `.env.local`.
2. Install dependencies with `npm ci`.
3. Run `npm run dev` and open `http://localhost:3000`.

Required environment variables:

```text
GEMINI_API_KEY=
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

## Main routes

- `/studio` — save the agent prompt, model tier, permitted tools, and autonomous refund limit.
- `/demo` — submit a request and inspect guardrail, escalation, and trace results.
- `/escalation` — review and decide on high-risk actions. A compliance note is required.
- `/api/health` — lightweight readiness endpoint; reports whether a Gemini key is present.

## Safety notes

The MVP validates tenant identifiers, caps user-configurable payload sizes, scrubs detected PII before model use and escalation persistence, blocks basic prompt-injection patterns, and sends high-risk actions to a human queue. It is a demonstration implementation: production deployment still needs authenticated tenant identity, server-side Firebase credentials, rate limiting, and restrictive Firestore rules.
