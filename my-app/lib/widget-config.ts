import { doc, getDocFromServer } from 'firebase/firestore';
import { db } from './firebase';
import { companyForTenant } from './demo-config';

export interface WidgetConfig { enabled: boolean; name: string; color: string; allowedOrigins: string[] }
export function validCompany(value: unknown): value is string {
  return typeof value === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(value);
}
export function siteOrigin(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Enter a website origin, such as https://shop.example.com.');
  const url = new URL(value.trim());
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:')) || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('Use an HTTPS website origin without a path. Localhost can use HTTP.');
  return url.origin;
}
export function defaultWidget(tenantId: string, name?: string): WidgetConfig {
  const company = companyForTenant(tenantId);
  return {
    enabled: !!company,
    name: name || (company ? `${company.name} Assistant` : 'Company Assistant'),
    color: tenantId === 'tnt_nova_demo' ? '#3159cc' : '#214d3b',
    allowedOrigins: company ? ['https://agentforgev2.vercel.app', 'http://localhost:3000', 'http://127.0.0.1:3000'] : [],
  };
}
export function validateWidget(value: unknown): WidgetConfig {
  if (!value || typeof value !== 'object') throw new Error('Widget settings are required.');
  const config = value as Record<string, unknown>;
  if (typeof config.enabled !== 'boolean' || typeof config.name !== 'string' || !config.name.trim() || config.name.length > 70) throw new Error('Enter an assistant name of up to 70 characters.');
  if (typeof config.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(config.color)) throw new Error('Choose a six-digit hex colour.');
  if (!Array.isArray(config.allowedOrigins) || config.allowedOrigins.length > 20) throw new Error('Add up to 20 website origins.');
  const allowedOrigins = [...new Set(config.allowedOrigins.map(siteOrigin))];
  if (config.enabled && !allowedOrigins.length) throw new Error('Add a website origin before enabling the widget.');
  return { enabled: config.enabled, name: config.name.trim(), color: config.color, allowedOrigins };
}
export async function getWidgetConfig(tenantId: string): Promise<WidgetConfig> {
  if (!validCompany(tenantId)) throw new Error('Unknown company.');
  const settings = await getDocFromServer(doc(db, 'tenant_settings', tenantId));
  const stored = settings.data()?.widgetConfig;
  const companyName = settings.data()?.companyName;
  return stored ? validateWidget(stored) : defaultWidget(tenantId, typeof companyName === 'string' ? `${companyName} Assistant` : undefined);
}
