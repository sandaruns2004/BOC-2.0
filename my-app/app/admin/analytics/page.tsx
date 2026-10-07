'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/components/AuthProvider';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminAnalytics() {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const res = await fetch('/api/admin/analytics');
        if (res.ok) {
          const json = await res.json();
          setData(json.timeline || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-headline-lg font-bold text-on-surface">Analytics</h1>
          <p className="text-on-surface-variant font-body-md mt-1">Tenant usage, agent interactions, and API costs.</p>
        </div>
        <select className="px-4 py-2 bg-surface-container-low border border-outline-variant/30 text-on-surface rounded-lg focus:outline-none focus:border-primary">
          <option>Last 7 Days</option>
          <option>Last 30 Days</option>
          <option>This Month</option>
        </select>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-sm p-6 mb-8 h-96 flex flex-col relative overflow-hidden">
        <h2 className="text-title-md font-semibold text-on-surface mb-6">Token Usage & Chats Over Time</h2>
        
        {loading ? (
          <div className="flex-1 flex justify-center items-center">
            <span className="material-symbols-outlined animate-spin text-[32px] text-primary">progress_activity</span>
          </div>
        ) : data.length > 0 ? (
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.2)" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--on-surface-variant)', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--on-surface-variant)', fontSize: 12 }} dx={-10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--surface-container-highest)', border: '1px solid rgba(128,128,128,0.2)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--on-surface)' }}
                />
                <Area type="monotone" dataKey="tokens" name="Total Tokens" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorTokens)" />
                <Area type="monotone" dataKey="chats" name="Chat Queries" stroke="#10b981" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center z-10">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
              <span className="material-symbols-outlined text-[32px]">insights</span>
            </div>
            <h2 className="text-headline-sm font-semibold text-on-surface mb-2">Insufficient Data</h2>
            <p className="text-on-surface-variant text-sm max-w-sm">
              AgentForge requires at least 24 hours of sustained usage before telemetry charts can be rendered.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}