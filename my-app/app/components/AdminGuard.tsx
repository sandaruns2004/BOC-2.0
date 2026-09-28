'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined animate-spin text-primary text-[36px]">progress_activity</span>
          <p className="font-body-sm text-body-sm text-on-surface-variant">Verifying credentials…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Will redirect — render nothing while navigating
    return null;
  }

  return <>{children}</>;
}
