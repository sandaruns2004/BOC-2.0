import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'AgentForge',
  description: 'A safer control plane for enterprise AI agents.',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

const links = [
  { href: '/studio', label: 'Studio' },
  { href: '/demo', label: 'Run agent' },
  { href: '/escalation', label: 'Review queue' },
  { href: '/replay', label: 'Traces' },
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <nav className="site-nav" aria-label="Main navigation">
            <Link className="brand" href="/" aria-label="AgentForge home">
              <span className="brand-mark" aria-hidden="true"><img src="/images/agentforge-logo-shield.png" alt="" /></span>
              <span>AgentForge</span>
            </Link>
            <div className="nav-links">
              {links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
            </div>
            <Link className="button button-small" href="/demo">Open console</Link>
          </nav>
        </header>
        {children}
        <footer className="site-footer">
          <span>AgentForge ┬╖ BOC 2.0 Scenario 5</span>
          <span>Guardrails, approvals, and decision traces.</span>
        </footer>
      </body>
    </html>
  );
}
