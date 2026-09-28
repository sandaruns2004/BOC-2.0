'use client';
/* eslint-disable */
// @ts-nocheck
import { useState, useEffect } from 'react';

export default function AgentForgeAgentStudio() {
  const [deploying, setDeploying] = useState(false);
  const [deployStatus, setDeployStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // State mapping to backend schema
  const [systemPrompt, setSystemPrompt] = useState(`# ROLE DEFINITION\nYou are Order Resolution Bot (v2.4) executing on behalf of tenant acme_corp.\n\n# BEHAVIORAL PROTOCOL\n1. Verify customer account tier against orders before committing mutations.\n2. Inspect target order state and verify shipment lock via warehouse webhook.\n3. Inquire retention discount matrix prior to initiating irrevocable cancellation flow.\n4. Escalate any refund operations exceeding $500.00 USD to the priority human review queue.\n\n# FALLBACK CONSTRAINT\nIf latency threshold > 1200ms or response is malformed, invoke claude-3-5-sonnet fallback node.`);
  const [modelPreference, setModelPreference] = useState<'flash' | 'pro'>('flash');
  const [refundLimit, setRefundLimit] = useState(500);

  // Fetch active configuration on load
  useEffect(() => {
    fetch('/api/agent?tenantId=acme_corp')
      .then(res => res.json())
      .then(data => {
        if (data.systemPrompt) setSystemPrompt(data.systemPrompt);
        if (data.modelPreference) setModelPreference(data.modelPreference);
        if (data.refundLimit) setRefundLimit(data.refundLimit);
      })
      .catch(console.error);
  }, []);

  const handleDeploy = async () => {
    setDeploying(true);
    setDeployStatus('idle');
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 'acme_corp',
          systemPrompt,
          modelPreference,
          refundLimit,
          allowedTools: ['check_order', 'issue_refund', 'logistics_webhook'],
          guardrailRules: { blockInjections: true, scrubbPii: true },
        }),
      });
      if (res.ok) {
        setDeployStatus('success');
        setTimeout(() => setDeployStatus('idle'), 3000);
      } else {
        setDeployStatus('error');
      }
    } catch (e) {
      setDeployStatus('error');
    } finally {
      setDeploying(false);
    }
  };

  return (
    <>
      <svg aria-hidden="true" className="inline-defs-container" style={{position: 'absolute', width: '0', height: '0', overflow: 'hidden'}}></svg><aside className="fixed top-16 left-0 bottom-0 w-64 bg-surface-container-lowest/80 backdrop-blur-xl border-r border-outline-variant/30 p-space-md flex flex-col justify-between z-40 hidden md:flex"><div className="flex flex-col gap-space-sm"><div className="px-2 py-1 text-on-surface-variant font-label-caps text-label-caps uppercase tracking-wider">Navigation</div><nav className="flex flex-col gap-1"><a className="font-label-ui text-label-ui text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low px-space-sm py-2 rounded-lg transition-colors" href="/launch">Console Trace</a><a className="font-label-ui text-label-ui bg-surface-container text-primary font-medium px-space-sm py-2 rounded-lg transition-colors" href="/studio">Agent Studio &amp; Knowledge Base</a><a className="font-label-ui text-label-ui text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low px-space-sm py-2 rounded-lg transition-colors" href="/architecture">Architecture</a><a className="font-label-ui text-label-ui text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low px-space-sm py-2 rounded-lg transition-colors" href="/security">Pillars &amp; Security</a><a className="font-label-ui text-label-ui text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low px-space-sm py-2 rounded-lg transition-colors" href="/demo">Live Flow Demo</a><a className="font-label-ui text-label-ui text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low px-space-sm py-2 rounded-lg transition-colors" href="/pricing">Pricing &amp; Economics</a><a className="font-label-ui text-label-ui text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low px-space-sm py-2 rounded-lg transition-colors" href="/escalation">Escalation Queue</a><a className="font-label-ui text-label-ui text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low px-space-sm py-2 rounded-lg transition-colors" href="/replay">Execution Replay</a></nav></div><div className="p-space-sm rounded-lg bg-surface-container-low border border-outline-variant/30"><div className="flex items-center gap-space-xs font-label-caps text-label-caps text-tertiary font-medium"><span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>Engine: Ready</div><div className="font-code-base text-code-base text-on-surface-variant mt-1">GCP us-central1</div></div></aside><main className="w-full pt-16 md:pl-64 bg-surface"><div className="flex flex-col w-full">

<div className="w-full bg-surface-container-lowest shadow-sm px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
<div className="flex items-center gap-3">
<div className="flex items-center gap-2 font-label-ui text-label-ui text-on-surface-variant">
<span>Fleet Workbench</span>
<span className="material-symbols-outlined text-[16px] text-outline">chevron_right</span>
<span className="text-on-surface font-semibold">Order Resolution Bot</span>
<span className="font-label-caps text-label-caps bg-surface-container-high text-primary px-2 py-0.5 rounded-full font-medium">v2.4-rc3</span>
</div>
<span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
<div className="hidden sm:flex items-center gap-1.5 font-label-caps text-label-caps text-tertiary">
<span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
<span>Synced to Firebase Firestore</span>
</div>
</div>

<div className="flex items-center gap-3">
<button className="px-3.5 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-ui text-label-ui flex items-center gap-1.5 transition-all" id="btn-save">
<span className="material-symbols-outlined text-[16px]">cloud_done</span>
<span>Draft Saved</span>
</button>
<button className="px-3.5 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-ui text-label-ui flex items-center gap-1.5 transition-all active:scale-98" id="btn-test">
<span className="material-symbols-outlined text-[16px] text-primary">play_arrow</span>
<span>Test Agent</span>
</button>
<button onClick={handleDeploy} disabled={deploying} className={`px-4 py-1.5 rounded-lg font-label-ui text-label-ui font-medium flex items-center gap-1.5 shadow-sm transition-all active:scale-98 disabled:opacity-60 ${deployStatus === 'success' ? 'bg-tertiary text-on-tertiary' : deployStatus === 'error' ? 'bg-error text-on-error' : 'bg-primary hover:bg-primary-container text-on-primary'}`} id="btn-deploy">
<span className="material-symbols-outlined text-[16px]">{deployStatus === 'success' ? 'check_circle' : deployStatus === 'error' ? 'error' : 'rocket_launch'}</span>
<span>{deploying ? 'Deploying...' : deployStatus === 'success' ? 'Deployed ✓' : deployStatus === 'error' ? 'Failed — Retry' : 'Deploy v2.4'}</span>
</button>
</div>
</div>

<div className="w-full p-8 max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 items-start">

<aside className="w-full lg:w-[320px] shrink-0 flex flex-col gap-6">

<div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col gap-5">
<div className="flex items-center justify-between">
<h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight">Runtime Core</h2>
<span className="font-label-caps text-label-caps bg-surface-container px-2 py-0.5 rounded text-on-surface-variant">ACTIVE SPEC</span>
</div>

<div className="flex flex-col gap-2">
<div className="flex items-center justify-between">
<label className="font-label-ui text-label-ui text-on-surface-variant font-medium">Agent Engine</label>
<span className="font-label-caps text-label-caps text-tertiary">P50 180ms</span>
</div>
<div className="relative bg-surface-container-low rounded-lg p-3 flex items-center justify-between cursor-pointer hover:bg-surface-container transition-colors">
<div className="flex items-center gap-2.5">
<div className="w-7 h-7 rounded-md bg-primary-fixed flex items-center justify-center text-primary">
<span className="material-symbols-outlined text-[18px]">bolt</span>
</div>
<div className="flex flex-col">
<span className="font-label-ui text-label-ui text-on-surface font-semibold">Gemini 3.5 Flash</span>
<span className="font-code-base text-[11px] text-on-surface-variant">google/gemini-3.5-flash</span>
</div>
</div>
<span className="material-symbols-outlined text-outline text-[18px]">unfold_more</span>
</div>
</div>

<div className="flex flex-col gap-2">
<div className="flex items-center justify-between">
<label className="font-label-ui text-label-ui text-on-surface-variant font-medium">Automatic Fallback</label>
<span className="font-label-caps text-label-caps text-on-surface-variant">Circuit: Armed</span>
</div>
<div className="relative bg-surface-container-low rounded-lg p-3 flex items-center justify-between cursor-pointer hover:bg-surface-container transition-colors">
<div className="flex items-center gap-2.5">
<div className="w-7 h-7 rounded-md bg-secondary-fixed flex items-center justify-center text-secondary">
<span className="material-symbols-outlined text-[18px]">alt_route</span>
</div>
<div className="flex flex-col">
<span className="font-label-ui text-label-ui text-on-surface font-semibold">Gemini 3.6 Flash</span>
<span className="font-code-base text-[11px] text-on-surface-variant">google/gemini-3.6-flash</span>
</div>
</div>
<span className="material-symbols-outlined text-outline text-[18px]">unfold_more</span>
</div>
</div>

<div className="flex flex-col gap-2 pt-2">
<div className="flex items-center justify-between">
<label className="font-label-ui text-label-ui text-on-surface-variant font-medium">Autonomous Financial Cap</label>
<span className="font-label-caps text-label-caps text-error bg-error-container/40 px-1.5 py-0.5 rounded">HARD LIMIT</span>
</div>
<div className="bg-surface-container-low rounded-lg p-3 flex items-center justify-between">
<div className="flex items-center gap-2">
<span className="font-headline-sm text-headline-sm text-on-surface font-semibold">${refundLimit.toFixed(2)}</span>
<span className="font-label-caps text-label-caps text-on-surface-variant">USD / tx</span>
</div>
<span className="material-symbols-outlined text-primary text-[20px]">lock_clock</span>
</div>

<div className="bg-surface-container rounded-xl p-3.5 mt-1 flex items-start gap-2.5">
<span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">verified_user</span>
<p className="font-body-sm text-body-sm text-on-surface leading-snug">
              Mutations above <strong className="font-semibold text-primary">${refundLimit.toFixed(2)}</strong> automatically trigger Layer 3 Human Escalation &amp; suspend tool commit.
            </p>
</div>
</div>
</div>

<div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm flex flex-col gap-4">
<h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider font-semibold">Workspace Context</h3>
<div className="flex flex-col gap-2">
<div className="flex justify-between font-label-ui text-label-ui">
<span className="text-on-surface-variant">Context Window (128k)</span>
<span className="font-semibold text-on-surface">1,842 tokens (1.4%)</span>
</div>
<div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
<div className="bg-primary h-full rounded-full transition-all duration-500" style={{width: '1.44%'}}></div>
</div>
</div>
<div className="grid grid-cols-2 gap-3 pt-2">
<div className="bg-surface-container-low rounded-lg p-3 flex flex-col">
<span className="font-label-caps text-label-caps text-on-surface-variant">EST. INFERENCE</span>
<span className="font-headline-sm text-[16px] text-on-surface font-semibold mt-1">$0.00014</span>
</div>
<div className="bg-surface-container-low rounded-lg p-3 flex flex-col">
<span className="font-label-caps text-label-caps text-on-surface-variant">ROUTING</span>
<span className="font-headline-sm text-[16px] text-on-surface font-semibold mt-1">Zero-Leak VPC</span>
</div>
</div>
</div>
</aside>

<main className="flex-1 w-full min-w-0 flex flex-col gap-6">

<div className="bg-surface-container-lowest rounded-xl shadow-sm px-6 pt-3 flex items-center justify-between overflow-x-auto">
<div className="flex items-center gap-8">

<button className="flex items-center gap-2 py-3 border-b-2 border-primary text-primary font-label-ui text-label-ui font-semibold cursor-pointer">
<span className="material-symbols-outlined text-[18px]">terminal</span>
<span>System Prompt</span>
<span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
</button>

<button className="flex items-center gap-2 py-3 border-b-2 border-transparent text-on-surface-variant hover:text-on-surface font-label-ui text-label-ui transition-colors">
<span className="material-symbols-outlined text-[18px]">extension</span>
<span>Tool Bindings</span>
<span className="font-label-caps text-label-caps bg-surface-container-high text-on-surface px-1.5 py-0.2 rounded-full font-medium">3</span>
</button>

<button className="flex items-center gap-2 py-3 border-b-2 border-transparent text-on-surface-variant hover:text-on-surface font-label-ui text-label-ui transition-colors">
<span className="material-symbols-outlined text-[18px]">database</span>
<span>Knowledge Base (RAG)</span>
<span className="font-label-caps text-label-caps bg-surface-container-high text-on-surface px-1.5 py-0.2 rounded-full font-medium">4 files</span>
</button>
</div>
<div className="hidden sm:flex items-center gap-2 py-2">
<span className="font-label-caps text-label-caps text-tertiary bg-tertiary-fixed-dim/20 px-2 py-1 rounded">Jinja2 Engine Valid</span>
<span className="font-label-caps text-label-caps text-on-surface-variant bg-surface-container-low px-2 py-1 rounded">UTF-8 Encoded</span>
</div>
</div>

<div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">

<div className="bg-surface-container-low px-6 py-3 flex items-center justify-between">
<div className="flex items-center gap-3">
<div className="flex items-center gap-1.5">
<span className="w-2.5 h-2.5 rounded-full bg-outline-variant"></span>
<span className="w-2.5 h-2.5 rounded-full bg-outline-variant"></span>
<span className="w-2.5 h-2.5 rounded-full bg-outline-variant"></span>
</div>
<span className="font-code-base text-[12px] text-on-surface-variant ml-2 font-medium">order_resolver_v2.4.jinja2</span>
</div>

<div className="flex items-center gap-3">
<button className="text-on-surface-variant hover:text-on-surface font-label-ui text-label-ui flex items-center gap-1 py-1 px-2 rounded hover:bg-surface-container transition-colors">
<span className="material-symbols-outlined text-[16px]">content_copy</span>
<span>Copy</span>
</button>
<button className="text-on-surface-variant hover:text-on-surface font-label-ui text-label-ui flex items-center gap-1 py-1 px-2 rounded hover:bg-surface-container transition-colors">
<span className="material-symbols-outlined text-[16px]">history</span>
<span>Revisions</span>
</button>
</div>
</div>

<div className="p-6 font-code-base text-code-base leading-relaxed overflow-x-auto flex">

<div className="select-none text-outline/60 pr-6 text-right font-code-base text-[13px] flex flex-col gap-1 shrink-0">
<span>01</span>
<span>02</span>
<span>03</span>
<span>04</span>
<span>05</span>
<span>06</span>
<span>07</span>
<span>08</span>
<span>09</span>
<span>10</span>
<span>11</span>
<span>12</span>
<span>13</span>
<span>14</span>
</div>

<div className="flex-1 min-w-[520px] flex flex-col gap-1 text-on-surface">
<div><span className="text-secondary font-medium"># ROLE DEFINITION</span></div>
<div>
              You are <span className="text-primary font-medium">Order Resolution Bot (v2.4)</span> executing on behalf of tenant 
              <span className="bg-primary-fixed/60 text-on-primary-fixed px-1.5 py-0.5 rounded text-[12px] font-semibold tracking-wide">{"{"}{"{"} tenant_id {"}"}{"}"}</span>.
            </div>
<div className="h-4"></div>
<div><span className="text-secondary font-medium"># BEHAVIORAL PROTOCOL</span></div>
<div>
              1. Verify customer account tier 
              <span className="bg-primary-fixed/60 text-on-primary-fixed px-1.5 py-0.5 rounded text-[12px] font-semibold tracking-wide">{"{"}{"{"} user_tier {"}"}{"}"}</span> 
              against Cloud SQL orders table before committing mutations.
            </div>
<div>
              2. Inspect target order state for 
              <span className="bg-primary-fixed/60 text-on-primary-fixed px-1.5 py-0.5 rounded text-[12px] font-semibold tracking-wide">{"{"}{"{"} order_id {"}"}{"}"}</span> 
              and verify shipment lock via warehouse webhook.
            </div>
<div>
              3. Inquire retention discount matrix prior to initiating irrevocable cancellation flow.
            </div>
<div>
              4. Escalate any refund operations exceeding <span className="font-semibold text-error">$500.00 USD</span> to the priority human review queue.
            </div>
<div className="h-4"></div>
<div><span className="text-secondary font-medium"># FALLBACK CONSTRAINT</span></div>
<div>
              If latency threshold &gt; 1200ms or response is malformed, trigger state dump and retry with <span className="text-primary">gemini-3.6-flash</span> then <span className="text-primary">gemini-3.5-flash-lite</span> fallback chain.
            </div>
</div>
</div>

<div className="bg-surface-container-low px-6 py-4 flex flex-wrap items-center justify-between gap-4">
<div className="flex items-center gap-2">
<span className="font-label-caps text-label-caps text-on-surface-variant font-medium">DETECTED JINJA2 VARIABLES:</span>
<div className="flex flex-wrap gap-1.5">
<span className="bg-surface-container-highest text-primary font-code-base text-[11px] px-2 py-0.5 rounded flex items-center gap-1">
<span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                tenant_id
              </span>
<span className="bg-surface-container-highest text-primary font-code-base text-[11px] px-2 py-0.5 rounded flex items-center gap-1">
<span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                user_tier
              </span>
<span className="bg-surface-container-highest text-primary font-code-base text-[11px] px-2 py-0.5 rounded flex items-center gap-1">
<span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                order_id
              </span>
</div>
</div>
<div className="flex items-center gap-3">
<span className="font-label-caps text-label-caps text-on-surface-variant">1,842 Tokens</span>
<span className="w-1 h-1 rounded-full bg-outline-variant"></span>
<span className="font-label-caps text-label-caps text-on-surface-variant">Compiler: Ready</span>
</div>
</div>
</div>

<div className="grid grid-cols-1 md:grid-cols-3 gap-4">

<div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm flex items-start justify-between">
<div className="flex flex-col gap-1">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-[18px] text-primary">database</span>
<span className="font-label-ui text-label-ui font-semibold text-on-surface">Cloud SQL Connector</span>
</div>
<p className="font-body-sm text-[12px] text-on-surface-variant">Read-only schema access to order headers &amp; SKUs</p>
</div>
<span className="w-2 h-2 rounded-full bg-tertiary"></span>
</div>

<div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm flex items-start justify-between">
<div className="flex flex-col gap-1">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-[18px] text-primary">credit_card</span>
<span className="font-label-ui text-label-ui font-semibold text-on-surface">Stripe Ledger Gateway</span>
</div>
<p className="font-body-sm text-[12px] text-on-surface-variant">Scoped refund dispatch with $500 hard circuit</p>
</div>
<span className="w-2 h-2 rounded-full bg-tertiary"></span>
</div>

<div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm flex items-start justify-between">
<div className="flex flex-col gap-1">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-[18px] text-primary">local_shipping</span>
<span className="font-label-ui text-label-ui font-semibold text-on-surface">Logistics Courier API</span>
</div>
<p className="font-body-sm text-[12px] text-on-surface-variant">Intercept &amp; hold in-transit parcel fulfillments</p>
</div>
<span className="w-2 h-2 rounded-full bg-tertiary"></span>
</div>
</div>
</main>
</div>

</div></main>
    </>
  );
}