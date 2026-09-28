'use client';
/* eslint-disable */
// @ts-nocheck
import { useState, useEffect } from 'react';

export default function AgentForgeLaunchConsole() {
  const [activeTab, setActiveTab] = useState<'live' | 'quota' | 'admin'>('live');
  const [fleetData, setFleetData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFleet() {
      try {
        const res = await fetch('/api/fleet');
        const data = await res.json();
        setFleetData(data);
      } catch (err) {
        console.error('Failed to fetch fleet data', err);
      } finally {
        setLoading(false);
      }
    }
    fetchFleet();
  }, []);

  return (
    <>
      <svg aria-hidden="true" className="inline-defs-container" style={{position: 'absolute', width: '0', height: '0', overflow: 'hidden'}}></svg>
      <main className="w-full pt-16 bg-surface">
        <div className="flex flex-col w-full">
          <div className="w-full max-w-7xl mx-auto px-margin-sm md:px-margin py-space-xl flex flex-col gap-space-xl">
            
            {/* Header */}
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
                <button className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface-container-lowest text-on-surface shadow-sm hover:bg-surface-container-low transition-colors font-label-ui text-label-ui" type="button">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  <span>Acme Corp #1042</span>
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant">expand_more</span>
                </button>
                <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-on-primary font-label-ui text-label-ui font-medium shadow-md shadow-primary/20 hover:brightness-105 active:scale-95 transition-all" type="button">
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  <span>Deploy Agent</span>
                </button>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-gutter">
              <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between gap-space-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="font-label-ui text-label-ui text-on-surface-variant uppercase tracking-wider">Active Fleet</span>
                  <span className="material-symbols-outlined text-primary text-[20px]">smart_toy</span>
                </div>
                <div className="flex flex-col">
                  <div className="font-headline-md text-headline-md text-on-surface font-semibold">{loading ? '...' : `${fleetData?.agents} Agents`}</div>
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
                  <div className="font-headline-md text-headline-md text-tertiary font-semibold">{loading ? '...' : `${fleetData?.p50Latency}ms`}</div>
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
                  <div className="font-headline-md text-headline-md text-on-surface font-semibold">{loading ? '...' : `${fleetData?.guardrailIntercepts}%`}</div>
                  <div className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">14 total flagged, deterministic</div>
                </div>
              </div>
              
              <div className="p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col justify-between gap-space-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="font-label-ui text-label-ui text-on-surface-variant uppercase tracking-wider">Monthly Run Rate</span>
                  <span className="material-symbols-outlined text-secondary text-[20px]">payments</span>
                </div>
                <div className="flex flex-col">
                  <div className="font-headline-md text-headline-md text-on-surface font-semibold">{loading ? '...' : `$${fleetData?.runRate}`}</div>
                  <div className="font-body-sm text-body-sm text-tertiary font-medium mt-0.5">12% under budget ceiling</div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
              
              {/* Left Column (Workloads) */}
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
                              <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span> Healthy
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

                    {/* Additional workload rows can go here... omitted for brevity */}
                  </div>
                  
                  <div className="p-space-md rounded-lg bg-surface-container-low flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-primary text-[20px] shrink-0">verified_user</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Autonomous sandbox memory isolation active across all 3 containers · TLS 1.3 / gRPC
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column (Tabs) */}
              <div className="lg:col-span-5 flex flex-col gap-space-lg">
                <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-xl flex flex-col gap-space-lg">
                  <div className="flex items-center justify-between border-none bg-surface-container-low p-1 rounded-lg">
                    <button 
                      onClick={() => setActiveTab('live')}
                      className={`flex-1 py-1.5 px-3 rounded-md font-label-ui text-label-ui font-medium transition-all ${activeTab === 'live' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
                    >
                      Live Activity
                    </button>
                    <button 
                      onClick={() => setActiveTab('quota')}
                      className={`flex-1 py-1.5 px-3 rounded-md font-label-ui text-label-ui font-medium flex items-center justify-center gap-1.5 transition-all ${activeTab === 'quota' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
                    >
                      <span>Routing &amp; Quotas</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-surface-container-high text-primary font-label-caps text-label-caps">68%</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('admin')}
                      className={`flex-1 py-1.5 px-3 rounded-md font-label-ui text-label-ui font-medium transition-all ${activeTab === 'admin' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
                    >
                      Admin Actions
                    </button>
                  </div>

                  {/* Tab Content: Live */}
                  {activeTab === 'live' && (
                    <div className="flex flex-col gap-space-lg">
                      <div className="flex flex-col gap-space-sm p-space-md rounded-xl bg-surface">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">24h Fleet Throughput</span>
                            <span className="font-body-md text-body-md font-semibold text-on-surface">99.98% OK <span className="font-body-sm font-normal text-on-surface-variant">· peak 4.8k tokens/sec</span></span>
                          </div>
                          <div className="w-2 h-2 rounded-full bg-tertiary"></div>
                        </div>
                        
                        {/* Chart (simplified for space) */}
                        <div className="w-full h-24 pt-2 border-b border-outline-variant/30">
                          <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 400 90">
                            <defs>
                              <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25"></stop>
                                <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.00"></stop>
                              </linearGradient>
                            </defs>
                            <path d="M 0,75 Q 40,65 80,68 T 160,40 T 240,45 T 320,20 T 400,12 L 400,90 L 0,90 Z" fill="url(#chartGradient)"></path>
                            <path d="M 0,75 Q 40,65 80,68 T 160,40 T 240,45 T 320,20 T 400,12" fill="none" stroke="#4f46e5" strokeLinecap="round" strokeWidth="2.5"></path>
                            <circle cx="400" cy="12" fill="#4f46e5" r="4"></circle>
                          </svg>
                        </div>
                      </div>

                      <div className="flex flex-col gap-space-sm">
                        <div className="flex items-center justify-between">
                          <h3 className="font-body-md text-body-md font-semibold text-on-surface">Recent Autonomous Decisions</h3>
                          <span className="font-label-caps text-label-caps text-on-surface-variant">TELEMETRY STREAM</span>
                        </div>
                        <div className="flex flex-col gap-2.5">
                          {!loading && fleetData?.recentDecisions.map((decision: any) => (
                            <div key={decision.id} className="p-space-sm rounded-lg bg-surface flex items-center justify-between gap-space-sm hover:bg-surface-container-low transition-colors">
                              <div className="flex items-center gap-space-sm min-w-0">
                                <span className={`material-symbols-outlined text-[18px] shrink-0 ${decision.type === 'success' ? 'text-tertiary' : 'text-primary'}`}>
                                  {decision.type === 'success' ? 'check_circle' : 'verified'}
                                </span>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-body-sm text-body-sm text-on-surface font-medium truncate">{decision.title}</span>
                                  <span className={`font-label-caps text-label-caps ${decision.type === 'success' ? 'text-tertiary' : 'text-primary'}`}>{decision.tag}</span>
                                </div>
                              </div>
                              <span className="font-code-base text-code-base text-on-surface-variant shrink-0">{decision.time}</span>
                            </div>
                          ))}
                          {loading && <div className="text-center p-4 text-on-surface-variant">Loading decisions...</div>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab Content: Quotas */}
                  {activeTab === 'quota' && (
                    <div className="flex flex-col gap-space-md">
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
                  )}

                  {/* Tab Content: Admin */}
                  {activeTab === 'admin' && (
                    <div className="flex flex-col gap-space-md">
                      <div className="p-space-md rounded-xl bg-surface flex flex-col gap-space-sm">
                        <span className="font-body-md text-body-md font-semibold text-on-surface">Emergency Fleet Shutdown</span>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">Instantly terminates active inference contexts and halts queued actions across all tenants.</p>
                        <button className="mt-2 self-start px-3.5 py-1.5 rounded-lg bg-error text-on-error font-label-ui text-label-ui font-medium hover:opacity-90 transition-opacity" type="button">
                          Suspend All Workloads
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </>
  );
}