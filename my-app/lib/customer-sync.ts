import { createHash, randomUUID } from 'node:crypto';
import { collection, doc, getDocFromServer, getDocsFromServer, limit, query, runTransaction, where, writeBatch, type DocumentData } from 'firebase/firestore';
import { db } from './firebase';
import { externalCompanyDatabase } from './company-database';
import { assertCollectionAllowed } from './database-access';

export interface CustomerSyncConfig {
  enabled: boolean;
  collection: string;
  tenantField: string;
  tenantValue: string;
}
export const defaultCustomerSync: CustomerSyncConfig = { enabled: false, collection: 'users', tenantField: '', tenantValue: '' };
export function validateCustomerSync(value: unknown): CustomerSyncConfig {
  if (!value || typeof value !== 'object') throw new Error('Invalid customer sync settings.');
  const input = value as Record<string, unknown>;
  if (typeof input.enabled !== 'boolean' || typeof input.collection !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(input.collection)) throw new Error('Enter a collection name such as users or customers.');
  const tenantField = typeof input.tenantField === 'string' ? input.tenantField.trim() : '';
  const tenantValue = typeof input.tenantValue === 'string' ? input.tenantValue.trim() : '';
  if (tenantField && !/^[a-zA-Z0-9_]{1,100}$/.test(tenantField)) throw new Error('Enter a valid company filter field.');
  if (Boolean(tenantField) !== Boolean(tenantValue) || tenantValue.length > 200) throw new Error('Provide both the company filter field and value, or leave both empty for a dedicated company collection.');
  return { enabled: input.enabled, collection: input.collection, tenantField, tenantValue };
}
export async function customerSyncSettings(tenantId: string) {
  const settings = (await getDocFromServer(doc(db, 'tenant_settings', tenantId))).data();
  const config = settings?.customerSync ? validateCustomerSync(settings.customerSync) : defaultCustomerSync;
  return { settings, config };
}
function timestamp(value: unknown): string | undefined {
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') return timestamp(value.toDate());
  const date = value instanceof Date ? value : typeof value === 'string' || typeof value === 'number' ? new Date(value) : undefined;
  return date && Number.isFinite(date.getTime()) ? date.toISOString() : undefined;
}
function shortText(value: unknown, maximum: number) { return typeof value === 'string' ? value.trim().slice(0, maximum) : ''; }

export async function syncCompanyCustomers(tenantId: string, force = false) {
  const { settings, config } = await customerSyncSettings(tenantId);
  const stateRef = doc(db, 'customer_sync_state', tenantId);
  if (!config.enabled) return { enabled: false, status: 'disabled' };
  assertCollectionAllowed(settings?.databaseConfig, config.collection);
  const firebase = settings?.databaseConfig?.firebaseConfig;
  if (!firebase?.projectId || !firebase?.apiKey) throw new Error('Save the company Firebase connection before enabling customer sync.');
  if (firebase.projectId === process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && config.collection === 'users') throw new Error('Choose a separate client customer collection. AgentForge users cannot be their own sync source.');
  if (firebase.projectId === process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && !config.tenantField) throw new Error('A company filter is required when importing from the platform Firebase project.');
  const owner = randomUUID(), now = Date.now();
  const acquired = await runTransaction(db, async transaction => {
    const previous = (await transaction.get(stateRef)).data();
    if (Number(previous?.lockUntil || 0) > now) return false;
    if (!force && previous?.status === 'ready' && now - Number(previous.completedAt || 0) < 30000) return false;
    transaction.set(stateRef, { status: 'syncing', owner, lockUntil: now + 120000, lastAttemptAt: new Date(now).toISOString() }, { merge: true });
    return true;
  });
  if (!acquired) return { ...(await getDocFromServer(stateRef)).data(), enabled: true, owner: undefined, lockUntil: undefined };
  try {
    const external = externalCompanyDatabase(tenantId, firebase);
    const constraints = config.tenantField ? [where(config.tenantField, '==', config.tenantValue), limit(501)] : [limit(501)];
    const incoming = await getDocsFromServer(query(collection(external, config.collection), ...constraints));
    if (incoming.size > 500) throw new Error('This demo supports up to 500 customers per sync. Use a smaller customer collection or company filter.');
    const existing = await getDocsFromServer(query(collection(db, 'users'), where('tenantId', '==', tenantId)));
    const byId = new Map(existing.docs.map(row => [row.id, row.data()]));
    const sourceKey = createHash('sha256').update(JSON.stringify([tenantId, firebase.projectId, config.collection, config.tenantField, config.tenantValue])).digest('hex');
    const imported = new Map(existing.docs.filter(row => row.data().customerSourceKey === sourceKey).map(row => [row.data().externalCustomerId as string, row.id]));
    const present = new Set<string>();
    const writes: { id: string; data: DocumentData }[] = [];
    let created = 0, updated = 0, unchanged = 0, skipped = 0, disabled = 0;
    const syncedAt = new Date().toISOString();
    for (const row of incoming.docs) {
      const raw = row.data();
      if (!/^[a-zA-Z0-9_-]{1,100}$/.test(row.id)) { skipped++; continue; }
      // Never import another tenant's record from a shared collection.
      if (!config.tenantField && raw.tenantId !== undefined && raw.tenantId !== tenantId) { skipped++; continue; }
      const name = shortText(raw.name || raw.fullName || raw.displayName, 150);
      const email = shortText(raw.email, 254);
      if (!name || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) { skipped++; continue; }
      present.add(row.id);
      // Adopt prepared demo accounts only when the exact ID belongs to this tenant.
      const demoMatch = byId.get(row.id);
      const adoptDemo = raw.isDemo === true && demoMatch?.isDemo === true && !demoMatch.customerSourceKey;
      const id = imported.get(row.id) || (adoptDemo ? row.id : 'client_' + createHash('sha256').update(sourceKey + ':' + row.id).digest('hex').slice(0, 40));
      const previous = byId.get(id);
      const externalActive = typeof raw.isActive === 'boolean' ? raw.isActive : !['disabled', 'inactive', 'deleted', 'suspended'].includes(shortText(raw.status, 30).toLowerCase());
      const accessDisabled = previous?.accessDisabled === true || (adoptDemo && previous?.isActive === false);
      const data = {
        tenantId, name, email, role: 'user', source: 'Company database',
        externalCustomerId: row.id, externalProjectId: firebase.projectId, externalCollection: config.collection,
        customerSourceKey: sourceKey, externalActive, accessDisabled,
        isActive: externalActive && !accessDisabled,
        isDemo: raw.isDemo === true,
        createdAt: timestamp(raw.createdAt) || previous?.createdAt || syncedAt,
      };
      if (previous && Object.entries(data).every(([key, value]) => previous[key] === value)) { unchanged++; continue; }
      writes.push({ id, data: { ...data, lastSyncedAt: syncedAt } });
      if (previous) updated++; else created++;
    }
    // Missing source customers lose access, but their history is preserved.
    for (const row of existing.docs) {
      const old = row.data();
      if (old.source === 'Company database' && old.customerSourceKey && (old.customerSourceKey !== sourceKey || !present.has(old.externalCustomerId)) && (old.externalActive !== false || old.isActive === true)) {
        writes.push({ id: row.id, data: { externalActive: false, isActive: false, lastSyncedAt: syncedAt } }); disabled++;
      }
    }
    for (let offset = 0; offset < writes.length; offset += 450) {
      const batch = writeBatch(db);
      for (const write of writes.slice(offset, offset + 450)) batch.set(doc(db, 'users', write.id), write.data, { merge: true });
      await batch.commit();
    }
    const result = { enabled: true, status: 'ready', lastSyncedAt: syncedAt, importedCount: present.size, created, updated, unchanged, skipped, disabled, error: '' };
    await runTransaction(db, async transaction => {
      if ((await transaction.get(stateRef)).data()?.owner === owner) transaction.set(stateRef, { ...result, completedAt: Date.now(), lockUntil: 0, owner: '' }, { merge: true });
    });
    return result;
  } catch (error) {
    console.error('Customer sync failed:', error);
    await runTransaction(db, async transaction => {
      if ((await transaction.get(stateRef)).data()?.owner === owner) transaction.set(stateRef, { status: 'error', error: 'Customer sync failed. Check the company Firebase access, collection, and filter settings.', lockUntil: 0, owner: '' }, { merge: true });
    });
    throw error;
  }
}
