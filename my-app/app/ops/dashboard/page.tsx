'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function OpsDashboard() {
  const [stats, setStats] = useState({
    totalTenants: 0,
    activeEndUsers: 0,
    totalInvocations: 0,
    mrr: 0,
    trend: [0, 0, 0, 0, 0, 0, 0]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/ops/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  // Calculate max trend value for scaling the bar heights
  const maxTrend = Math.max(...stats.trend, 1);

  return (
    <div className="p-8 pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-headline-lg font-bold text-on-surface">Platform Dashboard</h1>
          <p className="text-on-surface-variant font-body-md mt-1">Global metrics across all tenants.</p>
        </div>
      </div>
      
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="p-6 rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/20 relative overflow-hidden group hover:border-primary/30 transition-colors">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <div className="text-[12px] font-label-caps text-on-surface-variant uppercase mb-2">Total Tenants</div>
          <div className="text-headline-md font-bold text-on-surface">{loading ? '...' : stats.totalTenants}</div>
          <div className="text-[11px] text-tertiary font-medium mt-1">Verified Organizations</div>
        </div>
        
        <div className="p-6 rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/20 relative overflow-hidden group hover:border-primary/30 transition-colors">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-secondary/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <div className="text-[12px] font-label-caps text-on-surface-variant uppercase mb-2">Active End Users</div>
          <div className="text-headline-md font-bold text-on-surface">{loading ? '...' : stats.activeEndUsers}</div>
          <div className="text-[11px] text-on-surface-variant mt-1">Across all tenants</div>
        </div>
        
        <div className="p-6 rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/20 relative overflow-hidden group hover:border-primary/30 transition-colors">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-tertiary/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <div className="text-[12px] font-label-caps text-on-surface-variant uppercase mb-2">Total Invocations</div>
          <div className="text-headline-md font-bold text-on-surface">{loading ? '...' : stats.totalInvocations.toLocaleString()}</div>
          <div className="text-[11px] text-tertiary font-medium mt-1">API & Chat Queries</div>
        </div>
        
        <div className="p-6 rounded-2xl bg-primary/5 shadow-sm border border-primary/20 relative overflow-hidden group">
          <div className="text-[12px] font-label-caps text-primary uppercase mb-2">Platform MRR</div>
          <div className="text-headline-md font-bold text-primary">${loading ? '...' : stats.mrr.toLocaleString()}</div>
          <div className="text-[11px] text-primary/70 mt-1">Based on $499/mo tier</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart Area */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-title-lg font-bold text-on-surface">Platform Usage Trend</h2>
            <select className="bg-surface-container-low text-on-surface-variant text-sm px-3 py-1.5 rounded-lg border border-outline-variant/30 outline-none">
              <option>Last 7 Days</option>
            </select>
          </div>
          <div className="h-64 flex items-end justify-between gap-2 px-2 mt-4">
            {stats.trend.map((val, i) => {
              const heightPct = stats.totalInvocations === 0 ? 2 : Math.max((val / maxTrend) * 100, 2);
              return (
                <div key={i} className="w-full h-full relative group flex items-end">
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-inverse-surface text-inverse-on-surface text-[10px] px-2 py-1 rounded shadow-lg pointer-events-none whitespace-nowrap z-10">
                    {val} invocations
                  </div>
                  <div className="w-full bg-primary/20 group-hover:bg-primary/40 transition-colors rounded-t-md" style={{ height: `${heightPct}%` }}></div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-4 text-xs font-code-base text-on-surface-variant px-4">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </div>

        {/* System & Next Steps */}
        <div className="space-y-6">
          <Link href="/ops/admins" className="block p-8 rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/20 flex flex-col items-center justify-center text-center hover:bg-surface-container-low transition-colors group cursor-pointer">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-primary text-[32px]">manage_accounts</span>
            </div>
            <h2 className="text-title-md font-bold text-on-surface mb-2">Manage Tenants</h2>
            <p className="text-on-surface-variant text-[13px]">
              Provision new isolated workspaces and assign Business Admins.
            </p>
          </Link>

          <div className="p-6 rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/20">
            <h2 className="text-title-md font-bold text-on-surface mb-4">Infrastructure Status</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-tertiary">dns</span>
                  <span className="text-sm font-medium text-on-surface">MicroVM Cluster</span>
                </div>
                <span className="flex h-2.5 w-2.5 rounded-full bg-tertiary animate-pulse"></span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">database</span>
                  <span className="text-sm font-medium text-on-surface">Vector DB Nodes</span>
                </div>
                <span className="flex h-2.5 w-2.5 rounded-full bg-primary animate-pulse"></span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-secondary">security</span>
                  <span className="text-sm font-medium text-on-surface">Guardrail Proxies</span>
                </div>
                <span className="flex h-2.5 w-2.5 rounded-full bg-secondary animate-pulse"></span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}