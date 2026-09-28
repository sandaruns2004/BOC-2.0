'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/components/AuthProvider';
import Link from 'next/link';

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState('');

  // Already logged in — redirect to admin home
  useEffect(() => {
    if (!loading && user) {
      router.replace('/launch');
    }
  }, [user, loading, router]);

  async function handleGoogleLogin() {
    setSigning(true);
    setError('');
    try {
      await signInWithGoogle();
      router.replace('/launch');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Sign-in failed. Please try again.';
      setError(msg);
    } finally {
      setSigning(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <span className="material-symbols-outlined animate-spin text-primary text-[32px]">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface overflow-hidden relative">

      {/* Ambient gradient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-secondary/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-tertiary/3 blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: 'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-outline-variant/20">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-on-primary shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
            <span className="material-symbols-outlined text-[18px]">hub</span>
          </div>
          <span className="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight group-hover:text-primary transition-colors">
            AgentForge
          </span>
        </Link>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container border border-outline-variant/30">
          <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
          <span className="font-label-caps text-label-caps text-on-surface-variant font-medium text-[10px] uppercase tracking-wider">
            Operator Portal
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">

          {/* Card */}
          <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-2xl overflow-hidden">

            {/* Card header strip */}
            <div className="h-1 bg-gradient-to-r from-primary via-secondary to-tertiary" />

            <div className="p-8">

              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/15 to-secondary/15 border border-primary/20 flex items-center justify-center shadow-inner">
                  <span className="material-symbols-outlined text-[32px] text-primary">admin_panel_settings</span>
                </div>
              </div>

              {/* Headline */}
              <div className="text-center mb-8">
                <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold">
                  Admin Portal
                </h1>
                <p className="mt-2 font-body-sm text-body-sm text-on-surface-variant">
                  Sign in with your company Google account to access operational tools.
                </p>
              </div>

              {/* Error banner */}
              {error && (
                <div className="mb-6 flex items-start gap-3 px-4 py-3 rounded-xl bg-error-container/60 border border-error/20">
                  <span className="material-symbols-outlined text-error text-[18px] mt-0.5 shrink-0">error</span>
                  <p className="font-body-sm text-body-sm text-on-error-container">{error}</p>
                </div>
              )}

              {/* Google Sign-In Button */}
              <button
                id="google-signin-btn"
                onClick={handleGoogleLogin}
                disabled={signing}
                className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl bg-surface-container border border-outline-variant/50 hover:bg-surface-container-low hover:border-outline-variant hover:shadow-md active:scale-[0.99] transition-all duration-150 font-label-ui text-label-ui font-semibold text-on-surface disabled:opacity-60 disabled:cursor-not-allowed group"
              >
                {signing ? (
                  <span className="material-symbols-outlined animate-spin text-primary text-[20px]">progress_activity</span>
                ) : (
                  /* Google Logo SVG */
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                <span>{signing ? 'Signing in…' : 'Continue with Google'}</span>
              </button>

              {/* Divider */}
              <div className="my-6 flex items-center gap-3">
                <div className="flex-1 h-px bg-outline-variant/30" />
                <span className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">Authorised personnel only</span>
                <div className="flex-1 h-px bg-outline-variant/30" />
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: 'lock', label: 'Zero-Trust' },
                  { icon: 'shield', label: 'MFA Ready' },
                  { icon: 'verified_user', label: 'OAuth 2.0' },
                ].map(({ icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl bg-surface-container-low border border-outline-variant/20">
                    <span className="material-symbols-outlined text-primary text-[16px]">{icon}</span>
                    <span className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-wider">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Back link */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">arrow_back</span>
              Back to marketing site
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom watermark */}
      <div className="relative z-10 text-center py-4 border-t border-outline-variant/15">
        <p className="font-body-sm text-body-sm text-on-surface-variant/50 text-[11px]">
          AgentForge Platform · BOC 2.0 Scenario 5 · Operator Access
        </p>
      </div>
    </div>
  );
}
