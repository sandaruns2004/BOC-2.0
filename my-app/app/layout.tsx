import type { Metadata, Viewport } from "next";
import "./globals.css";
import NavHeader from "./components/NavHeader";

export const metadata: Metadata = {
  title: "AgentForge Platform",
  description: "Autonomous Enterprise Operations Control Plane",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com" rel="preconnect" />
        <link crossOrigin="anonymous" href="https://fonts.gstatic.com" rel="preconnect" />
        <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col bg-surface font-body-md text-body-md text-on-surface m-0 p-0 overflow-x-hidden" suppressHydrationWarning>
        <NavHeader />
        {children}
        <footer className="w-full bg-surface-container-lowest border-t border-outline-variant/30 py-space-xl">
          <div className="max-w-7xl mx-auto px-margin-sm md:px-margin flex flex-col gap-space-lg">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-space-md">
              <div className="flex items-center gap-space-sm">
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-on-primary">
                  <span className="material-symbols-outlined text-[14px]">hub</span>
                </div>
                <a href="/" className="font-headline-sm text-headline-sm text-on-surface font-semibold hover:text-primary transition-colors">AgentForge</a>
                <span className="font-code-base text-code-base text-on-surface-variant ml-space-xs">v2.4.0-rc</span>
              </div>
              <div className="flex items-center gap-space-sm font-code-base text-code-base text-on-surface-variant bg-surface-container-low px-space-sm py-1 rounded-md border border-outline-variant/20">
                <span className="w-2 h-2 rounded-full bg-tertiary animate-ping"></span>
                <span>GCP Cloud Run Services: Operational</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-space-md border-t border-outline-variant/20 pt-space-lg">
              <div className="flex flex-wrap items-center gap-space-md font-body-sm text-body-sm text-on-surface-variant">
                <a className="hover:text-on-surface transition-colors" href="/docs">Platform Specs</a>
                <a className="hover:text-on-surface transition-colors" href="/architecture">Autonomic Topology</a>
                <a className="hover:text-on-surface transition-colors" href="/docs#telemetry">Telemetry API</a>
                <a className="hover:text-on-surface transition-colors" href="/security">Compliance &amp; Privacy</a>
                <a className="hover:text-on-surface transition-colors" href="/replay">Execution Replay</a>
                <a className="hover:text-on-surface transition-colors" href="/escalation">Escalation Queue</a>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Crafted for BOC 2.0 Challenge — Autonomous Agent Infrastructure.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
