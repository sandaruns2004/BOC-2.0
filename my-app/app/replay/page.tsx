'use client';
/* eslint-disable */
// @ts-nocheck
import { useState, useEffect } from 'react';

export default function AgentForgeExecutionReplay() {
  const [traceId, setTraceId] = useState('tr-8f3a9bc2');
  const [searchInput, setSearchInput] = useState('');
  const [traceData, setTraceData] = useState<any>(null);
  const [loadingTrace, setLoadingTrace] = useState(false);
  const [traceError, setTraceError] = useState('');

  // Fetch trace on mount and when traceId changes
  useEffect(() => {
    async function fetchTrace() {
      setLoadingTrace(true);
      setTraceError('');
      try {
        const res = await fetch(`/api/traces?traceId=${traceId}`);
        if (!res.ok) throw new Error('Trace not found');
        const data = await res.json();
        setTraceData(data);
      } catch (e: any) {
        setTraceError(e.message ?? 'Failed to load trace');
      } finally {
        setLoadingTrace(false);
      }
    }
    fetchTrace();
  }, [traceId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) setTraceId(searchInput.trim());
  };

  return (
    <>
      <div className="w-full bg-surface min-h-screen px-4 md:px-8"><div className="flex flex-col w-full pb-16">

<section className="flex flex-col gap-6 pt-6">

<div className="flex flex-wrap items-center justify-between gap-4">
<div className="flex items-center gap-3">
<span className="font-label-caps text-label-caps tracking-wider text-on-surface-variant uppercase px-2.5 py-1 rounded-md bg-surface-container font-semibold">
          TRACE #{traceId} // REGRESSION STUDIO
        </span>
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-error-container/60 text-error font-label-caps text-label-caps font-semibold">
<span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span>
          Step 3 Diverged
        </span>
<span className="font-code-base text-code-base text-on-surface-variant hidden md:inline">
          Seed: 0x94ef41 · Replay runtime: 410ms
        </span>
</div>

<div className="flex items-center gap-2">
<button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-ui text-label-ui transition-colors shadow-sm">
<span className="material-symbols-outlined text-[16px]">file_download</span>
          Export Trace
        </button>
<button className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-primary-container text-on-primary font-label-ui text-label-ui hover:bg-primary transition-all shadow-sm">
<span className="material-symbols-outlined text-[16px]">verified</span>
          Promote Candidate v1.5
        </button>
</div>
</div>

<div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-2">
<div className="flex flex-col gap-1.5 max-w-3xl">
{/* Trace ID Search Bar */}
<form onSubmit={handleSearch} className="flex items-center gap-2 mb-3">
  <div className="relative">
    <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[15px] text-on-surface-variant">search</span>
    <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Load trace ID…" className="pl-8 pr-3 py-1.5 w-52 rounded-lg bg-surface-container-low border border-outline-variant/40 font-code-base text-[12px] text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary transition-colors" />
  </div>
  <button type="submit" className="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-label-ui text-label-ui font-medium hover:opacity-90 transition-all text-[12px]">Load</button>
  {loadingTrace && <span className="font-label-caps text-[10px] text-on-surface-variant animate-pulse">Fetching…</span>}
  {traceError && <span className="font-label-caps text-[10px] text-error">{traceError}</span>}
  {traceData && !loadingTrace && <span className="font-label-caps text-[10px] text-tertiary">{traceData.steps?.length ?? 0} steps ✓</span>}
</form>
<h1 className="font-headline-lg text-headline-lg tracking-tight text-on-surface font-semibold">
          Execution Replay &amp; Drift Analyzer
        </h1>
<p className="font-body-md text-body-md text-on-surface-variant">
          Comparing <span className="font-medium text-on-surface">Prod v1.4 (Gemini 3.5 Flash)</span> with candidate model <span className="font-medium text-primary">Staging v1.5 (Gemini 3.6 Flash)</span> on historical production session <code className="font-code-base text-code-base text-on-surface-variant bg-surface-container px-1 py-0.5 rounded">{traceId}</code>.
        </p>
</div>

<div className="flex flex-wrap items-center gap-2.5 p-1.5 rounded-xl bg-surface-container-low shadow-sm self-start xl:self-auto">

<div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-lowest shadow-sm">
<span className="w-2 h-2 rounded-full bg-outline"></span>
<span className="font-label-caps text-label-caps text-on-surface-variant">BASELINE:</span>
<span className="font-label-ui text-label-ui text-on-surface font-medium">Prod v1.4</span>
</div>
<span className="material-symbols-outlined text-outline-variant text-[16px]">arrow_forward</span>
<div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-lowest shadow-sm">
<span className="w-2 h-2 rounded-full bg-primary-container"></span>
<span className="font-label-caps text-label-caps text-primary">CANDIDATE:</span>
<span className="font-label-ui text-label-ui text-on-surface font-semibold">Staging v1.5</span>
</div>
<div className="w-px h-6 bg-surface-container-high mx-1 hidden sm:block"></div>

<div className="flex items-center gap-1">
<button aria-label="Step back" className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface-container-lowest hover:bg-surface-container text-on-surface transition-colors shadow-sm" id="btn-step-prev">
<span className="material-symbols-outlined text-[18px]">skip_previous</span>
</button>
<button aria-label="Play Replay" className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-primary font-label-ui text-label-ui transition-colors shadow-sm font-semibold" id="btn-playback">
<span className="material-symbols-outlined text-[18px]">play_arrow</span>
<span>Continuous</span>
</button>
<button aria-label="Step forward" className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface-container-lowest hover:bg-surface-container text-on-surface transition-colors shadow-sm" id="btn-step-next">
<span className="material-symbols-outlined text-[18px]">skip_next</span>
</button>
<span className="px-2 py-1 rounded bg-surface-container font-label-caps text-label-caps text-on-surface-variant font-medium">
            1.0x
          </span>
</div>
</div>
</div>
</section>

<section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">

<div className="p-5 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between gap-3">
<div className="flex items-center justify-between">
<span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Semantic Accuracy</span>
<span className="material-symbols-outlined text-outline text-[18px]">check_circle</span>
</div>
<div>
<div className="flex items-baseline gap-2">
<span className="font-headline-md text-headline-md text-on-surface font-semibold tracking-tight">99.2%</span>
<span className="font-label-caps text-label-caps text-tertiary font-medium">Optimal</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Strict intent parity match (±0.0%)</p>
</div>
</div>

<div className="p-5 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between gap-3">
<div className="flex items-center justify-between">
<span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Policy Adherence</span>
<span className="material-symbols-outlined text-tertiary-container text-[18px]">verified_user</span>
</div>
<div>
<div className="flex items-baseline gap-2">
<span className="font-headline-md text-headline-md text-on-surface font-semibold tracking-tight">100%</span>
<span className="font-label-caps text-label-caps text-tertiary font-medium">Enforced</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">0 violations · SOC2 Type II &amp; HIPAA</p>
</div>
</div>

<div className="p-5 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between gap-3">
<div className="flex items-center justify-between">
<span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Execution Latency</span>
<span className="material-symbols-outlined text-tertiary text-[18px]">speed</span>
</div>
<div>
<div className="flex items-baseline gap-2">
<span className="font-headline-md text-headline-md text-tertiary font-semibold tracking-tight">-132ms</span>
<span className="font-label-caps text-label-caps text-tertiary font-bold">24.3% FASTER</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">410ms candidate vs 542ms baseline</p>
</div>
</div>

<div className="p-5 rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between gap-3">
<div className="flex items-center justify-between">
<span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Inference Cost Delta</span>
<span className="material-symbols-outlined text-tertiary text-[18px]">savings</span>
</div>
<div>
<div className="flex items-baseline gap-2">
<span className="font-headline-md text-headline-md text-tertiary font-semibold tracking-tight">-$0.0053</span>
<span className="font-label-caps text-label-caps text-tertiary font-bold">-63.1%</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Prompt cache hit on 12.8k prefix tokens</p>
</div>
</div>
</section>

<section className="mt-10 flex flex-col gap-4">
<div className="flex items-center justify-between px-1">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-primary text-[20px]">account_tree</span>
<h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
          Execution DAG Pipeline Replay
        </h2>
</div>
<div className="flex items-center gap-3">
<button className="font-label-ui text-label-ui text-on-surface-variant hover:text-on-surface transition-colors" id="toggle-all-steps">
          Expand All Steps
        </button>
<span className="text-outline-variant">·</span>
<span className="font-label-caps text-label-caps text-on-surface-variant">4 NODES EVALUATED</span>
</div>
</div>

<div className="flex flex-col gap-3">

<div className="timeline-step rounded-xl bg-surface-container-lowest shadow-sm transition-all duration-200">
<button aria-expanded="false" className="step-toggle w-full p-5 flex items-center justify-between text-left gap-4" data-target="step-1-content" type="button">
<div className="flex items-center gap-4 min-w-0">
<div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center font-label-caps text-label-caps text-on-surface font-bold">
              01
            </div>
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-tertiary text-[18px]">check_circle</span>
<span className="font-label-caps text-label-caps text-tertiary font-semibold">22ms</span>
</div>
<div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 min-w-0">
<span className="font-label-ui text-label-ui text-on-surface font-semibold truncate">Ingress Payload &amp; Intent Classification</span>
<span className="hidden md:inline font-body-sm text-body-sm text-on-surface-variant truncate">“Cancel my subscription immediately” — Apigee DLP sanitized</span>
</div>
</div>
<div className="flex items-center gap-3 flex-shrink-0">
<span className="px-2 py-0.5 rounded-full bg-surface-container font-label-caps text-label-caps text-on-surface font-medium hidden sm:inline">
              Parity 100%
            </span>
<span className="chevron material-symbols-outlined text-outline text-[20px] transition-transform duration-200">expand_more</span>
</div>
</button>
<div className="hidden px-5 pb-5 pt-1" id="step-1-content">
<div className="p-4 rounded-lg bg-surface-container-low font-code-base text-code-base text-on-surface-variant flex flex-col gap-2">
<div className="flex justify-between items-center text-on-surface">
<span className="font-bold">Sanitized Customer Ingress:</span>
<span className="text-tertiary font-label-caps text-label-caps">Deterministic Hash Match</span>
</div>
<p className="text-on-surface">payload = {"{"} "user_id": "usr_99342", "session": "s_live_29", "text": "Cancel my subscription immediately, I have switched providers.", "channel": "mobile_app" {"}"}</p>
<p className="text-outline">Guard evaluation: PII Masked (0 exposures) · Latency skew: +1ms</p>
</div>
</div>
</div>

<div className="timeline-step rounded-xl bg-surface-container-lowest shadow-sm transition-all duration-200">
<button aria-expanded="false" className="step-toggle w-full p-5 flex items-center justify-between text-left gap-4" data-target="step-2-content" type="button">
<div className="flex items-center gap-4 min-w-0">
<div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center font-label-caps text-label-caps text-on-surface font-bold">
              02
            </div>
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-tertiary text-[18px]">check_circle</span>
<span className="font-label-caps text-label-caps text-tertiary font-semibold">112ms</span>
</div>
<div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 min-w-0">
<span className="font-label-ui text-label-ui text-on-surface font-semibold truncate">RAG Knowledge Base &amp; Context Enrichment</span>
<span className="hidden md:inline font-body-sm text-body-sm text-on-surface-variant truncate">vs-tenant-2091 · 4 chunks retrieved (Cosine: 0.94)</span>
</div>
</div>
<div className="flex items-center gap-3 flex-shrink-0">
<span className="px-2 py-0.5 rounded-full bg-surface-container font-label-caps text-label-caps text-on-surface font-medium hidden sm:inline">
              Parity Verified
            </span>
<span className="chevron material-symbols-outlined text-outline text-[20px] transition-transform duration-200">expand_more</span>
</div>
</button>
<div className="hidden px-5 pb-5 pt-1" id="step-2-content">
<div className="p-4 rounded-lg bg-surface-container-low font-code-base text-code-base text-on-surface-variant flex flex-col gap-2">
<div className="flex justify-between items-center text-on-surface">
<span className="font-bold">Retrieved Context Vectors:</span>
<span className="font-label-caps text-label-caps text-on-surface-variant">HNSW Index Top-K: 4</span>
</div>
<p className="text-on-surface">[Chunk #1082] Policy: "Customers on Annual Tier eligible for retention discounts before terminal cancellation."</p>
<p className="text-on-surface">[Chunk #4419] User profile: Tier = Enterprise Solo, Tenure = 9 months, MRR = $120.</p>
</div>
</div>
</div>

<div className="timeline-step rounded-xl bg-surface-container-lowest shadow-md transition-all duration-200 overflow-hidden relative">

<div className="absolute left-0 top-0 bottom-0 w-1.5 bg-secondary-container"></div>
<button aria-expanded="true" className="step-toggle w-full p-6 pl-8 flex items-center justify-between text-left gap-4" data-target="step-3-content" type="button">
<div className="flex items-start md:items-center gap-4 min-w-0">
<div className="w-8 h-8 rounded-lg bg-secondary-fixed flex items-center justify-center font-label-caps text-label-caps text-on-secondary-fixed font-bold flex-shrink-0">
              03
            </div>
<div className="flex flex-col gap-1 min-w-0">
<div className="flex flex-wrap items-center gap-2">
<span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary font-label-caps text-label-caps font-bold">
                  DIVERGENCE DETECTED
                </span>
<span className="font-label-ui text-label-ui text-on-surface font-semibold">
                  LLM Inference &amp; Tool Invocation
                </span>
<span className="font-label-caps text-label-caps text-on-surface-variant hidden sm:inline">
                  (Latency: 224ms vs 285ms)
                </span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant">
                Strategic divergence: Candidate model altered tool invocation strategy to prevent immediate customer churn.
              </p>
</div>
</div>
<div className="flex items-center gap-3 flex-shrink-0 self-start md:self-center">
<span className="px-2.5 py-1 rounded-full bg-surface-container-high font-label-caps text-label-caps text-primary font-semibold hidden lg:inline">
              Delta: Action Re-route
            </span>
<span className="chevron material-symbols-outlined text-outline text-[20px] transition-transform duration-200 rotate-180">expand_more</span>
</div>
</button>

<div className="px-6 pl-8 pb-6 flex flex-col gap-5" id="step-3-content">
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

<div className="p-5 rounded-xl bg-surface-container-low flex flex-col justify-between gap-4">
<div className="flex flex-col gap-3">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="w-2.5 h-2.5 rounded-full bg-outline"></span>
<span className="font-label-caps text-label-caps text-on-surface-variant font-bold tracking-wider">BASELINE OUTCOME (PROD v1.4)</span>
</div>
<span className="font-label-caps text-label-caps text-on-surface-variant">Gemini 3.5 Flash</span>
</div>
<div className="flex items-center gap-2 pt-1">
<span className="font-body-sm text-body-sm text-on-surface font-medium">Selected Tool:</span>
<span className="px-2.5 py-1 rounded-md bg-error-container text-error font-code-base text-code-base font-semibold">
                    cancel_subscription
                  </span>
</div>
<div className="p-3.5 rounded-lg bg-surface-container-lowest font-code-base text-code-base text-on-surface">
<span className="text-on-surface-variant">// Arguments</span><br/>
                  subscription_id: <span className="text-primary font-semibold">"sub_9921"</span><br/>
                  immediate: <span className="text-error font-semibold">true</span><br/>
                  reason: <span className="text-on-surface-variant">"user requested immediate cancellation"</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant italic">
                  Initiated irrevocable cancellation immediately without checking account lifetime value or offering available discount perks.
                </p>
</div>
<div className="flex items-center justify-between pt-2">
<span className="font-label-caps text-label-caps text-outline">EXECUTION TIME: 285ms</span>
<button className="font-label-ui text-label-ui text-primary hover:underline flex items-center gap-1">
<span>View Raw JSON</span>
<span className="material-symbols-outlined text-[14px]">north_east</span>
</button>
</div>
</div>

<div className="p-5 rounded-xl bg-surface-container flex flex-col justify-between gap-4">
<div className="flex flex-col gap-3">
<div className="flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="w-2.5 h-2.5 rounded-full bg-primary-container"></span>
<span className="font-label-caps text-label-caps text-primary font-bold tracking-wider">OPTIMIZED CANDIDATE (STAGING v1.5)</span>
</div>
<span className="px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-caps text-label-caps font-bold">
                    Confidence: 0.96
                  </span>
</div>
<div className="flex items-center gap-2 pt-1">
<span className="font-body-sm text-body-sm text-on-surface font-medium">Selected Tool:</span>
<span className="px-2.5 py-1 rounded-md bg-primary-fixed text-on-primary-fixed-variant font-code-base text-code-base font-semibold">
                    inquire_retention_discount
                  </span>
</div>
<div className="p-3.5 rounded-lg bg-surface-container-lowest font-code-base text-code-base text-on-surface">
<span className="text-on-surface-variant">// Arguments</span><br/>
                  offer_id: <span className="text-primary font-semibold">"SAVE20_Q3"</span><br/>
                  tone: <span className="text-primary font-semibold">"empathic"</span><br/>
                  max_discount_percentage: <span className="text-tertiary font-semibold">20</span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant italic">
                  Identified high-LTV account (&gt;6mo history) and scheduled proactive retention inquiry prior to destructive lifecycle updates.
                </p>
</div>
<div className="flex items-center justify-between pt-2">
<span className="font-label-caps text-label-caps text-tertiary font-bold">EXECUTION TIME: 224ms (-61ms)</span>
<button className="font-label-ui text-label-ui text-primary hover:underline flex items-center gap-1">
<span>View Raw JSON</span>
<span className="material-symbols-outlined text-[14px]">north_east</span>
</button>
</div>
</div>
</div>

<div className="p-4 rounded-xl bg-surface-container-high flex flex-col sm:flex-row sm:items-center justify-between gap-3">
<div className="flex items-center gap-3">
<span className="material-symbols-outlined text-primary text-[22px]">lightbulb</span>
<p className="font-body-sm text-body-sm text-on-surface">
<span className="font-semibold text-primary">Retention Safe-Path Activated:</span>
                Candidate avoided premature termination. Estimated churn mitigation impact: <span className="font-bold text-on-surface">+$1,200 ARR retention</span> per affected account.
              </p>
</div>
<div className="flex items-center gap-2 flex-shrink-0">
<button className="px-3 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface font-label-ui text-label-ui hover:bg-surface-container-low transition-colors shadow-sm font-medium">
                Approve As Target Behavior
              </button>
</div>
</div>
</div>
</div>

<div className="timeline-step rounded-xl bg-surface-container-lowest shadow-sm transition-all duration-200">
<button aria-expanded="false" className="step-toggle w-full p-5 flex items-center justify-between text-left gap-4" data-target="step-4-content" type="button">
<div className="flex items-center gap-4 min-w-0">
<div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center font-label-caps text-label-caps text-on-surface font-bold">
              04
            </div>
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-tertiary text-[18px]">check_circle</span>
<span className="font-label-caps text-label-caps text-tertiary font-semibold">52ms</span>
</div>
<div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 min-w-0">
<span className="font-label-ui text-label-ui text-on-surface font-semibold truncate">Layer 3 Safety &amp; Financial Guardrail Evaluation</span>
<span className="hidden md:inline font-body-sm text-body-sm text-on-surface-variant truncate">Low-risk autonomous pass · 0 human escalation overhead</span>
</div>
</div>
<div className="flex items-center gap-3 flex-shrink-0">
<span className="px-2 py-0.5 rounded-full bg-surface-container font-label-caps text-label-caps text-on-surface font-medium hidden sm:inline">
              Autonomous Pass
            </span>
<span className="chevron material-symbols-outlined text-outline text-[20px] transition-transform duration-200">expand_more</span>
</div>
</button>
<div className="hidden px-5 pb-5 pt-1" id="step-4-content">
<div className="p-4 rounded-lg bg-surface-container-low font-code-base text-code-base text-on-surface-variant flex flex-col gap-2">
<div className="flex justify-between items-center text-on-surface">
<span className="font-bold">Guardrail Checklist:</span>
<span className="text-tertiary font-label-caps text-label-caps font-semibold">All 7 Rules Passed</span>
</div>
<p className="text-on-surface">• Max discount allowance check: 20% ≤ 25% policy max (PASS)</p>
<p className="text-on-surface">• Anti-hallucination fact verification: 1.0 (PASS)</p>
<p className="text-on-surface">• Irreversible state change approval check: DEFERRED (PASS)</p>
</div>
</div>
</div>
</div>
</section>

<section className="mt-8 p-6 rounded-2xl bg-surface-container-lowest shadow-sm flex flex-col gap-6">
<div className="flex flex-wrap items-center justify-between gap-4">
<div className="flex flex-col gap-1">
<span className="font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">Session Execution Anatomy</span>
<h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Latency Distribution &amp; Token Budget</h3>
</div>
<div className="flex items-center gap-6">
<div className="flex items-center gap-2">
<span className="w-3 h-3 rounded-sm bg-outline"></span>
<span className="font-label-ui text-label-ui text-on-surface-variant">Prod Baseline (542ms)</span>
</div>
<div className="flex items-center gap-2">
<span className="w-3 h-3 rounded-sm bg-primary-container"></span>
<span className="font-label-ui text-label-ui text-on-surface font-medium">Candidate Staging (410ms)</span>
</div>
</div>
</div>

<div className="w-full overflow-x-auto">
<div className="min-w-[640px] flex flex-col gap-3">

<div className="flex items-center gap-4">
<span className="font-code-base text-code-base text-on-surface-variant w-28 text-right">Prod v1.4</span>
<div className="flex-1 h-8 bg-surface-container-low rounded-lg overflow-hidden flex shadow-inner">
<div className="bg-outline/40 flex items-center justify-center text-[10px] text-on-surface font-mono" style={{width: '5%'}} title="Ingress 24ms">24m</div>
<div className="bg-outline/60 flex items-center justify-center text-[10px] text-on-surface font-mono" style={{width: '21%'}} title="RAG 114ms">114m</div>
<div className="bg-outline flex items-center justify-center text-[10px] text-surface font-mono font-bold" style={{width: '53%'}} title="LLM 285ms">285ms LLM</div>
<div className="bg-outline-variant flex items-center justify-center text-[10px] text-on-surface font-mono" style={{width: '21%'}} title="Guard 119ms">119m</div>
</div>
<span className="font-code-base text-code-base text-on-surface w-16 text-right font-semibold">542ms</span>
</div>

<div className="flex items-center gap-4">
<span className="font-code-base text-code-base text-primary font-semibold w-28 text-right">Candidate v1.5</span>
<div className="flex-1 h-8 bg-surface-container-low rounded-lg overflow-hidden flex shadow-inner">
<div className="bg-primary-container/40 flex items-center justify-center text-[10px] text-on-surface font-mono" style={{width: '4%'}} title="Ingress 22ms">22m</div>
<div className="bg-primary-container/70 flex items-center justify-center text-[10px] text-on-primary font-mono" style={{width: '21%'}} title="RAG 112ms">112m</div>
<div className="bg-primary-container flex items-center justify-center text-[10px] text-on-primary font-mono font-bold" style={{width: '41%'}} title="LLM 224ms">224ms LLM</div>
<div className="bg-tertiary flex items-center justify-center text-[10px] text-on-tertiary font-mono" style={{width: '10%'}} title="Guard 52ms">52m</div>
<div className="bg-transparent" style={{width: '24%'}}></div>
</div>
<span className="font-code-base text-code-base text-tertiary w-16 text-right font-bold">410ms</span>
</div>
</div>
</div>
</section>


</div></div>
    </>
  );
}