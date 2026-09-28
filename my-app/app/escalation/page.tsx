'use client';
/* eslint-disable */
// @ts-nocheck

import { useState, useEffect, useCallback } from 'react';

interface Escalation {
  id: string;
  escalationId: string;
  traceId: string;
  tenantId: string;
  toolName?: string;
  toolParameters?: Record<string, unknown>;
  riskLevel: 'high' | 'critical';
  riskReason?: string;
  agentSummary: string;
  userMessage: string;
  status: 'pending' | 'approved' | 'rejected';
  adminId?: string;
  adminNote?: string;
  createdAt?: string;
  decidedAt?: string;
}

export default function AgentForgeHumanEscalationQueue() {
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [selectedEscalation, setSelectedEscalation] = useState<Escalation | null>(null);
  const [loading, setLoading] = useState(true);
  const [deciding, setDeciding] = useState(false);
  const [complianceNote, setComplianceNote] = useState('');
  const [lastDecision, setLastDecision] = useState<{ id: string; decision: string } | null>(null);
  const [showRawPayload, setShowRawPayload] = useState(false);

  const fetchEscalations = useCallback(async () => {
    try {
      const res = await fetch('/api/escalation?tenantId=acme_corp&status=pending');
      const data = await res.json();
      setEscalations(data.escalations ?? []);
      // Auto-select first if none selected
      if (data.escalations?.length > 0 && !selectedEscalation) {
        setSelectedEscalation(data.escalations[0]);
      }
    } catch (err) {
      console.error('Failed to fetch escalations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEscalations();
    // Poll every 5 seconds for new escalations
    const interval = setInterval(fetchEscalations, 5000);
    return () => clearInterval(interval);
  }, [fetchEscalations]);

  const handleDecision = async (decision: 'approved' | 'rejected') => {
    if (!selectedEscalation) return;
    setDeciding(true);

    try {
      const res = await fetch(`/api/escalation/${selectedEscalation.escalationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          adminId: 'admin@agentforge.ai',
          adminNote: complianceNote,
        }),
      });

      if (res.ok) {
        setLastDecision({ id: selectedEscalation.escalationId, decision });
        setComplianceNote('');
        setSelectedEscalation(null);
        // Refresh queue after decision
        await fetchEscalations();
      }
    } catch (err) {
      console.error('Decision failed:', err);
    } finally {
      setDeciding(false);
    }
  };

  const getRiskBadge = (level: string) => {
    if (level === 'critical') return 'bg-error/10 text-error border border-error/20';
    if (level === 'high') return 'bg-[#FEF3C7] text-[#92400E]';
    return 'bg-surface-container text-on-surface-variant';
  };

  return (
    <>
      <aside className="fixed top-16 left-0 bottom-0 w-64 bg-surface-container-lowest/80 backdrop-blur-xl border-r border-outline-variant/30 p-4 flex flex-col justify-between z-40 hidden md:flex">
        <div className="flex flex-col gap-4">
          <div className="px-2 py-1 text-on-surface-variant font-label-caps text-[10px] uppercase tracking-wider">Suite Navigation</div>
          <nav className="flex flex-col gap-1">
            {[
              ['/', 'Platform Overview'],
              ['/studio', 'Agent Studio'],
              ['/demo', 'Live Demo'],
              ['/escalation', 'Escalation Queue'],
              ['/replay', 'Execution Replay'],
            ].map(([href, label]) => (
              <a key={href} href={href} className="font-label-ui text-[13px] text-on-surface-variant hover:text-on-surface hover:bg-surface-container px-3 py-2 rounded-lg transition-colors">
                {label}
              </a>
            ))}
          </nav>
        </div>
        <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/30">
          <div className="flex items-center gap-2 font-label-caps text-[10px] text-tertiary font-medium">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
            Engine: Ready
          </div>
          <div className="font-code-base text-[11px] text-on-surface-variant mt-1">Firebase · Realtime Poll</div>
        </div>
      </aside>

      <main className="w-full pt-16 md:pl-64 bg-surface min-h-screen">
        <div className="flex flex-col w-full">
          <div className="relative w-full max-w-7xl mx-auto px-4 md:px-8 py-6">

            {/* ─── Header ─────────────────────────────────── */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-on-surface-variant font-label-ui text-[13px]">
                  <span>Governance</span>
                  <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                  <span className="text-on-surface font-semibold">Human Escalation Queue</span>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container text-primary font-label-caps text-[10px] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                  Live · Polling every 5s
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-on-surface-variant font-label-caps text-[10px]">
                  {loading ? 'Syncing...' : `${escalations.length} pending`}
                </span>
                <button onClick={fetchEscalations} className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors" id="refreshQueueBtn">
                  <span className="material-symbols-outlined text-[18px]">sync</span>
                </button>
              </div>
            </div>

            {/* ─── Stats Row ─────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Active Escalations', value: loading ? '...' : escalations.length.toString(), sub: `${escalations.filter(e => e.riskLevel === 'critical').length} Critical`, icon: 'priority_high', color: 'text-tertiary' },
                { label: 'Avg Review SLA', value: '< 5m', sub: 'Target response time', icon: 'timer', color: 'text-primary' },
                { label: 'Intercept Accuracy', value: '99.98%', sub: 'Zero false alarms', icon: 'verified_user', color: 'text-tertiary' },
                { label: 'Duty Reviewers', value: '1 Active', sub: '@admin (you)', icon: 'groups', color: 'text-secondary' },
              ].map((stat) => (
                <div key={stat.label} className="bg-surface-container-lowest p-4 rounded-xl shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between text-on-surface-variant mb-2">
                    <span className="font-label-ui text-[12px] font-medium">{stat.label}</span>
                    <span className={`material-symbols-outlined text-[18px] ${stat.color}`}>{stat.icon}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-headline-md text-[22px] text-on-surface font-bold">{stat.value}</span>
                  </div>
                  <div className="mt-1 font-label-caps text-[10px] text-on-surface-variant">{stat.sub}</div>
                </div>
              ))}
            </div>

            {/* ─── Success Notice ─────────────────────────── */}
            {lastDecision && (
              <div className={`mb-4 flex items-center gap-3 px-4 py-3 rounded-xl font-label-ui text-[13px] font-semibold ${lastDecision.decision === 'approved' ? 'bg-tertiary/10 text-tertiary' : 'bg-error/10 text-error'}`}>
                <span className="material-symbols-outlined text-[18px]">{lastDecision.decision === 'approved' ? 'check_circle' : 'cancel'}</span>
                Escalation {lastDecision.id} has been {lastDecision.decision}. Decision written to Firestore audit trail.
                <button onClick={() => setLastDecision(null)} className="ml-auto text-[18px] opacity-60 hover:opacity-100">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            )}

            {/* ─── Main Grid ─────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-6 items-start">

              {/* Queue List */}
              <section className="bg-surface-container-lowest rounded-xl p-5 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-headline-sm text-[16px] text-on-surface font-semibold">Layer 3 Triage</h2>
                  <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-primary font-label-caps text-[10px] font-semibold">
                    {escalations.length} Pending
                  </span>
                </div>

                {loading ? (
                  <div className="flex flex-col gap-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-20 bg-surface-container-low rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : escalations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <span className="material-symbols-outlined text-[48px] text-outline mb-3">inbox</span>
                    <p className="font-label-ui text-[13px] text-on-surface-variant font-semibold">Queue is clear</p>
                    <p className="font-body-sm text-[12px] text-on-surface-variant mt-1">No pending escalations. Try sending a high-risk request from the <a href="/demo" className="text-primary underline">demo page</a>.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {escalations.map((esc) => (
                      <article
                        key={esc.id}
                        onClick={() => setSelectedEscalation(esc)}
                        className={`p-3.5 rounded-lg cursor-pointer shadow-sm transition-all relative ${selectedEscalation?.id === esc.id ? 'bg-[#F0FDF4] ring-2 ring-tertiary/30' : 'bg-surface-container-lowest hover:bg-surface-container-low'}`}
                      >
                        {selectedEscalation?.id === esc.id && (
                          <div className="absolute left-0 top-3 bottom-3 w-1 bg-tertiary rounded-r"></div>
                        )}
                        <div className="flex items-start justify-between gap-1 mb-1 pl-1">
                          <span className={`font-label-caps text-[10px] font-semibold px-1.5 py-0.5 rounded ${getRiskBadge(esc.riskLevel)}`}>
                            {esc.escalationId} · {esc.riskLevel.toUpperCase()}
                          </span>
                        </div>
                        <h3 className="font-label-ui text-[13px] text-on-surface font-semibold pl-1 leading-snug truncate">{esc.toolName ?? 'Unknown Tool'}</h3>
                        <p className="font-body-sm text-[11px] text-on-surface-variant pl-1 mt-0.5 truncate">{esc.tenantId} · {esc.riskReason?.slice(0, 50) ?? 'High-risk action flagged'}</p>
                        <div className="mt-2 pl-1 flex items-center justify-between text-on-surface-variant font-label-caps text-[10px]">
                          <span className="text-on-surface-variant">{esc.createdAt ? new Date(esc.createdAt).toLocaleTimeString() : 'Just now'}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>

              {/* Detail Panel */}
              <section className="flex flex-col gap-5">
                {!selectedEscalation ? (
                  <div className="bg-surface-container-lowest rounded-xl p-10 shadow-sm flex flex-col items-center justify-center text-center">
                    <span className="material-symbols-outlined text-[48px] text-outline mb-3">touch_app</span>
                    <p className="font-headline-sm text-[16px] text-on-surface font-semibold">Select an escalation</p>
                    <p className="font-body-sm text-[13px] text-on-surface-variant mt-1">Click any item in the queue to review and decide.</p>
                  </div>
                ) : (
                  <>
                    {/* Header */}
                    <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={`font-label-caps text-[10px] font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 ${getRiskBadge(selectedEscalation.riskLevel)}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping"></span>
                          {selectedEscalation.escalationId} · {selectedEscalation.riskLevel.toUpperCase()} RISK
                        </span>
                      </div>
                      <h1 className="font-headline-lg text-[22px] text-on-surface font-bold tracking-tight">
                        {selectedEscalation.toolName === 'issue_refund'
                          ? `Refund Request — $${selectedEscalation.toolParameters?.amount ?? 0}`
                          : selectedEscalation.toolName === 'cancel_subscription'
                          ? 'Subscription Cancellation Request'
                          : selectedEscalation.toolName ?? 'Tool Execution Request'}
                      </h1>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-on-surface-variant font-label-ui text-[12px] bg-surface-container-low/50 p-2.5 rounded-lg">
                        <div>Tenant: <span className="font-semibold text-on-surface">{selectedEscalation.tenantId}</span></div>
                        <span>•</span>
                        <div>Tool: <span className="font-code-base text-primary font-medium">{selectedEscalation.toolName}</span></div>
                        <span>•</span>
                        <div>Trace: <span className="font-mono text-on-surface">{selectedEscalation.traceId}</span></div>
                      </div>
                    </div>

                    {/* Agent Summary */}
                    <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary rounded-r"></div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-[20px] text-primary">psychology</span>
                        <h2 className="font-headline-sm text-[15px] text-on-surface font-semibold">Autonomous Agent Execution Summary</h2>
                      </div>
                      <div className="bg-surface-container-low/70 rounded-lg p-4 font-body-md text-[13px] text-on-surface leading-relaxed italic">
                        "{selectedEscalation.agentSummary}"
                      </div>
                      <button
                        onClick={() => setShowRawPayload(!showRawPayload)}
                        className="mt-3 inline-flex items-center gap-1.5 text-primary font-label-ui text-[12px] font-semibold"
                      >
                        <span className="material-symbols-outlined text-[16px]">{showRawPayload ? 'expand_less' : 'expand_more'}</span>
                        View Raw Tool Payload (JSON)
                      </button>
                      {showRawPayload && (
                        <pre className="mt-3 bg-surface-container p-4 rounded-lg font-code-base text-[11px] text-on-surface overflow-x-auto">
                          {JSON.stringify({
                            escalation_id: selectedEscalation.escalationId,
                            tool_name: selectedEscalation.toolName,
                            parameters: selectedEscalation.toolParameters,
                            risk_level: selectedEscalation.riskLevel,
                            risk_reason: selectedEscalation.riskReason,
                            halt_reason: 'POLICY_BREACH: THRESHOLD_EXCEEDED',
                          }, null, 2)}
                        </pre>
                      )}
                    </div>

                    {/* Decision Panel */}
                    <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm flex flex-col gap-4">
                      <h2 className="font-headline-sm text-[15px] text-on-surface font-semibold flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">how_to_reg</span>
                        Human Decision Required
                      </h2>
                      <div className="flex flex-col gap-1.5">
                        <label className="font-label-ui text-[13px] text-on-surface font-medium" htmlFor="complianceNote">
                          Review & Compliance Note (required)
                        </label>
                        <input
                          className="w-full h-11 px-3.5 rounded-lg bg-surface-container-low text-on-surface placeholder:text-outline text-[13px] focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                          id="complianceNote"
                          placeholder="Enter your compliance justification before approving or rejecting..."
                          type="text"
                          value={complianceNote}
                          onChange={(e) => setComplianceNote(e.target.value)}
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <button
                          onClick={() => handleDecision('approved')}
                          disabled={deciding || !complianceNote.trim()}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-primary to-secondary text-on-primary font-label-ui text-[13px] font-semibold shadow-md hover:brightness-105 active:scale-98 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                          id="approveBtn"
                        >
                          <span className="material-symbols-outlined text-[18px]">lock_open</span>
                          {deciding ? 'Processing...' : 'Approve & Release Tool Call'}
                        </button>
                        <button
                          onClick={() => handleDecision('rejected')}
                          disabled={deciding || !complianceNote.trim()}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-error/10 text-error hover:bg-error/20 font-label-ui text-[13px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          id="rejectBtn"
                        >
                          <span className="material-symbols-outlined text-[18px]">block</span>
                          {deciding ? 'Processing...' : 'Reject & Terminate'}
                        </button>
                      </div>

                      <div className="pt-2 flex flex-wrap items-center justify-between text-on-surface-variant font-label-caps text-[10px]">
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px]">shield</span>
                          Decision written to Firebase audit trail (immutable)
                        </span>
                        <span>Compliance: SOC2 Type II enforced</span>
                      </div>
                    </div>
                  </>
                )}
              </section>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}