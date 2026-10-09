export const demoCompanies = {
  walkwave: { name: 'Walkwave', tenantId: 'tnt_sample01', path: '/walkwave', refundLimit: 50000, customers: [{ id: 'walkwave_jane', name: 'Jane', email: 'jane@walkwave.example' }, { id: 'walkwave_bob', name: 'Bob', email: 'bob@walkwave.example' }] },
  nova: { name: 'Nova Electronics', tenantId: 'tnt_nova_demo', path: '/nova', refundLimit: 50000, customers: [{ id: 'nova_alice', name: 'Alice', email: 'alice@nova.example' }, { id: 'nova_sam', name: 'Sam', email: 'sam@nova.example' }] },
} as const;
export type DemoCompany = keyof typeof demoCompanies;
// These fictional storefronts are public hackathon demos. Their login endpoint
// only accepts the specifically seeded demo customers, never regular accounts.
export function demoEnabled() { return true; }
export function companyForTenant(tenantId: string) { return Object.values(demoCompanies).find(c => c.tenantId === tenantId); }
