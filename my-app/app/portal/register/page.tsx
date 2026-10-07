'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function UserRegister() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/auth/user-register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, tenantId }),
    });

    if (res.ok) {
      setSuccess(true);
      setTimeout(() => {
        router.push('/portal/login');
      }, 3000);
    } else {
      const data = await res.json();
      setError(data.error || 'Registration failed');
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-surface w-full">
      <div className="w-full max-w-md p-8 bg-surface-container-low rounded-xl shadow-lg border border-outline-variant/20">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary text-on-primary flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-[24px]">app_registration</span>
          </div>
        </div>
        <h1 className="text-headline-md font-bold text-on-surface text-center">Create Portal Account</h1>
        <p className="text-center text-on-surface-variant font-body-sm mt-2 mb-6">Register to access your organization's AI agent</p>
        
        {error && <div className="mb-4 p-3 bg-error-container text-error rounded-lg text-sm text-center">{error}</div>}
        {success && (
          <div className="mb-4 p-3 bg-primary/10 text-primary rounded-lg text-sm text-center font-medium border border-primary/20">
            Registration successful! Your account is pending admin verification. Redirecting...
          </div>
        )}
        
        {!success && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1">Full Name</label>
              <input
                type="text"
                className="w-full px-4 py-2 bg-surface rounded-lg border border-outline-variant focus:outline-none focus:border-primary text-on-surface"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1">Email</label>
              <input
                type="email"
                className="w-full px-4 py-2 bg-surface rounded-lg border border-outline-variant focus:outline-none focus:border-primary text-on-surface"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1">Organization Tenant ID</label>
              <input
                type="text"
                className="w-full px-4 py-2 bg-surface rounded-lg border border-outline-variant focus:outline-none focus:border-primary text-on-surface"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                required
                placeholder="tnt_..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-1">Password</label>
              <input
                type="password"
                className="w-full px-4 py-2 bg-surface rounded-lg border border-outline-variant focus:outline-none focus:border-primary text-on-surface"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-primary text-on-primary rounded-lg font-semibold hover:opacity-90 transition-opacity mt-2"
            >
              Request Access
            </button>
          </form>
        )}
        <div className="mt-6 text-center text-sm text-on-surface-variant">
          Already have an account? <Link href="/portal/login" className="text-primary hover:underline font-medium">Log in</Link>
        </div>
      </div>
    </div>
  );
}