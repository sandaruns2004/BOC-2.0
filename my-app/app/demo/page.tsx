/* eslint-disable */
// @ts-nocheck
export default function AgentForgeLiveDemoandTraceConsole() {
  return (
    <>
      <main className="w-full pt-16 bg-surface"><div className="flex flex-col w-full">

<div className="w-full bg-surface-container-low px-margin-sm md:px-margin py-space-md shadow-sm">
<div className="max-w-7xl mx-auto flex flex-col xl:flex-row xl:items-center justify-between gap-space-md">

<div className="flex flex-wrap items-center gap-space-md min-w-0">
<div className="relative flex items-center bg-surface-container-lowest rounded-lg px-3 py-1.5 shadow-sm">
<span className="material-symbols-outlined text-primary text-[18px] mr-2">corporate_fare</span>
<select className="bg-transparent font-label-ui text-label-ui text-on-surface font-semibold focus:outline-none cursor-pointer pr-4">
<option>Acme Corp (Enterprise Tenant #1042)</option>
<option>Fintech Global AG (Tenant #8812)</option>
<option>OmniLogistics LLC (Tenant #4401)</option>
</select>
</div>
<div className="flex items-center gap-space-xs font-code-base text-code-base text-on-surface-variant bg-surface-container px-3 py-1.5 rounded-lg">
<span className="material-symbols-outlined text-[16px] text-tertiary">fingerprint</span>
<span className="font-medium text-on-surface">ses_99f2b8a7c</span>
<span className="text-outline-variant font-light mx-1">/</span>
<span>Gemini 1.5 Flash</span>
<span className="text-outline-variant font-light mx-1">/</span>
<span className="inline-flex items-center text-tertiary font-medium">
<span className="w-1.5 h-1.5 rounded-full bg-tertiary mr-1 animate-pulse"></span>
            Strict Guardrails
          </span>
</div>
</div>

<div className="flex flex-wrap items-center gap-space-md">
<div className="flex items-center gap-space-sm bg-surface-container-lowest px-3 py-1.5 rounded-lg shadow-sm">
<div className="flex flex-col">
<span className="font-label-caps text-label-caps text-on-surface-variant">E2E LATENCY</span>
<span className="font-code-base text-code-base text-on-surface font-semibold">492ms</span>
</div>
<div className="w-px h-6 bg-surface-container"></div>
<div className="flex flex-col">
<span className="font-label-caps text-label-caps text-on-surface-variant">INFERENCE COST</span>
<span className="font-code-base text-code-base text-on-surface font-semibold">$0.0084</span>
</div>
<div className="w-px h-6 bg-surface-container"></div>
<div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-tertiary/10 text-tertiary font-label-caps text-label-caps">
<span className="material-symbols-outlined text-[14px]">verified</span>
<span>VERIFIED &amp; COMPLETED</span>
</div>
</div>
<div className="flex items-center gap-2">
<button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container text-on-surface font-label-ui text-label-ui hover:bg-surface-container-high transition-all" id="replayBtn">
<span className="material-symbols-outlined text-[16px]">replay</span>
            Replay Trace
          </button>
<button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-on-primary font-label-ui text-label-ui font-medium shadow-sm hover:opacity-95 active:scale-98 transition-all">
<span className="material-symbols-outlined text-[16px]">play_arrow</span>
            Invoke Step
          </button>
</div>
</div>
</div>
</div>

<div className="w-full max-w-7xl mx-auto px-margin-sm md:px-margin py-space-lg">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">

<div className="lg:col-span-5 flex flex-col gap-space-md">

<div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-md">
<div className="flex items-center justify-between pb-space-sm bg-surface-container-low px-3 py-2 rounded-lg">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-primary text-[18px]">terminal</span>
<span className="font-headline-sm text-headline-sm text-on-surface">Agent Execution Console</span>
</div>
<span className="font-label-caps text-label-caps px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">SANDBOX v2.4</span>
</div>

<div className="flex flex-col gap-1.5">
<label className="font-label-caps text-label-caps text-on-surface-variant flex items-center gap-1">
<span className="material-symbols-outlined text-[13px]">bolt</span> FAST SCENARIO TEMPLATES
            </label>
<div className="flex flex-col gap-2">
<button className="scenario-btn text-left p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container transition-all flex items-start gap-2.5 group" data-prompt="Query customer order #88392 and process refund if under $50">
<span className="material-symbols-outlined text-primary text-[18px] mt-0.5 shrink-0">shopping_bag</span>
<div className="min-w-0 flex-1">
<div className="font-label-ui text-label-ui font-semibold text-on-surface flex items-center justify-between">
<span>Order #88392 Dynamic Refund</span>
<span className="font-code-base text-code-base text-primary opacity-0 group-hover:opacity-100 transition-opacity">Select ΓåÆ</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant truncate">Query CRM order details and trigger autonomous micro-refund policy</p>
</div>
</button>
<button className="scenario-btn text-left p-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container transition-all flex items-start gap-2.5 group" data-prompt="Check inventory for SKU-4991 and trigger warehouse re-stock email">
<span className="material-symbols-outlined text-secondary text-[18px] mt-0.5 shrink-0">inventory_2</span>
<div className="min-w-0 flex-1">
<div className="font-label-ui text-label-ui font-semibold text-on-surface flex items-center justify-between">
<span>Restock SKU-4991 Pipeline</span>
<span className="font-code-base text-code-base text-secondary opacity-0 group-hover:opacity-100 transition-opacity">Select ΓåÆ</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant truncate">Scan logistics telemetry and notify fulfillment warehouse operator</p>
</div>
</button>
</div>
</div>

<div className="relative flex flex-col gap-2">
<div className="relative bg-surface rounded-lg p-2.5 shadow-inner">
<textarea className="w-full bg-transparent font-body-md text-body-md text-on-surface focus:outline-none resize-none placeholder:text-outline" id="promptInput" placeholder="Enter autonomous agent instruction or select a preset template above..." rows="3">Query customer order #88392 and process refund if under $50</textarea>
<div className="flex items-center justify-between pt-2">
<div className="flex items-center gap-2 font-code-base text-code-base text-on-surface-variant">
<span className="material-symbols-outlined text-[15px]">security</span>
<span>Eval mode: Strict SOC2</span>
</div>
<button className="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-label-ui text-label-ui font-medium flex items-center gap-1 hover:opacity-90 active:scale-95 transition-all">
<span>Transmit</span>
<span className="material-symbols-outlined text-[14px]">send</span>
</button>
</div>
</div>
</div>

<div className="flex flex-col gap-space-md pt-space-xs">
<div className="flex items-center justify-between">
<span className="font-label-caps text-label-caps text-on-surface-variant">TRANSACTION AUDIT LOG FEED</span>
<span className="font-code-base text-code-base text-tertiary flex items-center gap-1">
<span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>
                Connected Live
              </span>
</div>
<div className="flex flex-col gap-3 font-body-sm text-body-sm">

<div className="flex items-start gap-2.5 self-end max-w-[90%]">
<div className="bg-primary text-on-primary p-3 rounded-2xl rounded-tr-none shadow-sm">
<p className="font-body-md text-body-md">Query customer order #88392 and process refund if under $50</p>
</div>
<div className="w-7 h-7 rounded-full bg-primary-fixed flex items-center justify-center shrink-0">
<span className="material-symbols-outlined text-primary text-[15px]">person</span>
</div>
</div>

<div className="flex flex-wrap items-center gap-2 ml-9">
<div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-on-surface font-label-caps text-label-caps shadow-sm">
<span className="material-symbols-outlined text-tertiary text-[14px]">verified_user</span>
<span>Injection Check: <strong className="text-tertiary">Clean</strong></span>
</div>
<div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-on-surface font-label-caps text-label-caps shadow-sm">
<span className="material-symbols-outlined text-tertiary text-[14px]">shield</span>
<span>PII Scan: <strong className="text-tertiary">Zero Detected</strong></span>
</div>
</div>

<div className="flex items-start gap-2.5 self-start max-w-[95%]">
<div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-on-primary shrink-0 shadow-sm">
<span className="material-symbols-outlined text-[15px]">smart_toy</span>
</div>
<div className="bg-surface-container-low p-3.5 rounded-2xl rounded-tl-none shadow-sm flex flex-col gap-3 w-full">

<div className="flex items-center justify-between pb-2">
<span className="font-code-base text-code-base text-primary font-medium flex items-center gap-1.5">
<span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                      Reasoning with Gemini 1.5 Flash (280ms)
                    </span>
<span className="font-label-caps text-label-caps text-on-surface-variant">TEMP: 0.1</span>
</div>
<p className="text-on-surface leading-relaxed">
                    User requests retrieval of order metadata <code className="bg-surface-container px-1.5 py-0.5 rounded font-code-base text-code-base text-primary">#88392</code> to determine refund eligibility. Checking authorized autonomous tool registries.
                  </p>

<div className="bg-surface-container-lowest rounded-xl p-3 shadow-sm flex flex-col gap-2">
<div className="flex items-center justify-between">
<div className="flex items-center gap-1.5 font-code-base text-code-base text-on-surface font-medium">
<span className="material-symbols-outlined text-secondary text-[16px]">data_object</span>
<span>crm_fetch_order(order_id: 88392)</span>
</div>
<span className="font-label-caps text-label-caps px-2 py-0.5 rounded bg-tertiary/10 text-tertiary font-semibold">200 OK (84ms)</span>
</div>

<div className="bg-surface-container-high rounded-lg p-2.5 font-code-base text-code-base overflow-x-auto text-on-surface">
<pre className="leading-tight text-[12px]">{"{"}
  "order_id": 88392,
  "customer": "K. Vang",
  "item": "Magnetic Swivel Stand",
  "status": "Delivered",
  "subtotal": 42.50,
  "payment_processor": "stripe_ch_902j"
{"}"}</pre>
</div>
</div>

<div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-tertiary/10 text-on-surface">
<span className="material-symbols-outlined text-tertiary text-[20px] shrink-0">policy</span>
<div className="flex flex-col">
<span className="font-label-ui text-label-ui font-semibold text-tertiary">Policy Rule #POL-404 Satisfied</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Refund amount ($42.50) auto-approved under tenant threshold ($50.00).</span>
</div>
</div>

<div className="pt-2">
<div className="font-label-caps text-label-caps text-on-surface-variant mb-1">AGENT RESPONSE</div>
<p className="text-on-surface leading-relaxed font-body-md text-body-md font-normal">
                      Order <strong>#88392</strong> for <em>Magnetic Swivel Stand</em> was successfully fetched. Because the total amount is <strong>$42.50</strong>, which falls safely below your autonomous limit of $50.00, the refund has been processed back to payment intent <code className="bg-surface-container px-1 rounded font-code-base text-code-base">stripe_ch_902j</code> without requiring manual manager escalation.
                    </p>
</div>
</div>
</div>
</div>
</div>
</div>

<div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-3">
<span className="font-headline-sm text-headline-sm text-on-surface">Layered Defense Telemetry</span>
<div className="grid grid-cols-2 gap-3">
<div className="bg-surface-container-low p-3 rounded-lg flex flex-col gap-1">
<span className="font-label-caps text-label-caps text-on-surface-variant">PROMPT INTEGRITY</span>
<span className="font-body-lg text-body-lg text-tertiary font-semibold flex items-center gap-1">
<span className="material-symbols-outlined text-[18px]">verified</span> 99.98%
              </span>
<span className="font-body-sm text-body-sm text-on-surface-variant">0 injection vectors spotted</span>
</div>
<div className="bg-surface-container-low p-3 rounded-lg flex flex-col gap-1">
<span className="font-label-caps text-label-caps text-on-surface-variant">DATA PRIVACY (PII)</span>
<span className="font-body-lg text-body-lg text-primary font-semibold flex items-center gap-1">
<span className="material-symbols-outlined text-[18px]">lock</span> Masked
              </span>
<span className="font-body-sm text-body-sm text-on-surface-variant">Deterministic token salt</span>
</div>
</div>
</div>
</div>

<div className="lg:col-span-7 flex flex-col gap-space-md">

<div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-md">
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-space-sm bg-surface-container-low px-3.5 py-2.5 rounded-lg">
<div>
<span className="font-headline-sm text-headline-sm text-on-surface">Execution Span Waterfall</span>
<p className="font-body-sm text-body-sm text-on-surface-variant">10 Sequential micro-phases logged to OpenTelemetry Collector</p>
</div>
<div className="flex items-center gap-2 self-start sm:self-center">
<span className="font-label-caps text-label-caps px-2.5 py-1 rounded bg-surface text-on-surface font-semibold shadow-sm">492ms Total</span>
</div>
</div>

<div className="flex flex-col gap-2 relative">

<div className="trace-row flex flex-col gap-1.5 p-2.5 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer" data-step="1">
<div className="flex items-center justify-between font-label-ui text-label-ui">
<div className="flex items-center gap-2 min-w-0">
<span className="w-5 h-5 rounded-full bg-surface-container flex items-center justify-center font-code-base text-code-base text-on-surface font-semibold text-[11px]">1</span>
<span className="font-semibold text-on-surface truncate">Ingress Authentication (Apigee Enterprise)</span>
<span className="font-label-caps text-label-caps px-1.5 py-0.2 bg-tertiary/10 text-tertiary rounded">mTLS OK</span>
</div>
<span className="font-code-base text-code-base text-on-surface font-medium shrink-0">18ms</span>
</div>

<div className="w-full bg-surface-container-low rounded-full h-2 relative overflow-hidden">
<div className="absolute top-0 bottom-0 bg-primary rounded-full" style={{left: '0%', width: '4%'}}></div>
</div>
</div>

<div className="trace-row flex flex-col gap-1.5 p-2.5 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer" data-step="2">
<div className="flex items-center justify-between font-label-ui text-label-ui">
<div className="flex items-center gap-2 min-w-0">
<span className="w-5 h-5 rounded-full bg-surface-container flex items-center justify-center font-code-base text-code-base text-on-surface font-semibold text-[11px]">2</span>
<span className="font-semibold text-on-surface truncate">Semantic Cache Lookup (Memorystore Redis)</span>
<span className="font-label-caps text-label-caps px-1.5 py-0.2 bg-secondary/10 text-secondary rounded">CACHE MISS</span>
</div>
<span className="font-code-base text-code-base text-on-surface font-medium shrink-0">4ms</span>
</div>
<div className="w-full bg-surface-container-low rounded-full h-2 relative overflow-hidden">
<div className="absolute top-0 bottom-0 bg-secondary rounded-full" style={{left: '4%', width: '1.5%'}}></div>
</div>
</div>

<div className="trace-row flex flex-col gap-1.5 p-2.5 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer" data-step="3">
<div className="flex items-center justify-between font-label-ui text-label-ui">
<div className="flex items-center gap-2 min-w-0">
<span className="w-5 h-5 rounded-full bg-surface-container flex items-center justify-center font-code-base text-code-base text-on-surface font-semibold text-[11px]">3</span>
<span className="font-semibold text-on-surface truncate">Tenant RAG Vector Search (Vertex AI Matching Engine)</span>
<span className="font-label-caps text-label-caps px-1.5 py-0.2 bg-primary/10 text-primary rounded">3 Chunks ┬╖ Sim 0.91</span>
</div>
<span className="font-code-base text-code-base text-on-surface font-medium shrink-0">42ms</span>
</div>
<div className="w-full bg-surface-container-low rounded-full h-2 relative overflow-hidden">
<div className="absolute top-0 bottom-0 bg-primary-container rounded-full" style={{left: '5.5%', width: '9%'}}></div>
</div>
</div>

<div className="trace-row flex flex-col gap-1.5 p-2.5 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer" data-step="4">
<div className="flex items-center justify-between font-label-ui text-label-ui">
<div className="flex items-center gap-2 min-w-0">
<span className="w-5 h-5 rounded-full bg-surface-container flex items-center justify-center font-code-base text-code-base text-on-surface font-semibold text-[11px]">4</span>
<span className="font-semibold text-on-surface truncate">Layer-1 Guardrail: Prompt Injection &amp; Jailbreak Scan</span>
<span className="font-label-caps text-label-caps px-1.5 py-0.2 bg-tertiary/10 text-tertiary rounded">PASSED</span>
</div>
<span className="font-code-base text-code-base text-on-surface font-medium shrink-0">24ms</span>
</div>
<div className="w-full bg-surface-container-low rounded-full h-2 relative overflow-hidden">
<div className="absolute top-0 bottom-0 bg-tertiary rounded-full" style={{left: '14.5%', width: '5%'}}></div>
</div>
</div>

<div className="trace-row flex flex-col gap-1.5 p-2.5 rounded-lg bg-surface-container-low shadow-sm cursor-pointer" data-step="5">
<div className="flex items-center justify-between font-label-ui text-label-ui">
<div className="flex items-center gap-2 min-w-0">
<span className="w-5 h-5 rounded-full bg-primary text-on-primary flex items-center justify-center font-code-base text-code-base font-semibold text-[11px]">5</span>
<span className="font-semibold text-primary truncate">LLM Reasoning &amp; Tool Formulation (Gemini 1.5 Flash)</span>
<span className="font-label-caps text-label-caps px-1.5 py-0.2 bg-primary text-on-primary rounded">ACTIVE CALL</span>
</div>
<span className="font-code-base text-code-base text-primary font-bold shrink-0">280ms</span>
</div>
<div className="w-full bg-surface-container rounded-full h-2 relative overflow-hidden">
<div className="absolute top-0 bottom-0 bg-primary rounded-full" style={{left: '19.5%', width: '57%'}}></div>
</div>
</div>

<div className="trace-row flex flex-col gap-1.5 p-2.5 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer" data-step="6">
<div className="flex items-center justify-between font-label-ui text-label-ui">
<div className="flex items-center gap-2 min-w-0">
<span className="w-5 h-5 rounded-full bg-surface-container flex items-center justify-center font-code-base text-code-base text-on-surface font-semibold text-[11px]">6</span>
<span className="font-semibold text-on-surface truncate">Layer-2 Guardrail: JSON Schema &amp; Policy Validation</span>
<span className="font-label-caps text-label-caps px-1.5 py-0.2 bg-tertiary/10 text-tertiary rounded">VALIDATED</span>
</div>
<span className="font-code-base text-code-base text-on-surface font-medium shrink-0">12ms</span>
</div>
<div className="w-full bg-surface-container-low rounded-full h-2 relative overflow-hidden">
<div className="absolute top-0 bottom-0 bg-tertiary rounded-full" style={{left: '76.5%', width: '2.5%'}}></div>
</div>
</div>

<div className="trace-row flex flex-col gap-1.5 p-2.5 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer" data-step="7">
<div className="flex items-center justify-between font-label-ui text-label-ui">
<div className="flex items-center gap-2 min-w-0">
<span className="w-5 h-5 rounded-full bg-surface-container flex items-center justify-center font-code-base text-code-base text-on-surface font-semibold text-[11px]">7</span>
<span className="font-semibold text-on-surface truncate">Human-in-the-Loop Threshold Check (Autonomic Policy)</span>
<span className="font-label-caps text-label-caps px-1.5 py-0.2 bg-tertiary/10 text-tertiary rounded">AUTO-APPROVED</span>
</div>
<span className="font-code-base text-code-base text-on-surface font-medium shrink-0">6ms</span>
</div>
<div className="w-full bg-surface-container-low rounded-full h-2 relative overflow-hidden">
<div className="absolute top-0 bottom-0 bg-tertiary-container rounded-full" style={{left: '79%', width: '1.5%'}}></div>
</div>
</div>

<div className="trace-row flex flex-col gap-1.5 p-2.5 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer" data-step="8">
<div className="flex items-center justify-between font-label-ui text-label-ui">
<div className="flex items-center gap-2 min-w-0">
<span className="w-5 h-5 rounded-full bg-surface-container flex items-center justify-center font-code-base text-code-base text-on-surface font-semibold text-[11px]">8</span>
<span className="font-semibold text-on-surface truncate">Tool Execution in gVisor Micro-Sandbox (Cloud Run)</span>
<span className="font-label-caps text-label-caps px-1.5 py-0.2 bg-secondary/10 text-secondary rounded">CRM API 200 OK</span>
</div>
<span className="font-code-base text-code-base text-on-surface font-medium shrink-0">84ms</span>
</div>
<div className="w-full bg-surface-container-low rounded-full h-2 relative overflow-hidden">
<div className="absolute top-0 bottom-0 bg-secondary rounded-full" style={{left: '80.5%', width: '17%'}}></div>
</div>
</div>

<div className="trace-row flex flex-col gap-1.5 p-2.5 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer" data-step="9">
<div className="flex items-center justify-between font-label-ui text-label-ui">
<div className="flex items-center gap-2 min-w-0">
<span className="w-5 h-5 rounded-full bg-surface-container flex items-center justify-center font-code-base text-code-base text-on-surface font-semibold text-[11px]">9</span>
<span className="font-semibold text-on-surface truncate">Final Response Synthesis &amp; SSE Client Stream</span>
<span className="font-label-caps text-label-caps px-1.5 py-0.2 bg-primary/10 text-primary rounded">COMPLETED</span>
</div>
<span className="font-code-base text-code-base text-on-surface font-medium shrink-0">14ms</span>
</div>
<div className="w-full bg-surface-container-low rounded-full h-2 relative overflow-hidden">
<div className="absolute top-0 bottom-0 bg-primary rounded-full" style={{left: '97.5%', width: '2.5%'}}></div>
</div>
</div>

<div className="trace-row flex flex-col gap-1.5 p-2.5 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer" data-step="10">
<div className="flex items-center justify-between font-label-ui text-label-ui">
<div className="flex items-center gap-2 min-w-0">
<span className="w-5 h-5 rounded-full bg-surface-container flex items-center justify-center font-code-base text-code-base text-on-surface font-semibold text-[11px]">10</span>
<span className="font-semibold text-on-surface truncate">BigQuery Immutable Audit Log &amp; Trace Flush</span>
<span className="font-label-caps text-label-caps px-1.5 py-0.2 bg-surface-container text-on-surface-variant rounded">ASYNC DISPATCH</span>
</div>
<span className="font-code-base text-code-base text-on-surface font-medium shrink-0">8ms</span>
</div>
<div className="w-full bg-surface-container-low rounded-full h-2 relative overflow-hidden">
<div className="absolute top-0 bottom-0 bg-outline rounded-full" style={{left: '98.4%', width: '1.6%'}}></div>
</div>
</div>
</div>
</div>

<div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-md">

<div className="flex items-center justify-between border-b-0 bg-surface-container-low p-1 rounded-lg">
<div className="flex items-center gap-1">
<button className="json-tab active px-3 py-1.5 rounded-md font-label-ui text-label-ui font-semibold bg-surface-container-lowest text-primary shadow-sm" data-tab="raw">
                Trace Raw JSON (OTel)
              </button>
<button className="json-tab px-3 py-1.5 rounded-md font-label-ui text-label-ui font-medium text-on-surface-variant hover:text-on-surface" data-tab="guardrail">
                Guardrail Telemetry
              </button>
<button className="json-tab px-3 py-1.5 rounded-md font-label-ui text-label-ui font-medium text-on-surface-variant hover:text-on-surface" data-tab="vector">
                Vector Embeddings Context
              </button>
</div>
<button className="flex items-center gap-1 font-code-base text-code-base text-on-surface-variant hover:text-primary px-2 py-1 rounded transition-colors" id="copyJsonBtn">
<span className="material-symbols-outlined text-[15px]">content_copy</span>
<span>Copy</span>
</button>
</div>

<div className="relative bg-surface-container-high rounded-xl p-space-md overflow-hidden">

<div className="tab-pane font-code-base text-code-base text-on-surface overflow-x-auto max-h-72" id="tabContentRaw">
<pre className="leading-relaxed">{"{"}
  "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
  "parent_span_id": "00f067aa0ba902b7",
  "service_name": "agentforge-runtime-gateway",
  "attributes": {"{"}
    "tenant.id": "1042",
    "tenant.tier": "Enterprise",
    "llm.model": "gemini-1.5-flash",
    "llm.temperature": 0.1,
    "llm.prompt_tokens": 142,
    "llm.completion_tokens": 86,
    "guardrail.injection_scan": "CLEAN",
    "guardrail.pii_redacted": false,
    "policy.approval_status": "AUTO_APPROVED",
    "policy.max_threshold": 50.00,
    "policy.executed_value": 42.50
  {"}"},
  "events": [
    {"{"}
      "name": "crm_fetch_order_dispatched",
      "timestamp": "2025-02-23T14:32:01.402Z",
      "status": "HTTP_200_OK"
    {"}"}
  ]
{"}"}</pre>
</div>

<div className="tab-pane hidden font-code-base text-code-base text-on-surface overflow-x-auto max-h-72" id="tabContentGuardrail">
<pre className="leading-relaxed">{"{"}
  "guardrail_evaluations": {"{"}
    "prompt_injection_heuristic": {"{"}
      "model": "text-moderation-007",
      "confidence_clean": 0.9998,
      "verdict": "ALLOW"
    {"}"},
    "tenant_boundary_check": {"{"}
      "isolated_vpc": "vpc-tenant-1042-prod",
      "cross_tenant_leakage": false
    {"}"},
    "pii_scanner": {"{"}
      "regex_matches": 0,
      "ner_entities_redacted": []
    {"}"},
    "human_threshold_governor": {"{"}
      "requires_human_approval": false,
      "reason": "Total order $42.50 &lt;= Policy cap $50.00"
    {"}"}
  {"}"}
{"}"}</pre>
</div>

<div className="tab-pane hidden font-code-base text-code-base text-on-surface overflow-x-auto max-h-72" id="tabContentVector">
<pre className="leading-relaxed">{"{"}
  "vector_search": {"{"}
    "index_endpoint": "projects/agentforge-prod/locations/us-central1/indexEndpoints/19823091",
    "embedding_model": "text-embedding-004",
    "query_dimensions": 768,
    "retrieved_neighbors": [
      {"{"}
        "id": "policy_refund_tier1",
        "distance_score": 0.9124,
        "content_snippet": "Autonomous agents may authorize refund disbursements under $50.00 for verified damaged or lost standard packages without supervisor escalation."
      {"}"},
      {"{"}
        "id": "crm_order_schema_v2",
        "distance_score": 0.8841,
        "content_snippet": "CRM API definition for customer orders: GET /v2/orders/:id returns item, customer_id, tracking, subtotal, and stripe_id."
      {"}"}
    ]
  {"}"}
{"}"}</pre>
</div>
</div>

<div className="flex flex-wrap items-center justify-between text-body-sm text-on-surface-variant pt-space-xs">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-[16px] text-tertiary">check_circle</span>
<span>OpenTelemetry OTLP/gRPC Exporter Synchronized</span>
</div>
<span className="font-code-base text-code-base text-outline">Trace Span #99f2b8a7c-01</span>
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
