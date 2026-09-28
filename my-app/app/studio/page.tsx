'use client';

import { FormEvent, useEffect, useState } from 'react';

type AgentConfig = { systemPrompt: string; modelPreference: 'flash' | 'pro'; refundLimit: number; allowedTools: string[]; deployed?: boolean };
const defaults: AgentConfig = { systemPrompt: 'You are a helpful customer service agent. Be concise, accurate, and empathetic.', modelPreference: 'flash', refundLimit: 100, allowedTools: ['check_order', 'issue_refund'] };

export default function StudioPage() {
  const [config, setConfig] = useState<AgentConfig>(defaults);
  const [status, setStatus] = useState<'loading' | 'idle' | 'saving' | 'saved' | 'error'>('loading');

  useEffect(() => { void loadConfig(); }, []);
  async function loadConfig() {
    try { const response = await fetch('/api/agent?tenantId=acme_corp'); const data = await response.json(); if (!response.ok) throw new Error(); setConfig({ systemPrompt: data.systemPrompt, modelPreference: data.modelPreference, refundLimit: data.refundLimit, allowedTools: data.allowedTools }); setStatus('idle'); }
    catch { setStatus('error'); }
  }
  async function saveConfig(event: FormEvent) {
    event.preventDefault(); setStatus('saving');
    try { const response = await fetch('/api/agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tenantId: 'acme_corp', ...config, guardrailRules: { blockInjections: true, scrubPii: true } }) }); if (!response.ok) throw new Error(); setStatus('saved'); }
    catch { setStatus('error'); }
  }
  const statusLabel = status === 'loading' ? 'Loading configuration' : status === 'saving' ? 'Saving changes' : status === 'saved' ? 'Deployed' : status === 'error' ? 'Could not save' : 'Draft';
  const statusClass = status === 'saved' ? 'status-ok' : status === 'error' ? 'status-danger' : 'status-neutral';

  return <main className="app-shell">
    <div className="page-heading"><div><p className="eyebrow">Agent studio</p><h1>One agent, one clear policy.</h1><p>Choose the model tier, define its operating instructions, and set the maximum autonomous refund.</p></div><span className={`status ${statusClass}`}>ΓùÅ {statusLabel}</span></div>
    <form className="grid grid-2" style={{ alignItems: 'start' }} onSubmit={saveConfig}>
      <section className="card card-pad"><h2 style={{ marginTop: 0, fontSize: 18 }}>Behavior</h2>
        <div className="field"><label htmlFor="system-prompt">System prompt</label><textarea id="system-prompt" className="textarea" maxLength={8000} value={config.systemPrompt} onChange={(event) => setConfig({ ...config, systemPrompt: event.target.value })} /></div>
        <p className="muted" style={{ fontSize: 12 }}>{config.systemPrompt.length.toLocaleString()} / 8,000 characters</p>
        <div className="field"><label htmlFor="tools">Allowed tools (comma-separated)</label><input id="tools" className="input" value={config.allowedTools.join(', ')} onChange={(event) => setConfig({ ...config, allowedTools: event.target.value.split(',').map((tool) => tool.trim()).filter(Boolean) })} /></div>
      </section>
      <section className="grid" style={{ gap: 18 }}><div className="card card-pad"><h2 style={{ marginTop: 0, fontSize: 18 }}>Runtime policy</h2>
        <div className="field"><label htmlFor="model">Model tier</label><select id="model" className="select" value={config.modelPreference} onChange={(event) => setConfig({ ...config, modelPreference: event.target.value as AgentConfig['modelPreference'] })}><option value="flash">Flash ΓÇö fast, lower cost</option><option value="pro">Pro ΓÇö more complex work</option></select></div>
        <div className="field" style={{ marginTop: 16 }}><label htmlFor="refund-limit">Autonomous refund limit (USD)</label><input id="refund-limit" className="input" type="number" min="0" max="100000" value={config.refundLimit} onChange={(event) => setConfig({ ...config, refundLimit: Number(event.target.value) })} /></div>
        <p className="muted" style={{ fontSize: 12 }}>Requests above this amount are routed to human review.</p>
        <button className="button" type="submit" disabled={status === 'loading' || status === 'saving'}>{status === 'saving' ? 'SavingΓÇª' : 'Deploy changes'}</button>
      </div>
      <div className="card card-pad"><span className="status status-ok">ΓùÅ Guardrails active</span><p className="muted" style={{ marginBottom: 0, lineHeight: 1.6 }}>Prompt-injection attempts are blocked before generation. Detected PII is replaced with a placeholder before it reaches the model.</p></div></section>
    </form>
  </main>;
}
