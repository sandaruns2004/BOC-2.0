'use client';
import { useEffect, useState, type FormEvent } from 'react';
import type { CustomerSyncConfig } from '@/lib/customer-sync';

const fieldClass = 'mt-2 w-full rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm text-on-surface';
export default function CustomerSyncSettings() {
  const [config, setConfig] = useState<CustomerSyncConfig>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch('/api/admin/customer-sync', { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setConfig(data.config);
      } catch (e) { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Unable to load customer sync.'); }
    }
    void load(); return () => controller.abort();
  }, []);
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      const response = await fetch('/api/admin/customer-sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ config }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      setConfig(data.config); setMessage('Customer sync settings saved. Open Users & Access to import customers, or use Sync now there.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save customer sync.'); }
    finally { setBusy(false); }
  }
  return <section className="mt-8 rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-6 text-on-surface shadow-sm" aria-labelledby="customer-sync-heading">
    <h2 id="customer-sync-heading" className="text-title-md font-semibold">Customer database sync</h2>
    <p className="mt-2 text-sm text-on-surface-variant">Copy customer profiles from the Firebase connection above into Users &amp; Access. Your client keeps its own login system.</p>
    {config ? <form className="mt-5 space-y-4" onSubmit={save}>
      <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={config.enabled} onChange={e => setConfig({ ...config, enabled: e.target.checked })} />Enable customer sync</label>
      <label className="block text-sm font-semibold">Customer collection<input required className={fieldClass} value={config.collection} onChange={e => setConfig({ ...config, collection: e.target.value })} placeholder="users" /></label>
      <p className="text-xs text-on-surface-variant">Use name (or fullName/displayName), email, and optional isActive, status, createdAt. The document ID becomes the client customer ID. Passwords are never imported. Up to 500 customers per sync.</p>
      <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">Company filter field (optional)<input className={fieldClass} value={config.tenantField} onChange={e => setConfig({ ...config, tenantField: e.target.value })} placeholder="tenantId" /></label><label className="text-sm font-semibold">Company filter value<input className={fieldClass} value={config.tenantValue} onChange={e => setConfig({ ...config, tenantValue: e.target.value })} placeholder="Your company ID in the client database" /></label></div>
      <p className="text-xs text-on-surface-variant">Set both filter fields for a shared customer collection. Leave both blank only for a collection dedicated to your company.</p>
      <button disabled={busy} className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-on-primary disabled:opacity-50">{busy ? 'Saving…' : 'Save customer sync'}</button>
      <p className="text-xs text-on-surface-variant">While Users &amp; Access is open, the app checks the source database about every 30 seconds. Removed or inactive source customers lose access. Disabling a user here remains in effect after syncing.</p>
    </form> : <p className="mt-4 text-sm">{error || 'Loading customer sync settings…'}</p>}
    {config && error && <p role="alert" className="mt-4 text-sm text-error">{error}</p>}{message && <p role="status" className="mt-4 text-sm text-green-700">{message}</p>}
  </section>;
}
