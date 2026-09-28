"use client";
/* eslint-disable */
// @ts-nocheck
export default function AgentForgeSecurityIncident() {
  return (
    <>
      <div className="w-full bg-surface min-h-screen"><div className="flex flex-col w-full">
<div className="w-full max-w-7xl mx-auto px-margin-sm md:px-margin py-8 space-y-8">

<section className="bg-surface-container-lowest rounded-xl p-6 md:p-8 shadow-sm relative overflow-hidden">
<div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-tertiary-fixed/20 blur-3xl pointer-events-none"></div>
<div className="absolute -bottom-24 left-1/3 w-80 h-80 rounded-full bg-primary-fixed/25 blur-3xl pointer-events-none"></div>
<div className="relative z-10 flex flex-col xl:flex-row xl:items-start justify-between gap-6">
<div className="flex flex-col space-y-3">
<div className="flex items-center gap-2">
<span className="font-label-caps text-label-caps bg-tertiary-fixed text-on-tertiary-fixed px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-ping"></span>INCIDENT #SEC-4912</span>
<span className="font-label-caps text-label-caps bg-surface-container text-on-surface-variant px-2.5 py-1 rounded-full">
              SEV-1 AUTOMATED CONTAINMENT
            </span>
</div>
<h1 className="font-headline-md text-headline-md md:font-headline-lg md:text-headline-lg text-on-surface tracking-tight">
            Abnormal Execution Spike Intercepted
          </h1>
<div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-on-surface-variant font-body-sm text-body-sm">
<span className="flex items-center gap-1.5">
<span className="material-symbols-outlined text-[16px] text-primary">smart_toy</span>
              Agent: <strong className="text-on-surface font-medium">TreasuryReconciler-v1.9</strong>
</span>
<span className="text-outline-variant">•</span>
<span className="flex items-center gap-1.5">
<span className="material-symbols-outlined text-[16px] text-on-surface-variant">apartment</span>
              Tenant: <strong className="text-on-surface font-medium">FinTech Global (#2091)</strong>
</span>
<span className="text-outline-variant">•</span>
<span className="flex items-center gap-1.5">
<span className="material-symbols-outlined text-[16px] text-on-surface-variant">radar</span>
              Detector: <strong className="text-on-surface font-medium">Apigee Anomaly v4</strong>
</span>
<span className="text-outline-variant">•</span>
<span className="flex items-center gap-1.5">
<span className="material-symbols-outlined text-[16px] text-tertiary">timer</span>
              Elapsed: <strong className="font-label-caps text-on-surface font-medium">00:04:18</strong>
</span>
</div>
</div>

<div className="flex flex-wrap items-center gap-3 shrink-0 pt-2 xl:pt-0">
<button className="bg-tertiary hover:opacity-90 active:scale-98 transition-all text-on-tertiary font-label-ui text-label-ui font-medium px-4 py-2.5 rounded-lg shadow-sm flex items-center gap-2" id="btn-freeze" onClick={() => {}}><span className="material-symbols-outlined text-[18px]" id="freeze-icon">ac_unit</span><span id="freeze-label" className="">Emergency Freeze Agent</span></button>
<button className="bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-ui text-label-ui font-medium px-4 py-2.5 rounded-lg shadow-sm flex items-center gap-2 transition-all" onClick={() => {}}>
<span className="material-symbols-outlined text-[18px] text-outline">key_off</span>
<span className="">Revoke Credentials</span>
</button>
<button className="bg-surface-container text-on-surface-variant hover:text-on-surface font-label-ui text-label-ui font-medium px-3.5 py-2.5 rounded-lg shadow-sm flex items-center gap-1.5 transition-all" onClick={() => {}}>
<span className="material-symbols-outlined text-[18px]">verified_user</span>
<span className="">KMS Attestation</span>
</button>
</div>
</div>
</section>

<section className="grid grid-cols-1 md:grid-cols-3 gap-6">

<div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"><div className="flex items-center justify-between"><span className="font-label-caps text-label-caps text-on-surface-variant font-medium tracking-wider">POTENTIAL FINANCIAL EXPOSURE</span><span className="w-8 h-8 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center"><span className="material-symbols-outlined text-[18px]">attach_money</span></span></div><div className="mt-4"><div className="font-headline-md text-headline-md font-display-hero text-tertiary tracking-tight font-bold">$1,840,000</div><p className="font-body-sm text-body-sm text-on-surface-variant mt-2 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>14 Queued disbursements halted • $0 USD leaked via Layer 3 Ceiling</p></div><div className="mt-4 pt-3 flex items-center justify-between text-on-surface-variant font-label-caps text-label-caps"><span className="">Outbound Gate</span><span className="text-tertiary font-semibold">100% Intercepted</span></div></div>

<div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
<div className="flex items-center justify-between">
<span className="font-label-caps text-label-caps text-on-surface-variant font-medium tracking-wider">BLOCKED INVOCATIONS</span>
<span className="w-8 h-8 rounded-lg bg-surface-container text-primary flex items-center justify-center">
<span className="material-symbols-outlined text-[18px]">block</span>
</span>
</div>
<div className="mt-4">
<div className="font-headline-md text-headline-md font-display-hero text-on-surface tracking-tight font-bold">4,912</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-2 flex items-center gap-1.5">
<span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
            410x nominal burst spike • Intercept latency &lt;10ms
          </p>
</div>
<div className="mt-4 pt-3 flex items-center justify-between text-on-surface-variant font-label-caps text-label-caps">
<span className="">Detector Rate</span>
<span className="text-primary font-semibold">4,912 / 4,912 Drops</span>
</div>
</div>

<div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
<div className="flex items-center justify-between">
<span className="font-label-caps text-label-caps text-on-surface-variant font-medium tracking-wider">BLAST RADIUS RATING</span>
<span className="w-8 h-8 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center">
<span className="material-symbols-outlined text-[18px]">security</span>
</span>
</div>
<div className="mt-4">
<div className="font-headline-md text-headline-md font-display-hero text-tertiary tracking-tight font-bold">Level 4 / Contained</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-2 flex items-center gap-1.5">
<span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
            gVisor sandbox boundary held • Zero data records exfiltrated
          </p>
</div>
<div className="mt-4 pt-3 flex items-center justify-between text-on-surface-variant font-label-caps text-label-caps">
<span className="">Sandbox Isolation</span>
<span className="text-tertiary font-semibold">Active Enclave</span>
</div>
</div>
</section>

<section className="bg-surface-container-lowest rounded-xl shadow-sm p-6 md:p-8 flex flex-col">

<div className="flex items-center justify-between pb-4">
<div className="flex items-center gap-8">
<button className="pb-3 text-primary font-label-ui text-label-ui font-semibold flex items-center gap-2 relative" id="tab-btn-topology" onClick={() => {}}>
<span className="material-symbols-outlined text-[18px]">hub</span>
<span className="">Topology Map</span>
<span className="font-label-caps text-label-caps bg-primary-fixed text-on-primary-fixed px-2 py-0.5 rounded-full">Live Mesh</span>
<span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" id="tab-indicator-topology"></span>
</button>
<button className="pb-3 text-on-surface-variant hover:text-on-surface font-label-ui text-label-ui font-medium flex items-center gap-2 relative transition-colors" id="tab-btn-timeline" onClick={() => {}}>
<span className="material-symbols-outlined text-[18px]">history</span>
<span className="">Forensic Timeline</span>
<span className="font-label-caps text-label-caps bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-full">8 events</span>
<span className="hidden absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" id="tab-indicator-timeline"></span>
</button>
<button className="pb-3 text-on-surface-variant hover:text-on-surface font-label-ui text-label-ui font-medium flex items-center gap-2 relative transition-colors" id="tab-btn-payloads" onClick={() => {}}>
<span className="material-symbols-outlined text-[18px]">data_object</span>
<span className="">Raw Payloads</span>
<span className="font-label-caps text-label-caps bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-full">JSON</span>
<span className="hidden absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" id="tab-indicator-payloads"></span>
</button>
</div>
<div className="hidden sm:flex items-center gap-2 text-on-surface-variant font-label-caps text-label-caps">
<span className="w-2 h-2 rounded-full bg-tertiary"></span>
<span className="">Zero Knowledge Isolation Active</span>
</div>
</div>

<div className="flex flex-col space-y-8 pt-4" id="tab-content-topology">

<div className="bg-surface-container-low rounded-xl p-6 md:p-12 relative overflow-hidden flex flex-col items-center justify-center min-h-[380px]">

<div className="absolute inset-0 opacity-40 bg-[radial-gradient(#c7c4d8_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>

<svg className="absolute inset-0 w-full h-full pointer-events-none hidden md:block" xmlns="http://www.w3.org/2000/svg">
<defs>
<linearGradient id="lineGrad1" x1="0%" x2="100%" y1="0%" y2="0%">
<stop offset="0%" stopColor="#00534a"></stop>
<stop offset="100%" stopColor="#3525cd"></stop>
</linearGradient>
<linearGradient id="lineGrad2" x1="0%" x2="100%" y1="0%" y2="0%">
<stop offset="0%" stopColor="#3525cd"></stop>
<stop offset="100%" stopColor="#00534a"></stop>
</linearGradient>
</defs>

<path className="animate-pulse" d="M 270 190 L 450 190" stroke="url(#lineGrad1)" strokeDasharray="6,6" strokeWidth="2"></path>

<path d="M 670 190 L 850 190" stroke="url(#lineGrad2)" strokeDasharray="6,6" strokeWidth="2"></path>
</svg>

<div className="relative z-10 w-full flex flex-col md:flex-row items-center justify-between max-w-4xl gap-8">

<div className="flex flex-col items-center text-center group cursor-pointer" onClick={() => {}}><div className="relative flex items-center justify-center"><div className="w-24 h-24 rounded-full bg-surface-container-lowest shadow-md flex items-center justify-center p-2 group-hover:scale-105 transition-transform"><div className="w-16 h-16 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center"><span className="material-symbols-outlined text-[28px]">smart_toy</span></div></div><span className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full bg-tertiary text-on-tertiary font-label-caps text-label-caps">FROZEN</span></div><h3 className="font-headline-sm text-headline-sm text-on-surface mt-3 font-semibold">Agent Core</h3><p className="font-body-sm text-body-sm text-on-surface-variant font-code-base">TreasuryReconciler-v1.9</p><span className="mt-2 font-label-caps text-label-caps bg-surface-container text-on-surface-variant px-2.5 py-1 rounded-full">PID 49102 Terminated</span></div>

<div className="flex flex-col items-center gap-1 md:hidden"><span className="material-symbols-outlined text-outline">south</span><span className="font-label-caps text-label-caps bg-tertiary-fixed text-on-tertiary-fixed px-2 py-0.5 rounded">Token Revoked (14ms)</span></div>

<div className="hidden md:flex flex-col items-center -mt-8"><span className="font-label-caps text-label-caps bg-surface-container-lowest text-tertiary px-2.5 py-1 rounded-full shadow-sm">Token Revoked • 14ms</span></div>

<div className="flex flex-col items-center text-center group cursor-pointer" onClick={() => {}}>
<div className="relative flex items-center justify-center">
<div className="w-24 h-24 rounded-full bg-surface-container-lowest shadow-md flex items-center justify-center p-2 group-hover:scale-105 transition-transform">
<div className="w-16 h-16 rounded-full bg-surface-container text-primary flex items-center justify-center">
<span className="material-symbols-outlined text-[28px]">credit_card</span>
</div>
</div>
<span className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full bg-secondary text-on-secondary font-label-caps text-label-caps">REVOKED</span>
</div>
<h3 className="font-headline-sm text-headline-sm text-on-surface mt-3 font-semibold">Stripe API</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant font-code-base">KMS Credentials Invalidated</p>
<span className="mt-2 font-label-caps text-label-caps bg-surface-container text-on-surface-variant px-2.5 py-1 rounded-full">
                $0.00 Committed
              </span>
</div>

<div className="flex flex-col items-center gap-1 md:hidden">
<span className="material-symbols-outlined text-outline">south</span>
<span className="font-label-caps text-label-caps bg-tertiary-fixed text-on-tertiary-fixed px-2 py-0.5 rounded">Partition Lock</span>
</div>

<div className="hidden md:flex flex-col items-center -mt-8">
<span className="font-label-caps text-label-caps bg-surface-container-lowest text-tertiary px-2.5 py-1 rounded-full shadow-sm">
                Read-Only Partition Lock
              </span>
</div>

<div className="flex flex-col items-center text-center group cursor-pointer" onClick={() => {}}>
<div className="relative flex items-center justify-center">
<div className="w-24 h-24 rounded-full bg-surface-container-lowest shadow-md flex items-center justify-center p-2 group-hover:scale-105 transition-transform">
<div className="w-16 h-16 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center">
<span className="material-symbols-outlined text-[28px]">database</span>
</div>
</div>
<span className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full bg-tertiary text-on-tertiary font-label-caps text-label-caps">LOCKED</span>
</div>
<h3 className="font-headline-sm text-headline-sm text-on-surface mt-3 font-semibold">BigQuery</h3>
<p className="font-body-sm text-body-sm text-on-surface-variant font-code-base">fintech_2091_prod</p>
<span className="mt-2 font-label-caps text-label-caps bg-surface-container text-on-surface-variant px-2.5 py-1 rounded-full">
                Snapshot Immutable
              </span>
</div>
</div>
</div>

<div className="bg-surface-container-low rounded-xl p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
<div className="flex items-start gap-3">
<span className="material-symbols-outlined text-tertiary text-[22px] mt-0.5">verified</span>
<div>
<div className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                Containment Status: Autonomically Enforced
              </div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                Apigee DLP policy tripped at 00:04:18.491. gVisor microVM halted execution within 14ms of anomalous recursion vector.
              </p>
</div>
</div>
<div className="flex flex-wrap items-center gap-2 shrink-0">
<span className="font-label-caps text-label-caps bg-surface-container-lowest text-on-surface-variant px-2.5 py-1 rounded shadow-sm">
              Attestation: SHA-256 #8f44a9e8
            </span>
<span className="font-label-caps text-label-caps bg-surface-container-lowest text-on-surface-variant px-2.5 py-1 rounded shadow-sm">
              KMS: gcp/kms/fintech-v2
            </span>
<span className="font-label-caps text-label-caps bg-surface-container-lowest text-tertiary px-2.5 py-1 rounded shadow-sm font-semibold">
              OTel: Synchronized
            </span>
</div>
</div>
</div>

<div className="hidden flex-col space-y-6 pt-4" id="tab-content-timeline">
<div className="flex items-center justify-between">
<span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Chronological Micro-Telemetry Log</span>
<span className="font-label-caps text-label-caps text-on-surface-variant">UTC T-Zero: 14:02:18.000</span>
</div>
<div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-container-high">

<div className="relative group">
<span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-tertiary ring-4 ring-tertiary-fixed"></span>
<div className="bg-surface-container-low rounded-lg p-4">
<div className="flex items-center justify-between">
<span className="font-label-ui text-label-ui font-semibold text-on-surface">Apigee Anomaly Trigger: Recursive Disbursement Pattern</span>
<span className="font-label-caps text-label-caps text-on-surface-variant">14:02:18.491 (+0ms)</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                Triggered rule <code className="font-code-base bg-surface-container px-1 py-0.5 rounded text-on-surface">RULE-FIN-4091</code>: Agent attempted 4,912 disbursement commands in 410ms burst.
              </p>
</div>
</div>

<div className="relative group">
<span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-secondary ring-4 ring-secondary-fixed"></span>
<div className="bg-surface-container-low rounded-lg p-4">
<div className="flex items-center justify-between">
<span className="font-label-ui text-label-ui font-semibold text-on-surface">Blast Radius Interceptor Tripped</span>
<span className="font-label-caps text-label-caps text-on-surface-variant">14:02:18.496 (+5ms)</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                KMS envelope token revoked for tool <code className="font-code-base bg-surface-container px-1 py-0.5 rounded text-on-surface">stripe.transfers.create</code>. Session token invalidated cluster-wide.
              </p>
</div>
</div>

<div className="relative group">
<span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-tertiary ring-4 ring-tertiary-fixed"></span>
<div className="bg-surface-container-low rounded-lg p-4">
<div className="flex items-center justify-between">
<span className="font-label-ui text-label-ui font-semibold text-on-surface">gVisor Sandbox Hard Terminate</span>
<span className="font-label-caps text-label-caps text-on-surface-variant">14:02:18.505 (+14ms)</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                Kernel namespace frozen for worker <code className="font-code-base bg-surface-container px-1 py-0.5 rounded text-on-surface">worker-uscentral1-gvisor-882</code>. RAM dump snapshot saved to cold vault.
              </p>
</div>
</div>

<div className="relative group">
<span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-primary-fixed"></span>
<div className="bg-surface-container-low rounded-lg p-4">
<div className="flex items-center justify-between">
<span className="font-label-ui text-label-ui font-semibold text-on-surface">Tenant Notification Dispatched</span>
<span className="font-label-caps text-label-caps text-on-surface-variant">14:02:19.012 (+521ms)</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                Webhook ping delivered to tenant FinTech Global security endpoint via mTLS.
              </p>
</div>
</div>
</div>
</div>

<div className="hidden flex-col space-y-4 pt-4" id="tab-content-payloads">
<div className="flex items-center justify-between">
<span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Payload Inspector — Intercept Envelope</span>
<button className="font-label-ui text-label-ui text-primary hover:underline flex items-center gap-1" onClick={() => {}}>
<span className="material-symbols-outlined text-[16px]">content_copy</span>
<span id="copy-btn-text" className="">Copy Raw JSON</span>
</button>
</div>
<div className="bg-inverse-surface rounded-xl p-5 overflow-x-auto text-inverse-on-surface font-code-base text-code-base">
<pre className="font-code-base" id="json-payload">{"{"}
  "incident_id": "SEC-4912",
  "intercept_timestamp": "2025-02-24T14:02:18.491Z",
  "anomaly_score": 0.9984,
  "agent_context": {"{"}
    "agent_id": "treasury-reconciler",
    "version": "1.9.4",
    "sandbox_runtime": "gVisor-runsc-v2",
    "tenant_id": "fintech_2091",
    "pid": 49102
  {"}"},
  "guardrail_verdict": {"{"}
    "action": "AUTONOMIC_HALT",
    "response_latency_ms": 14.2,
    "blocked_calls": 4912,
    "prevented_usd_volume": 1840000.00,
    "leak_detected": false
  {"}"},
  "cryptographic_attestation": {"{"}
    "signature": "e9b2f483c180da...a8412",
    "kms_key": "projects/agentforge-prod/locations/us-central1/keyRings/secops/cryptoKeys/fintech-v2",
    "immutable_ledger_hash": "sha256:8f44a9e8023bd73b9e4a30e8c0fa882a17"
  {"}"}
{"}"}</pre>
</div>
</div>
</section>


</div>
</div>
</div>


    </>
  );
}