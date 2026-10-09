'use client';

import { useState, useEffect } from 'react';

export default function OpsAgentsPage() {
  const [data, setData] = useState<{ actions: any[], stats: any } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAgents() {
      try {
        const res = await fetch('/api/ops/agents');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAgents();
  }, []);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-headline-lg font-bold text-on-surface">Global Agent Analytics</h1>
        <p className="text-on-surface-variant font-body-md mt-1">Platform-wide overview of autonomous agent operations across all tenants.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <span className="material-symbols-outlined animate-spin text-[32px] text-primary">progress_activity</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/20 shadow-sm">
              <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Total Emails Sent</h3>
              <p className="text-4xl font-bold text-primary">{data?.stats?.totalEmails || 0}</p>
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/20 shadow-sm">
              <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Reports Generated</h3>
              <p className="text-4xl font-bold text-primary">{data?.stats?.totalReports || 0}</p>
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/20 shadow-sm">
              <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Successful Actions</h3>
              <p className="text-4xl font-bold text-green-500">{data?.stats?.successfulActions || 0}</p>
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/20 shadow-sm">
              <h3 className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mb-2">Failed Actions</h3>
              <p className="text-4xl font-bold text-red-500">{data?.stats?.failedActions || 0}</p>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant/20 bg-surface-container-lowest">
              <h2 className="text-title-md font-semibold text-on-surface">Global Action Log</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant text-sm border-b border-outline-variant/30">
                    <th className="py-3 px-6 font-semibold">Tenant ID</th>
                    <th className="py-3 px-6 font-semibold">Agent</th>
                    <th className="py-3 px-6 font-semibold">User ID</th>
                    <th className="py-3 px-6 font-semibold">Details</th>
                    <th className="py-3 px-6 font-semibold">Status</th>
                    <th className="py-3 px-6 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {data?.actions && data.actions.length > 0 ? (
                    data.actions.map(action => (
                      <tr key={action.id} className="border-b border-outline-variant/10 hover:bg-surface-container-low/50">
                        <td className="py-3 px-6 text-on-surface-variant font-medium">
                          {action.tenantId}
                        </td>
                        <td className="py-3 px-6 text-on-surface capitalize font-medium">
                          {action.agentType}
                        </td>
                        <td className="py-3 px-6 text-on-surface-variant">
                          {action.userId}
                        </td>
                        <td className="py-3 px-6 text-on-surface-variant truncate max-w-xs">
                          {action.agentType === 'email' 
                            ? `To: ${action.actionDetails?.to}` 
                            : `Topic: ${action.actionDetails?.topic}`}
                        </td>
                        <td className="py-3 px-6">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            action.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {action.status}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-on-surface-variant">
                          {new Date(action.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-on-surface-variant">
                        No agent actions recorded across platform.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
