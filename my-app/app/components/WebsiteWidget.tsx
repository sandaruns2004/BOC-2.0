'use client';
import { useEffect } from 'react';

interface WidgetApi { company: string; open: () => void; refreshIdentity: () => Promise<void>; destroy: () => void }
declare global { interface Window { AgentForgeWidget?: WidgetApi } }
export default function WebsiteWidget({ company, tokenUrl, customerId }: { company: string; tokenUrl?: string; customerId?: string }) {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '/widget.js'; script.defer = true; script.dataset.company = company;
    if (tokenUrl) script.dataset.tokenUrl = tokenUrl;
    document.body.append(script);
    return () => { script.remove(); if (window.AgentForgeWidget?.company === company) window.AgentForgeWidget.destroy(); };
  }, [company, tokenUrl]);
  useEffect(() => { if (window.AgentForgeWidget?.company === company) void window.AgentForgeWidget.refreshIdentity(); }, [company, customerId]);
  return null;
}
