'use client';

export default function AdminAnalytics() {
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

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-sm p-6 mb-8 h-80 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent"></div>
        <div className="text-center z-10">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
            <span className="material-symbols-outlined text-[32px]">insights</span>
          </div>
          <h2 className="text-headline-sm font-semibold text-on-surface mb-2">Insufficient Data</h2>
          <p className="text-on-surface-variant text-sm max-w-sm">
            AgentForge requires at least 24 hours of sustained usage before telemetry charts can be rendered.
          </p>
        </div>
      </div>
    </div>
  );
}