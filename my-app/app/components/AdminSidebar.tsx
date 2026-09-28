'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from './AuthProvider';

const ADMIN_NAV = [
  {
    group: 'Operations',
    items: [
      { label: 'Fleet Dashboard',    href: '/launch',     icon: 'rocket_launch',      desc: 'Workloads & fleet metrics'  },
      { label: 'Escalation Queue',   href: '/escalation', icon: 'warning',            desc: 'Human review queue'         },
      { label: 'Incident Console',   href: '/incident',   icon: 'emergency',          desc: 'Active incidents & SLA'     },
    ],
  },
  {
    group: 'Configuration',
    items: [
      { label: 'Agent Studio',       href: '/studio',     icon: 'tune',               desc: 'System prompts & models'    },
    ],
  },
  {
    group: 'Observability',
    items: [
      { label: 'Execution Replay',   href: '/replay',     icon: 'replay',             desc: 'Trace audit & drift check'  },
    ],
  },
  {
    group: 'Public Site',
    items: [
      { label: 'Architecture',       href: '/architecture', icon: 'account_tree',     desc: '5-Layer engine diagram'     },
      { label: 'Live Demo',          href: '/demo',         icon: 'chat',             desc: 'Try the agent'              },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOutUser } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await signOutUser();
    router.replace('/login');
  }

  return (
    <aside
      className={`relative flex flex-col bg-surface-container-lowest border-r border-outline-variant/30 transition-all duration-300 ease-in-out shrink-0 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
      style={{ minHeight: '100vh' }}
    >
      {/* Logo + collapse toggle */}
      <div className={`flex items-center border-b border-outline-variant/20 h-14 shrink-0 ${collapsed ? 'justify-center px-0' : 'justify-between px-4'}`}>
        {!collapsed && (
          <Link href="/launch" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-on-primary shadow-sm group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[15px]">hub</span>
            </div>
            <span className="font-headline-sm text-[13px] font-semibold text-on-surface tracking-tight">
              AgentForge
            </span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label="Toggle sidebar"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">
            {collapsed ? 'chevron_right' : 'chevron_left'}
          </span>
        </button>
      </div>

      {/* Admin badge */}
      {!collapsed && (
        <div className="mx-3 mt-3 mb-1 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/8 border border-primary/15">
          <span className="material-symbols-outlined text-primary text-[13px]">admin_panel_settings</span>
          <span className="font-label-caps text-[9px] text-primary uppercase tracking-wider font-semibold">Operator Portal</span>
        </div>
      )}

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-4">
        {ADMIN_NAV.map((group) => (
          <div key={group.group}>
            {!collapsed && (
              <p className="px-2 mb-1 font-label-caps text-[9px] text-on-surface-variant/60 uppercase tracking-widest">
                {group.group}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? `${item.label} — ${item.desc}` : undefined}
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all duration-150 group ${
                        active
                          ? 'bg-primary/12 text-primary shadow-sm'
                          : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                      } ${collapsed ? 'justify-center' : ''}`}
                    >
                      <span className={`material-symbols-outlined text-[18px] shrink-0 transition-colors ${active ? 'text-primary' : 'text-on-surface-variant group-hover:text-on-surface'}`}>
                        {item.icon}
                      </span>
                      {!collapsed && (
                        <div className="min-w-0">
                          <span className={`block font-label-ui text-[12px] font-medium leading-tight ${active ? 'text-primary font-semibold' : ''}`}>
                            {item.label}
                          </span>
                          <span className="block font-body-sm text-[10px] text-on-surface-variant/60 truncate leading-tight mt-0.5">
                            {item.desc}
                          </span>
                        </div>
                      )}
                      {active && !collapsed && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User profile + sign out */}
      <div className={`border-t border-outline-variant/20 p-3 shrink-0 ${collapsed ? 'flex justify-center' : ''}`}>
        {collapsed ? (
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            title="Sign out"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-on-surface-variant hover:bg-error-container/40 hover:text-error transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        ) : (
          <div className="flex items-center gap-2.5">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName ?? 'Admin'}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20 shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-[16px]">person</span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-label-ui text-[11px] font-semibold text-on-surface truncate">
                {user?.displayName ?? 'Admin User'}
              </p>
              <p className="font-body-sm text-[9px] text-on-surface-variant truncate">
                {user?.email ?? ''}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              title="Sign out"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-error-container/40 hover:text-error transition-all shrink-0"
            >
              {signingOut
                ? <span className="material-symbols-outlined animate-spin text-[14px]">progress_activity</span>
                : <span className="material-symbols-outlined text-[14px]">logout</span>
              }
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
