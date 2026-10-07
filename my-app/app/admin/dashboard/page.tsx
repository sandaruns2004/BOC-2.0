'use client';

import { useAuth } from '@/app/components/AuthProvider';

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-headline-lg font-bold text-on-surface">Welcome, {user?.name || 'Admin'}</h1>
          <p className="text-on-surface-variant font-body-md mt-1">Tenant ID: {user?.tenantId}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="p-6 rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/20">
          <div className="text-[12px] font-label-caps text-on-surface-variant uppercase mb-2">Total End Users</div>
          <div className="text-headline-md font-bold text-on-surface">0</div>
        </div>
        <div className="p-6 rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/20">
          <div className="text-[12px] font-label-caps text-on-surface-variant uppercase mb-2">Knowledge Base</div>
          <div className="text-headline-md font-bold text-on-surface">0 Docs</div>
        </div>
        <div className="p-6 rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/20">
          <div className="text-[12px] font-label-caps text-on-surface-variant uppercase mb-2">Token Usage</div>
          <div className="text-headline-md font-bold text-on-surface">0</div>
        </div>
        <div className="p-6 rounded-2xl bg-surface-container-lowest shadow-sm border border-outline-variant/20">
          <div className="text-[12px] font-label-caps text-on-surface-variant uppercase mb-2">Escalations</div>
          <div className="text-headline-md font-bold text-error">0</div>
        </div>
      </div>
    </div>
  );
}