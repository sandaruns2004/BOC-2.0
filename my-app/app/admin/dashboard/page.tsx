'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '@/app/components/AuthProvider';

type Stats = { totalUsers: number; totalDocs: number; tokenUsage: number; totalEscalations: number };
type Day = { date: string; chats: number };
type Review = { id: string; reason: string; status: string; urgency?: string; createdAt?: string };
const shortcuts = [
  { title: 'Update your knowledge', description: 'Upload policies and company documents', icon: 'library_books', href: '/admin/documents' },
  { title: 'Configure your assistant', description: 'Widget, branding and database connections', icon: 'tune', href: '/admin/settings' },
  { title: 'Manage customer access', description: 'View profiles and control permissions', icon: 'group', href: '/admin/users' },
  { title: 'Connect your applications', description: 'Manage server API keys and integrations', icon: 'key', href: '/admin/api-keys' },
];
const panel = 'rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.025)]';

function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <span aria-hidden="true" className={`material-symbols-outlined ${className}`}>{name}</span>;
}

async function fetchDashboard(signal?: AbortSignal) {
  const endpoints = ['/api/admin/stats', '/api/admin/analytics', '/api/escalation'];
  const results = await Promise.allSettled(endpoints.map(async endpoint => {
    const response = await fetch(endpoint, { signal, cache: 'no-store' });
    if (!response.ok) throw new Error('Unable to load dashboard data.');
    return response.json();
  }));
  return {
    stats: results[0].status === 'fulfilled' ? results[0].value as Stats : undefined,
    timeline: results[1].status === 'fulfilled' ? (results[1].value.timeline || []) as Day[] : undefined,
    reviews: results[2].status === 'fulfilled' ? (results[2].value.escalations || []) as Review[] : undefined,
    error: results.some(result => result.status === 'rejected') ? 'Some dashboard data could not be refreshed. Please try again.' : '',
  };
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>();
  const [timeline, setTimeline] = useState<Day[]>();
  const [reviews, setReviews] = useState<Review[]>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState<Date>();

  const applyData = useCallback((data: Awaited<ReturnType<typeof fetchDashboard>>) => {
    if (data.stats) setStats(data.stats);
    if (data.timeline) setTimeline(data.timeline);
    if (data.reviews) setReviews(data.reviews);
    setError(data.error);
    if (!data.error) setUpdatedAt(new Date());
    setLoading(false);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void fetchDashboard(controller.signal).then(data => { if (!controller.signal.aborted) applyData(data); });
    return () => controller.abort();
  }, [applyData]);

  const pending = reviews?.filter(review => review.status === 'pending').length;
  const recent = reviews ? [...reviews].sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))).slice(0, 5) : undefined;
  const weekChats = timeline?.reduce((total, day) => total + day.chats, 0);
  const cards = [
    { label: 'Customers', value: stats?.totalUsers, detail: 'Profiles in your workspace', icon: 'group', href: '/admin/users', tone: 'bg-indigo-50 text-indigo-600' },
    { label: 'Knowledge documents', value: stats?.totalDocs, detail: 'Your assistant’s knowledge base', icon: 'description', href: '/admin/documents', tone: 'bg-violet-50 text-violet-600' },
    { label: 'Recorded chats', value: stats?.tokenUsage, detail: 'All recorded conversations', icon: 'forum', href: '/admin/analytics', tone: 'bg-sky-50 text-sky-600' },
    { label: 'Awaiting review', value: pending === 100 ? '100+' : pending, detail: stats ? `${stats.totalEscalations.toLocaleString()} total review requests` : 'Human review queue', icon: 'pending_actions', href: '/admin/escalations', tone: 'bg-amber-50 text-amber-700' },
  ];

  return <div className="mx-auto w-full max-w-[1500px] space-y-7 px-5 py-7 text-slate-900 sm:px-8 lg:px-10 lg:py-9">
    <header className="flex flex-wrap items-start justify-between gap-5">
      <div>
        <p className="mb-2 text-sm font-medium text-indigo-600">Workspace overview</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Dashboard</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">Welcome back{user?.name ? `, ${user.name}` : ''}. Here’s what’s happening with your assistant.</p>
      </div>
      <div className="flex items-center gap-3 pt-1">
        <button type="button" onClick={() => { setLoading(true); setError(''); void fetchDashboard().then(applyData); }} disabled={loading} aria-label="Refresh dashboard" className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-50">
          <Icon name="refresh" className={loading ? 'animate-spin' : ''} />
        </button>
        <Link href="/admin/documents" className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"><Icon name="upload_file" className="text-[20px]" />Upload knowledge</Link>
      </div>
    </header>

    {error && <div role="alert" className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"><Icon name="info" className="text-[20px]" />{error}</div>}

    <section aria-label="Workspace summary" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(card => <Link key={card.label} href={card.href} className={`${panel} group p-5 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md`}>
        <div className="flex items-center justify-between"><span className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.tone}`}><Icon name={card.icon} className="text-[23px]" /></span><Icon name="north_east" className="text-[18px] text-slate-300 transition group-hover:text-indigo-500" /></div>
        <p className="mt-5 text-sm font-medium text-slate-500">{card.label}</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{card.value === undefined ? '—' : card.value.toLocaleString()}</p>
        <p className="mt-2 text-xs leading-5 text-slate-400">{card.detail}</p>
      </Link>)}
    </section>

    <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1.8fr)_minmax(260px,1fr)]">
      <section aria-labelledby="chat-activity-heading" className={`${panel} min-w-0 p-5 sm:p-6`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h2 id="chat-activity-heading" className="text-base font-semibold">Conversation activity</h2><p className="mt-1 text-xs text-slate-500">Recorded customer chats over the last 7 days</p></div>
          <Link href="/admin/analytics" className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800">View analytics<Icon name="arrow_forward" className="text-[16px]" /></Link>
        </div>
        <div className="mb-3 mt-5 flex items-baseline gap-2"><strong className="text-3xl font-semibold tracking-tight tabular-nums">{weekChats === undefined ? '—' : weekChats.toLocaleString()}</strong><span className="text-xs text-slate-400">chats this week</span></div>
        <div className="h-[230px] w-full">
          {timeline?.length ? <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeline} margin={{ top: 12, right: 10, left: -20, bottom: 0 }}>
              <defs><linearGradient id="dashboardChats" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity={0.2} /><stop offset="100%" stopColor="#6366f1" stopOpacity={0.01} /></linearGradient></defs>
              <CartesianGrid vertical={false} stroke="#eef2f6" strokeDasharray="4 4" />
              <XAxis dataKey="date" tickFormatter={date => date.split(' ').slice(0, 2).join(' ')} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dy={8} minTickGap={15} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 12 }} />
              <Area type="monotone" dataKey="chats" name="Recorded chats" stroke="#6366f1" strokeWidth={3} fill="url(#dashboardChats)" />
            </AreaChart>
          </ResponsiveContainer> : <div role="status" className="flex h-full flex-col items-center justify-center gap-2 text-sm text-slate-400"><Icon name="monitoring" className="text-[32px]" />{loading ? 'Loading conversation activity…' : 'No conversation activity available yet.'}</div>}
        </div>
      </section>

      <section aria-labelledby="quick-actions-heading" className={`${panel} p-5 sm:p-6`}>
        <h2 id="quick-actions-heading" className="text-base font-semibold">Workspace shortcuts</h2>
        <p className="mt-1 text-xs text-slate-500">Everything you need to manage your assistant</p>
        <div className="mt-5 space-y-2">
          {shortcuts.map(item => <Link key={item.href} href={item.href} className="group flex items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-indigo-50/70">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600"><Icon name={item.icon} className="text-[21px]" /></span>
            <div className="min-w-0 flex-1"><p className="text-sm font-medium">{item.title}</p><p className="mt-1 text-xs leading-5 text-slate-400">{item.description}</p></div>
            <Icon name="chevron_right" className="text-[18px] text-slate-300 group-hover:text-indigo-600" />
          </Link>)}
        </div>
      </section>
    </div>

    <section aria-labelledby="recent-reviews-heading" className={`${panel} overflow-hidden`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
        <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><Icon name="support_agent" className="text-[21px]" /></span><div><h2 id="recent-reviews-heading" className="text-base font-semibold">Recent review requests</h2><p className="mt-1 text-xs text-slate-500">Customer requests submitted for a human decision</p></div></div>
        <Link href="/admin/escalations" className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800">Open review queue<Icon name="arrow_forward" className="text-[16px]" /></Link>
      </div>
      {recent?.length ? <div className="divide-y divide-slate-100">{recent.map(review => <Link key={review.id} href="/admin/escalations" className="flex flex-wrap items-center gap-3 px-5 py-4 transition hover:bg-slate-50 sm:px-6">
        <span className={`h-2 w-2 shrink-0 rounded-full ${review.status === 'pending' ? 'bg-amber-400' : 'bg-slate-300'}`} aria-hidden="true" />
        <div className="min-w-0 flex-1 basis-48"><p className="truncate text-sm font-medium">{review.reason || 'Customer review request'}</p><p className="mt-1 text-xs text-slate-400">{review.createdAt && !Number.isNaN(Date.parse(review.createdAt)) ? new Date(review.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Asia/Colombo' }) : 'Date unavailable'}{review.urgency ? ` · ${review.urgency} priority` : ''}</p></div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${review.status === 'pending' ? 'bg-amber-50 text-amber-800' : review.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{review.status === 'pending' ? 'Awaiting review' : review.status}</span><Icon name="chevron_right" className="text-[18px] text-slate-300" />
      </Link>)}</div> : <p role="status" className="px-6 py-8 text-center text-sm text-slate-400">{loading ? 'Loading review requests…' : 'No review requests available.'}</p>}
    </section>

    <footer className="flex flex-wrap items-center justify-between gap-2 pb-2 text-xs text-slate-400"><span>Workspace · {user?.tenantId || 'Loading…'}</span><span>{loading ? 'Refreshing dashboard…' : updatedAt ? `Updated ${updatedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : 'Dashboard data unavailable'}</span></footer>
  </div>;
}
