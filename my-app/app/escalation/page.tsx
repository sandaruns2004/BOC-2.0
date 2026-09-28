'use client';

import { useCallback, useEffect, useState } from 'react';

type Escalation = { id: string; escalationId: string; tenantId: string; toolName?: string; toolParameters?: Record<string, unknown>; riskLevel: 'low' | 'high' | 'critical'; riskReason?: string; agentSummary?: string; createdAt?: string };

export default function EscalationPage() {
  const [items, setItems] = useState<Escalation[]>([]);
  const [selected, setSelected] = useState<Escalation | null>(null);
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<'loading' | 'idle' | 'saving' | 'error' | 'done'>('loading');
  const load = useCallback(async () => {
    setStatus('loading');
    try { const response = await fetch('/api/escalation?tenantId=acme_corp&status=pending'); const data = await response.json(); if (!response.ok) throw new Error(); const next = data.escalations ?? []; setItems(next); setSelected((current) => next.find((item: Escalation) => item.id === current?.id) ?? next[0] ?? null); setStatus('idle'); }
    catch { setStatus('error'); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  async function decide(decision: 'approved' | 'rejected') {
    if (!selected || !note.trim()) return;
    setStatus('saving');
    try { const response = await fetch(`/api/escalation/${selected.escalationId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ decision, adminId: 'admin@agentforge.ai', adminNote: note.trim() }) }); if (!response.ok) throw new Error(); setNote(''); setStatus('done'); await load(); }
    catch { setStatus('error'); }
  }
  const riskClass = selected?.riskLevel === 'critical' ? 'status-danger' : selected?.riskLevel === 'high' ? 'status-warn' : 'status-neutral';
  return <main className="app-shell">
    <div className="page-heading"><div><p className="eyebrow">Human review</p><h1>Approve sensitive actions.</h1><p>Every decision needs a short compliance note and becomes part of the audit trail.</p></div><button className="button button-secondary" type="button" onClick={load}>Refresh queue</button></div>
    {status === 'error' && <p className="status status-danger">Could not load or update the queue. Check Firebase configuration and try again.</p>}
    {status === 'done' && <p className="status status-ok">Decision recorded successfully.</p>}
    <div className="grid grid-2" style={{ alignItems: 'start' }}>
      <section className="card card-pad"><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h2 style={{ margin: 0, fontSize: 18 }}>Pending queue</h2><span className="status status-neutral">{items.length}</span></div><hr className="divider" />
        {status === 'loading' ? <p className="muted">Loading requests…</p> : items.length === 0 ? <p className="muted">The queue is clear. Run a high-risk example in the agent console to create a review request.</p> : <div className="grid" style={{ gap: 8 }}>{items.map((item) => <button key={item.id} type="button" onClick={() => setSelected(item)} className="button button-secondary" style={{ height: 'auto', minHeight: 64, display: 'block', textAlign: 'left', padding: 12, borderColor: selected?.id === item.id ? 'var(--blue)' : undefined }}><strong>{item.toolName ?? 'Requested action'}</strong><br /><span className="muted" style={{ fontSize: 12 }}>{item.escalationId} · {item.riskLevel} risk</span></button>)}</div>}
      </section>
      <section className="card card-pad">{!selected ? <p className="muted">Select a request to review it.</p> : <><span className={`status ${riskClass}`}>{selected.riskLevel.toUpperCase()} RISK</span><h2 style={{ margin: '14px 0 6px', fontSize: 22 }}>{selected.toolName ?? 'Requested action'}</h2><p className="muted" style={{ marginTop: 0 }}>{selected.riskReason ?? 'The policy requires a human decision before this action can run.'}</p><div className="code">{JSON.stringify(selected.toolParameters ?? {}, null, 2)}</div><p style={{ lineHeight: 1.6 }}>{selected.agentSummary ?? 'No agent summary was recorded.'}</p><hr className="divider" /><div className="field"><label htmlFor="review-note">Review note</label><textarea id="review-note" className="textarea" style={{ minHeight: 90 }} maxLength={2000} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Why is this decision appropriate?" /></div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 16 }}><button type="button" className="button" disabled={status === 'saving' || !note.trim()} onClick={() => decide('approved')}>{status === 'saving' ? 'Saving…' : 'Approve action'}</button><button type="button" className="button button-danger" disabled={status === 'saving' || !note.trim()} onClick={() => decide('rejected')}>Reject action</button></div></>}</section>
    </div>
  </main>;
}
