/* eslint-disable */
// @ts-nocheck
export default function AgentForgeLaunchConsole() {
  return (
    <>
      <svg aria-hidden="true" className="inline-defs-container" style={{position: 'absolute', width: '0', height: '0', overflow: 'hidden'}}></svg>
<aside className="fixed top-16 left-0 bottom-0 w-64 bg-surface-container-lowest/80 backdrop-blur-xl border-r border-outline-variant/30 p-space-md flex flex-col justify-between z-40 hidden md:flex"><div className="flex flex-col gap-space-sm"><div className="px-2 py-1 text-on-surface-variant font-label-caps text-label-caps uppercase tracking-wider">Navigation</div><nav className="flex flex-col gap-1" data-active-classes="bg-surface-container text-primary font-medium"><a className="font-label-ui text-label-ui text-on-surface-variant hover:text-on-surface px-space-sm py-2 rounded-lg transition-colors" data-path="home" href="#">Platform Overview</a><a className="font-label-ui text-label-ui text-on-surface-variant hover:text-on-surface px-space-sm py-2 rounded-lg transition-colors" data-path="architecture" href="#">Architecture</a><a className="font-label-ui text-label-ui text-on-surface-variant hover:text-on-surface px-space-sm py-2 rounded-lg transition-colors" data-path="pillars-security" href="#">Pillars &amp; Security</a><a className="font-label-ui text-label-ui text-on-surface-variant hover:text-on-surface px-space-sm py-2 rounded-lg transition-colors" data-path="live-flow-demo" href="#">Live Flow Demo</a><a className="font-label-ui text-label-ui text-on-surface-variant hover:text-on-surface px-space-sm py-2 rounded-lg transition-colors" data-path="pricing-economics" href="#">Pricing &amp; Economics</a><a className="font-label-ui text-label-ui text-on-surface-variant hover:text-on-surface px-space-sm py-2 rounded-lg transition-colors" data-path="launch-console" href="#">Console Trace</a></nav></div><div className="p-space-sm rounded-lg bg-surface-container-low border border-outline-variant/30"><div className="flex items-center gap-space-xs font-label-caps text-label-caps text-tertiary font-medium"><span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>Engine: Ready</div><div className="font-code-base text-code-base text-on-surface-variant mt-1">GCP us-central1</div></div></aside><main className="w-full pt-16 md:pl-64 bg-surface"><div className="flex flex-col w-full">
<div className="w-full max-w-7xl mx-auto px-margin-sm md:px-margin py-space-xl flex flex-col gap-space-xl">

<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-space-lg pb-space-sm">
<div className="flex flex-col gap-space-xs">
<div className="flex flex-wrap items-center gap-space-sm">
<h1 className="font-headline-md text-headline-md text-on-surface tracking-tight">Fleet Governance &amp; Operations</h1>
<div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high text-tertiary">
<span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
<span className="font-label-caps text-label-caps uppercase">GCP us-central1 (Nominal)</span>
</div>
</div>
<p className="font-body-md text-body-md text-on-surface-variant">Multi-tenant autonomous runtime orchestrator and real-time observability.</p>
</div>
<div className="flex items-center gap-space-sm">

<div className="relative inline-block text-left" id="tenant-menu-wrapper">
<button className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface-container-lowest text-on-surface shadow-sm hover:bg-surface-container-low transition-colors font-label-ui text-label-ui" id="tenant-btn" type="button">
<span className="w-2 h-2 rounded-full bg-primary"></span>
<span>Acme Corp #1042</span>
<span className="material-symbols-outlined text-[16px] text-on-surface-variant">expand_more</span>
</button>
</div>

<button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-on-primary font-label-ui text-label-ui font-medium shadow-md shadow-primary/20 hover:brightness-105 active:scale-95 transition-all" type="button">
<span className="material-symbols-outlined text-[18px]">add</span>
<span>Deploy Agent</span>
</button>
</div>
</div>

<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-gutter">

<div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between gap-space-sm transition-all hover:shadow-md">
<div className="flex items-center justify-between">
<span className="font-label-ui text-label-ui text-on-surface-variant uppercase tracking-wider">Active Fleet</span>
<span className="material-symbols-outlined text-primary text-[20px]">smart_toy</span>
</div>
<div className="flex flex-col">
<div className="font-headline-md text-headline-md text-on-surface font-semibold">42 Agents</div>
<div className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mt-0.5">
<span className="text-tertiary font-medium">+3</span> this month
          </div>
</div>
</div>

<div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between gap-space-sm transition-all hover:shadow-md">
<div className="flex items-center justify-between">
<span className="font-label-ui text-label-ui text-on-surface-variant uppercase tracking-wider">P50 Latency</span>
<span className="material-symbols-outlined text-tertiary text-[20px]">speed</span>
</div>
<div className="flex flex-col">
<div className="font-headline-md text-headline-md text-tertiary font-semibold">542ms</div>
<div className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1 mt-0.5">
<span className="text-tertiary font-medium">-12ms</span> vs baseline
          </div>
</div>
</div>

<div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between gap-space-sm transition-all hover:shadow-md">
<div className="flex items-center justify-between">
<span className="font-label-ui text-label-ui text-on-surface-variant uppercase tracking-wider">Guardrail Intercepts</span>
<span className="material-symbols-outlined text-outline text-[20px]">shield</span>
</div>
<div className="flex flex-col">
<div className="font-headline-md text-headline-md text-on-surface font-semibold">0.02%</div>
<div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
            14 total flagged, deterministic
          </div>
</div>
</div>

<div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between gap-space-sm transition-all hover:shadow-md">
<div className="flex items-center justify-between">
<span className="font-label-ui text-label-ui text-on-surface-variant uppercase tracking-wider">Monthly Run Rate</span>
<span className="material-symbols-outlined text-secondary text-[20px]">payments</span>
</div>
<div className="flex flex-col">
<div className="font-headline-md text-headline-md text-on-surface font-semibold">$158.41</div>
<div className="font-body-sm text-body-sm text-tertiary font-medium mt-0.5">
            12% under budget ceiling
          </div>
</div>
</div>
</div>

<div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">

<div className="lg:col-span-7 flex flex-col gap-space-lg">
<div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-xl flex flex-col gap-space-lg">

<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm pb-space-sm">
<div>
<h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Configured Workloads</h2>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">3 active worker containers deployed in isolated VPC microVMs</p>
</div>
<div className="inline-flex items-center gap-1.5 font-label-caps text-label-caps px-2.5 py-1 rounded-md bg-surface-container text-on-surface-variant">
<span>SYNC: LIVE</span>
</div>
</div>

<div className="flex flex-col gap-space-md">

<div className="p-space-lg rounded-xl bg-surface hover:bg-surface-container-low transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
<div className="flex items-center gap-space-md min-w-0">
<div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary shrink-0">
<span className="material-symbols-outlined text-[22px]">shopping_cart_checkout</span>
</div>
<div className="flex flex-col min-w-0">
<div className="flex items-center gap-2">
<span className="font-body-md text-body-md text-on-surface font-semibold truncate">Order Resolution Bot v2.4</span>
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tertiary/10 text-tertiary font-label-caps text-label-caps">
<span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                      Healthy
                    </span>
</div>
<div className="flex items-center gap-space-sm mt-1">
<span className="font-label-caps text-label-caps px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant">Gemini 1.5 Flash</span>
<span className="font-code-base text-code-base text-on-surface-variant">1.2k req/min</span>
</div>
</div>
</div>
<div className="flex items-center gap-space-sm self-end sm:self-auto shrink-0">
<button className="px-3 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container font-label-ui text-label-ui shadow-sm transition-colors" type="button">
                  Configure
                </button>
</div>
</div>

<div className="p-space-lg rounded-xl bg-surface hover:bg-surface-container-low transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
<div className="flex items-center gap-space-md min-w-0">
<div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-secondary shrink-0">
<span className="material-symbols-outlined text-[22px]">inventory_2</span>
</div>
<div className="flex flex-col min-w-0">
<div className="flex items-center gap-2">
<span className="font-body-md text-body-md text-on-surface font-semibold truncate">Inventory Logistics Bot v1.9</span>
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tertiary/10 text-tertiary font-label-caps text-label-caps">
<span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                      Healthy
                    </span>
</div>
<div className="flex items-center gap-space-sm mt-1">
<span className="font-label-caps text-label-caps px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant">Gemini 1.5 Flash</span>
<span className="font-code-base text-code-base text-on-surface-variant">480 req/min</span>
</div>
</div>
</div>
<div className="flex items-center gap-space-sm self-end sm:self-auto shrink-0">
<button className="px-3 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container font-label-ui text-label-ui shadow-sm transition-colors" type="button">
                  Configure
                </button>
</div>
</div>

<div className="p-space-lg rounded-xl bg-surface hover:bg-surface-container-low transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
<div className="flex items-center gap-space-md min-w-0">
<div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-tertiary shrink-0">
<span className="material-symbols-outlined text-[22px]">security</span>
</div>
<div className="flex flex-col min-w-0">
<div className="flex items-center gap-2">
<span className="font-body-md text-body-md text-on-surface font-semibold truncate">Security Triager v3.0</span>
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-tertiary/10 text-tertiary font-label-caps text-label-caps">
<span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                      Healthy
                    </span>
</div>
<div className="flex items-center gap-space-sm mt-1">
<span className="font-label-caps text-label-caps px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant">Claude 3.5 Sonnet</span>
<span className="font-code-base text-code-base text-on-surface-variant">85 req/min</span>
</div>
</div>
</div>
<div className="flex items-center gap-space-sm self-end sm:self-auto shrink-0">
<button className="px-3 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container font-label-ui text-label-ui shadow-sm transition-colors" type="button">
                  Configure
                </button>
</div>
</div>
</div>

<div className="p-space-md rounded-lg bg-surface-container-low flex items-center gap-space-sm">
<span className="material-symbols-outlined text-primary text-[20px] shrink-0">verified_user</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">
              Autonomous sandbox memory isolation active across all 3 containers · TLS 1.3 / gRPC
            </span>
</div>
</div>
</div>

<div className="lg:col-span-5 flex flex-col gap-space-lg">
<div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-xl flex flex-col gap-space-lg">

<div className="flex items-center justify-between border-none bg-surface-container-low p-1 rounded-lg">
<button className="flex-1 py-1.5 px-3 rounded-md bg-surface-container-lowest text-primary font-label-ui text-label-ui font-medium shadow-sm transition-all" id="tab-live-btn">
              Live Activity
            </button>
<button className="flex-1 py-1.5 px-3 rounded-md text-on-surface-variant hover:text-on-surface font-label-ui text-label-ui font-medium flex items-center justify-center gap-1.5 transition-all" id="tab-quota-btn">
<span>Routing &amp; Quotas</span>
<span className="px-1.5 py-0.2 rounded-full bg-surface-container-high text-primary font-label-caps text-label-caps">68%</span>
</button>
<button className="flex-1 py-1.5 px-3 rounded-md text-on-surface-variant hover:text-on-surface font-label-ui text-label-ui font-medium transition-all" id="tab-admin-btn">
              Admin Actions
            </button>
</div>

<div className="flex flex-col gap-space-lg" id="tab-live-content">

<div className="flex flex-col gap-space-sm p-space-md rounded-xl bg-surface">
<div className="flex items-center justify-between">
<div className="flex flex-col">
<span className="font-label-caps text-label-caps uppercase text-on-surface-variant">24h Fleet Throughput</span>
<span className="font-body-md text-body-md font-semibold text-on-surface">99.98% OK <span className="font-body-sm font-normal text-on-surface-variant">· peak 4.8k tokens/sec</span></span>
</div>
<div className="w-2 h-2 rounded-full bg-tertiary"></div>
</div>

<div className="w-full h-24 pt-2">
<svg className="w-full h-full overflow-visible" preserveaspectratio="none" viewBox="0 0 400 90">
<defs>
<lineargradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
<stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25"></stop>
<stop offset="100%" stopColor="#4f46e5" stopOpacity="0.00"></stop>
</lineargradient>
</defs>

<path d="M 0,75 Q 40,65 80,68 T 160,40 T 240,45 T 320,20 T 400,12 L 400,90 L 0,90 Z" fill="url(#chartGradient)"></path>

<path d="M 0,75 Q 40,65 80,68 T 160,40 T 240,45 T 320,20 T 400,12" fill="none" stroke="#4f46e5" strokeLinecap="round" strokeWidth="2.5"></path>

<circle cx="400" cy="12" fill="#4f46e5" r="4"></circle>
</svg>
</div>

<div className="grid grid-cols-3 gap-2 pt-2 text-center">
<div className="flex flex-col">
<span className="font-label-caps text-label-caps text-on-surface-variant">Input Context</span>
<span className="font-code-base text-code-base font-medium text-on-surface">14.2M</span>
</div>
<div className="flex flex-col">
<span className="font-label-caps text-label-caps text-on-surface-variant">Output</span>
<span className="font-code-base text-code-base font-medium text-on-surface">3.1M</span>
</div>
<div className="flex flex-col">
<span className="font-label-caps text-label-caps text-on-surface-variant">Avg Latency</span>
<span className="font-code-base text-code-base font-medium text-tertiary">384ms</span>
</div>
</div>
</div>

<div className="flex flex-col gap-space-sm">
<div className="flex items-center justify-between">
<h3 className="font-body-md text-body-md font-semibold text-on-surface">Recent Autonomous Decisions</h3>
<span className="font-label-caps text-label-caps text-on-surface-variant">TELEMETRY STREAM</span>
</div>
<div className="flex flex-col gap-2.5">

<div className="p-space-sm rounded-lg bg-surface flex items-center justify-between gap-space-sm hover:bg-surface-container-low transition-colors">
<div className="flex items-center gap-space-sm min-w-0">
<span className="material-symbols-outlined text-tertiary text-[18px] shrink-0">check_circle</span>
<div className="flex flex-col min-w-0">
<span className="font-body-sm text-body-sm text-on-surface font-medium truncate">Order Refund ($42.50) · 312ms</span>
<span className="font-label-caps text-label-caps text-tertiary">Auto-Approved via Guardrail Rule #12</span>
</div>
</div>
<span className="font-code-base text-code-base text-on-surface-variant shrink-0">4s ago</span>
</div>

<div className="p-space-sm rounded-lg bg-surface flex items-center justify-between gap-space-sm hover:bg-surface-container-low transition-colors">
<div className="flex items-center gap-space-sm min-w-0">
<span className="material-symbols-outlined text-primary text-[18px] shrink-0">verified</span>
<div className="flex flex-col min-w-0">
<span className="font-body-sm text-body-sm text-on-surface font-medium truncate">CVE Vulnerability Enrichment · 640ms</span>
<span className="font-label-caps text-label-caps text-primary">Triaged to SecOps P2 Queue</span>
</div>
</div>
<span className="font-code-base text-code-base text-on-surface-variant shrink-0">19s ago</span>
</div>

<div className="p-space-sm rounded-lg bg-surface flex items-center justify-between gap-space-sm hover:bg-surface-container-low transition-colors">
<div className="flex items-center gap-space-sm min-w-0">
<span className="material-symbols-outlined text-tertiary text-[18px] shrink-0">check_circle</span>
<div className="flex flex-col min-w-0">
<span className="font-body-sm text-body-sm text-on-surface font-medium truncate">Logistics Route Recalculation · 185ms</span>
<span className="font-label-caps text-label-caps text-tertiary">Completed with zero deviation</span>
</div>
</div>
<span className="font-code-base text-code-base text-on-surface-variant shrink-0">42s ago</span>
</div>
</div>
</div>

<div className="p-space-md rounded-xl bg-surface-container-low flex flex-col gap-2">
<div className="flex items-center justify-between font-label-caps text-label-caps">
<span className="text-on-surface font-medium">Monthly Token Quota Allocation</span>
<span className="text-primary font-semibold">6.8M / 10M tokens (68%)</span>
</div>
<div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden">
<div className="h-full bg-primary rounded-full transition-all duration-500" style={{width: '68%'}}></div>
</div>
<span className="font-body-sm text-body-sm text-on-surface-variant text-right">3.2M Safe Headroom Remaining</span>
</div>
</div>

<div className="hidden flex-col gap-space-md" id="tab-quota-content">
<div className="p-space-md rounded-xl bg-surface flex flex-col gap-space-sm">
<span className="font-body-md text-body-md font-semibold text-on-surface">Dynamic LLM Failover</span>
<p className="font-body-sm text-body-sm text-on-surface-variant">Automatic secondary routing kicks in at 90% quota or whenever target provider latency breaches 1200ms.</p>
<div className="flex items-center justify-between pt-2">
<span className="font-label-caps text-label-caps text-on-surface-variant">Primary: Gemini 1.5 Flash</span>
<span className="font-label-caps text-label-caps text-tertiary font-medium">Auto-Switch: Enabled</span>
</div>
</div>
<div className="p-space-md rounded-xl bg-surface-container-low flex items-center justify-between">
<span className="font-body-sm text-body-sm text-on-surface">Global Rate Limiter (Token Bucket)</span>
<span className="font-label-caps text-label-caps px-2 py-0.5 rounded bg-surface-container-lowest text-on-surface font-medium">50,000 req/min</span>
</div>
</div>

<div className="hidden flex-col gap-space-md" id="tab-admin-content">
<div className="p-space-md rounded-xl bg-surface flex flex-col gap-space-sm">
<span className="font-body-md text-body-md font-semibold text-on-surface">Emergency Fleet Shutdown</span>
<p className="font-body-sm text-body-sm text-on-surface-variant">Instantly terminates active inference contexts and halts queued actions across all tenants.</p>
<button className="mt-2 self-start px-3.5 py-1.5 rounded-lg bg-error text-on-error font-label-ui text-label-ui font-medium hover:opacity-90 transition-opacity" type="button">
                Suspend All Workloads
              </button>
</div>
</div>
</div>
</div>
</div>
</div>
</div>
</main>
    </>
  );
}