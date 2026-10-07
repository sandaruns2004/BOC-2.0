'use client';

import { useState, useEffect } from 'react';

interface Admin {
  id: string;
  name: string;
  email: string;
  company: string;
  tenantId: string;
  isActive: boolean;
  createdAt: string;
}

export default function OpsAdmins() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', company: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    fetchAdmins();
  }, []);

  async function fetchAdmins() {
    try {
      const res = await fetch('/api/ops/admins');
      if (res.ok) {
        const data = await res.json();
        setAdmins(data.admins);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/ops/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      
      if (res.ok) {
        const data = await res.json();
        setAdmins([data.admin, ...admins]);
        setShowModal(false);
        setForm({ name: '', email: '', company: '', password: '' });
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create admin');
      }
    } catch (e) {
      setError('An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStatus(id: string, currentStatus: boolean) {
    try {
      const res = await fetch('/api/ops/admins', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !currentStatus })
      });
      if (res.ok) {
        setAdmins(admins.map(a => a.id === id ? { ...a, isActive: !currentStatus } : a));
      }
    } catch (e) {
      console.error(e);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setToast('Tenant ID copied: ' + text);
    setTimeout(() => setToast(''), 3000);
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-headline-lg font-bold text-on-surface">Manage Business Admins</h1>
          <p className="text-on-surface-variant font-body-md mt-1">Provision and manage isolated tenants.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-primary text-on-primary rounded-lg font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          New Tenant Admin
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-surface-container-low border-b border-outline-variant/20">
            <tr>
              <th className="px-6 py-4 text-xs font-label-caps uppercase text-on-surface-variant">Admin Name</th>
              <th className="px-6 py-4 text-xs font-label-caps uppercase text-on-surface-variant">Company</th>
              <th className="px-6 py-4 text-xs font-label-caps uppercase text-on-surface-variant">Tenant ID</th>
              <th className="px-6 py-4 text-xs font-label-caps uppercase text-on-surface-variant">Status</th>
              <th className="px-6 py-4 text-xs font-label-caps uppercase text-on-surface-variant">Created</th>
              <th className="px-6 py-4 text-xs font-label-caps uppercase text-on-surface-variant text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined animate-spin text-[24px]">progress_activity</span>
                </td>
              </tr>
            ) : admins.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-on-surface-variant">No business admins found.</td>
              </tr>
            ) : (
              admins.map(admin => (
                <tr key={admin.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-on-surface">{admin.name}</div>
                    <div className="text-xs text-on-surface-variant">{admin.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-on-surface">{admin.company}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="text-xs font-code-base bg-surface-container px-2 py-1 rounded text-on-surface">{admin.tenantId}</div>
                      <button onClick={() => copyToClipboard(admin.tenantId)} className="text-on-surface-variant hover:text-primary transition-colors" title="Copy Tenant ID">
                        <span className="material-symbols-outlined text-[16px]">content_copy</span>
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${admin.isActive ? 'bg-primary-container text-on-primary-container' : 'bg-error-container text-error'}`}>
                      {admin.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant">
                    {new Date(admin.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleToggleStatus(admin.id, admin.isActive)} className="text-primary hover:text-primary/80 font-medium text-sm">
                      {admin.isActive ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-inverse-surface text-inverse-on-surface px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300 z-50">
          <span className="material-symbols-outlined text-[20px] text-primary">check_circle</span>
          <span className="font-body-sm font-medium">{toast}</span>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-outline-variant/30">
            <div className="p-6 border-b border-outline-variant/20">
              <h2 className="text-headline-sm font-bold text-on-surface">Provision New Tenant</h2>
              <p className="text-sm text-on-surface-variant mt-1">Create a Business Admin account. They will receive access to their isolated portal.</p>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {error && <div className="p-3 bg-error-container text-error rounded-lg text-sm">{error}</div>}
              
              <div>
                <label className="block text-xs font-label-caps uppercase text-on-surface-variant mb-1.5">Company Name</label>
                <input required type="text" className="w-full px-4 py-2 bg-surface-container-low text-on-surface rounded-lg border border-outline-variant/50 focus:border-primary focus:outline-none" value={form.company} onChange={e => setForm({...form, company: e.target.value})} placeholder="Acme Corp" />
              </div>
              
              <div>
                <label className="block text-xs font-label-caps uppercase text-on-surface-variant mb-1.5">Admin Full Name</label>
                <input required type="text" className="w-full px-4 py-2 bg-surface-container-low text-on-surface rounded-lg border border-outline-variant/50 focus:border-primary focus:outline-none" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Jane Doe" />
              </div>
              
              <div>
                <label className="block text-xs font-label-caps uppercase text-on-surface-variant mb-1.5">Admin Email</label>
                <input required type="email" className="w-full px-4 py-2 bg-surface-container-low text-on-surface rounded-lg border border-outline-variant/50 focus:border-primary focus:outline-none" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="jane@acmecorp.com" />
              </div>
              
              <div>
                <label className="block text-xs font-label-caps uppercase text-on-surface-variant mb-1.5">Temporary Password</label>
                <input required type="text" className="w-full px-4 py-2 bg-surface-container-low text-on-surface rounded-lg border border-outline-variant/50 focus:border-primary focus:outline-none" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Secure password" />
              </div>
              
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-outline-variant/20 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-on-surface-variant hover:text-on-surface font-medium">Cancel</button>
                <button disabled={submitting} type="submit" className="px-6 py-2 bg-primary text-on-primary rounded-lg font-semibold hover:opacity-90 disabled:opacity-50">
                  {submitting ? 'Provisioning...' : 'Provision Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}