'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [customerCollection, setCustomerCollection] = useState('');
  const [connectedUsers, setConnectedUsers] = useState<User[]>([]);
  const [connectionError, setConnectionError] = useState('');
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setConnectedUsers(data.connectedUsers || []);
        setCustomerCollection(data.customerCollection || '');
        setConnectionError(data.connectionError || '');
      } else {
        setConnectionError((await res.json()).error || 'Unable to load users.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function connectDirectory(e: React.FormEvent) {
    e.preventDefault(); setConnecting(true); setConnectionError('');
    try { const res = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'connectDirectory', collectionName: customerCollection.trim() }) }); const data = await res.json(); if (!res.ok) throw new Error(data.error); await fetchUsers(); }
    catch (e) { setConnectionError(e instanceof Error ? e.message : 'Unable to connect customer directory.'); }
    finally { setConnecting(false); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      
      if (res.ok) {
        const data = await res.json();
        setUsers([data.user, ...users]);
        setShowModal(false);
        setForm({ name: '', email: '', password: '' });
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create user');
      }
    } catch (e) {
      setError('An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleUserStatus(userId: string, currentStatus: boolean) {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isActive: !currentStatus })
      });
      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, isActive: !currentStatus } : u));
      }
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="p-8 text-on-surface">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-headline-lg font-bold text-on-surface">Users & Access</h1>
          <p className="text-on-surface-variant font-body-md mt-1">Manage customer identities used by your website assistant and enterprise API.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-primary text-on-primary rounded-lg font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-[20px]">person_add</span>
          Add User
        </button>
      </div>

      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-6 mb-6">
        <h2 className="font-semibold text-title-md">Company customer database</h2><p className="text-sm text-on-surface-variant mt-2">Read customer profiles from the Firebase project connected in Agent Settings. Enter its customer or login-profile collection below. Every record must contain your company’s tenantId, plus name and email. Passwords and authentication tokens are never imported.</p>
        <form className="flex flex-wrap gap-3 items-end mt-4" onSubmit={connectDirectory}><div><label className="block text-sm mb-1" htmlFor="customer-collection">Customer collection</label><input id="customer-collection" className="border rounded-lg p-2 bg-surface" placeholder="customers" value={customerCollection} onChange={e => setCustomerCollection(e.target.value)} required pattern="[a-zA-Z0-9_-]{1,80}" /></div><button disabled={connecting} className="px-4 py-2 bg-primary text-on-primary rounded-lg">{connecting ? 'Reading…' : 'Connect & refresh'}</button><a className="text-primary underline text-sm" href="/admin/settings">Database settings</a></form>
        {connectionError && <p role="alert" className="text-error mt-3">{connectionError}</p>}
        <p className="text-xs text-on-surface-variant mt-3">This is a read-only directory, up to 100 profiles per refresh. Your company login remains the source of authentication; this demo does not add single sign-on. Customer IDs supplied to the enterprise API must also match an AgentForge identity below.</p>
        {connectedUsers.length > 0 ? <div className="overflow-x-auto mt-4"><table className="w-full text-sm text-left"><thead><tr><th className="p-2">Customer</th><th className="p-2">Email</th><th className="p-2">Company customer ID</th><th className="p-2">Status</th></tr></thead><tbody>{connectedUsers.map(customer => <tr key={customer.id} className="border-t"><td className="p-2">{customer.name}</td><td className="p-2">{customer.email}</td><td className="p-2">{customer.id}</td><td className="p-2">{customer.isActive ? 'Active' : 'Disabled'}</td></tr>)}</tbody></table></div> : customerCollection && !connectionError ? <p className="text-sm mt-3">No customer profiles loaded. Click Connect & refresh and check that records contain the matching tenantId.</p> : null}
      </section>
      <h2 className="font-semibold mb-3">AgentForge customer identities</h2>
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-surface-container-low border-b border-outline-variant/20">
            <tr>
              <th className="px-6 py-4 text-xs font-label-caps uppercase text-on-surface-variant">Name</th>
              <th className="px-6 py-4 text-xs font-label-caps uppercase text-on-surface-variant">Email</th>
              <th className="px-6 py-4 text-xs font-label-caps uppercase text-on-surface-variant">User ID</th>
              <th className="px-6 py-4 text-xs font-label-caps uppercase text-on-surface-variant">Status</th>
              <th className="px-6 py-4 text-xs font-label-caps uppercase text-on-surface-variant">Created</th>
              <th className="px-6 py-4 text-xs font-label-caps uppercase text-on-surface-variant text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined animate-spin text-[24px]">progress_activity</span>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-on-surface-variant">No end users found in your tenant.</td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-on-surface">{user.name}</td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant">{user.email}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <code className="bg-primary/10 text-primary text-[12px] px-2 py-1 rounded font-code-base">{user.id.substring(0, 12)}...</code>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(user.id);
                          setToast('User ID copied: ' + user.id);
                          setTimeout(() => setToast(''), 3000);
                        }}
                        className="text-on-surface-variant hover:text-primary transition-colors"
                        title="Copy full User ID"
                      >
                        <span className="material-symbols-outlined text-[16px]">content_copy</span>
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${user.isActive ? 'bg-primary-container text-on-primary-container' : 'bg-error-container text-error'}`}>
                      {user.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => toggleUserStatus(user.id, user.isActive)}
                      className={`${user.isActive ? 'text-error hover:text-error/80' : 'text-primary hover:text-primary/80'} font-medium text-sm`}
                    >
                      {user.isActive ? 'Disable' : 'Enable'}
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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-outline-variant/30">
            <div className="p-6 border-b border-outline-variant/20">
              <h2 className="text-headline-sm font-bold text-on-surface">Add End User</h2>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {error && <div className="p-3 bg-error-container text-error rounded-lg text-sm">{error}</div>}
              <div>
                <label className="block text-xs font-label-caps uppercase text-on-surface-variant mb-1.5">Full Name</label>
                <input required type="text" className="w-full px-4 py-2 bg-surface-container-low text-on-surface rounded-lg border border-outline-variant/50 focus:border-primary focus:outline-none" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="John Smith" />
              </div>
              <div>
                <label className="block text-xs font-label-caps uppercase text-on-surface-variant mb-1.5">Email</label>
                <input required type="email" className="w-full px-4 py-2 bg-surface-container-low text-on-surface rounded-lg border border-outline-variant/50 focus:border-primary focus:outline-none" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="john@example.com" />
              </div>
              <div>
                <label className="block text-xs font-label-caps uppercase text-on-surface-variant mb-1.5">Temporary Password</label>
                <input required type="text" className="w-full px-4 py-2 bg-surface-container-low text-on-surface rounded-lg border border-outline-variant/50 focus:border-primary focus:outline-none" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Secure password" />
              </div>
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-outline-variant/20 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-on-surface-variant hover:text-on-surface font-medium">Cancel</button>
                <button disabled={submitting} type="submit" className="px-6 py-2 bg-primary text-on-primary rounded-lg font-semibold hover:opacity-90 disabled:opacity-50">
                  {submitting ? 'Adding...' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
