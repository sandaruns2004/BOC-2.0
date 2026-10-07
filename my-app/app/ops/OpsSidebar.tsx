'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

const OPS_NAV = [
  {
    group: 'Platform Ops',
    items: [
      { label: 'Platform Dashboard', href: '/ops/dashboard', icon: 'dashboard', desc: 'Global platform metrics' },
      { label: 'Manage Admins',      href: '/ops/admins',    icon: 'manage_accounts', desc: 'Create & manage tenants' },
      { label: 'Platform Reports',   href: '/ops/reports',   icon: 'analytics', desc: 'Usage & billing' },
      { label: 'System Health',      href: '/ops/system',    icon: 'monitor_heart', desc: 'Infrastructure status' },
    ],
  },
];

export default function OpsSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/ops/login');
  }

  if (pathname === '/ops/login') {
    return null;
  }

  return (
    <aside
      className={`relative flex flex-col bg-surface-container-lowest border-r border-outline-variant/30 transition-all duration-300 ease-in-out shrink-0 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
      style={{ minHeight: '100vh' }}
    >
      {/* Logo */}
      <div className={`flex items-center border-b border-outline-variant/20 h-16 shrink-0 ${collapsed ? 'justify-center px-0' : 'justify-between px-4'}`}>
        {!collapsed && (
          <div className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-on-primary shadow-sm">
              <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
            </div>
            <span className="font-headline-sm text-[14px] font-bold text-on-surface tracking-tight">
              Platform Ops
            </span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">
            {collapsed ? 'chevron_right' : 'chevron_left'}
          </span>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-4">
        {OPS_NAV.map((group) => (
          <div key={group.group}>
            {!collapsed && (
              <p className="px-2 mb-2 font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold">
                {group.group}
              </p>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group ${
                        active
                          ? 'bg-primary/10 text-primary'
                          : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                      } ${collapsed ? 'justify-center' : ''}`}
                    >
                      <span className={`material-symbols-outlined text-[20px] shrink-0 transition-colors ${active ? 'text-primary' : 'text-on-surface-variant group-hover:text-on-surface'}`}>
                        {item.icon}
                      </span>
                      {!collapsed && (
                        <div className="min-w-0">
                          <span className={`block font-label-ui text-[13px] font-medium leading-tight ${active ? 'text-primary font-semibold' : ''}`}>
                            {item.label}
                          </span>
                          <span className="block font-body-sm text-[11px] text-on-surface-variant/70 truncate leading-tight mt-0.5">
                            {item.desc}
                          </span>
                        </div>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer / Sign Out */}
      <div className={`border-t border-outline-variant/20 p-4 shrink-0 ${collapsed ? 'flex justify-center' : ''}`}>
        {collapsed ? (
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-error hover:bg-error-container/40 transition-all"
          >
            <span className="material-symbols-outlined">logout</span>
          </button>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-[18px]">engineering</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-label-ui text-[12px] font-semibold text-on-surface truncate">Platform Admin</p>
                <p className="font-body-sm text-[10px] text-on-surface-variant truncate">ops@agentforge.ai</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error-container/40 transition-all shrink-0"
            >
              {signingOut ? (
                <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-[16px]">logout</span>
              )}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
