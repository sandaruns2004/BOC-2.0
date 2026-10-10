// Shared by the settings form and server-side company database readers.
import type { FirebaseOptions } from 'firebase/app';

export interface CompanyDatabaseConfig {
  allowedCollections: string;
  ordersCollection: string;
  dataSchemaDescription: string;
  firebaseConfig: FirebaseOptions | null;
}

export function validateDatabaseConfig(value: unknown): CompanyDatabaseConfig {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Database configuration is required.');
  const input = value as Record<string, unknown>;
  const allowedCollections = parseAllowedCollections(input.allowedCollections).join(', ');
  const ordersCollection = orderCollection(input);
  if (typeof input.dataSchemaDescription !== 'string' || input.dataSchemaDescription.length > 5000) throw new Error('Collection notes must be no longer than 5,000 characters.');
  let firebaseConfig: FirebaseOptions | null = null;
  if (input.firebaseConfig !== null) {
    if (!input.firebaseConfig || typeof input.firebaseConfig !== 'object' || Array.isArray(input.firebaseConfig)) throw new Error('Firebase config must include a projectId and apiKey, or be empty to use the platform database.');
    const source = input.firebaseConfig as Record<string, unknown>;
    const fields = ['apiKey', 'projectId', 'authDomain', 'databaseURL', 'storageBucket', 'messagingSenderId', 'appId', 'measurementId'];
    const normalized: Record<string, string> = {};
    for (const field of fields) {
      if (source[field] === undefined) continue;
      if (typeof source[field] !== 'string') throw new Error(`Firebase ${field} must be text.`);
      normalized[field] = source[field].trim();
    }
    if (!normalized.projectId || !normalized.apiKey) throw new Error('Firebase config must include a projectId and apiKey, or be empty to use the platform database.');
    firebaseConfig = normalized;
  }
  return { allowedCollections, ordersCollection, dataSchemaDescription: input.dataSchemaDescription.trim(), firebaseConfig };
}

export function assertCustomerSyncConnection(config: { allowedCollections?: unknown; firebaseConfig?: FirebaseOptions | null } | undefined, sync: { enabled: boolean; collection: string; tenantField: string } | undefined, platformProjectId: string | undefined) {
  if (!sync?.enabled) return;
  assertCollectionAllowed(config, sync.collection);
  if (!config?.firebaseConfig?.projectId || !config.firebaseConfig.apiKey) throw new Error('Save the company Firebase connection first, or disable customer sync before removing it.');
  if (config.firebaseConfig.projectId === platformProjectId && sync.collection === 'users') throw new Error('Choose a separate client customer collection. AgentForge users cannot be their own sync source.');
  if (config.firebaseConfig.projectId === platformProjectId && !sync.tenantField) throw new Error('A company filter is required for the platform Firebase project.');
}

export function parseAllowedCollections(value: unknown): string[] {
  const entries = typeof value === 'string' ? value.split(/[,\n]/) : Array.isArray(value) ? value : null;
  if (!entries || entries.some(entry => typeof entry !== 'string')) throw new Error('Enter collection names separated by commas or new lines.');
  const names = [...new Set((entries as string[]).map(name => name.trim()).filter(Boolean))];
  if (names.length > 50 || names.some(name => !/^[a-zA-Z0-9_-]{1,100}$/.test(name))) {
    throw new Error('Use up to 50 top-level collection names with letters, numbers, underscores or hyphens. Wildcards and paths are not allowed.');
  }
  return names;
}

export function orderCollection(config: { ordersCollection?: unknown } | undefined): string {
  const name = config?.ordersCollection ?? 'demo_orders';
  if (typeof name !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(name)) throw new Error('Enter a valid order collection name.');
  return name;
}

export function assertCollectionAllowed(config: { allowedCollections?: unknown } | undefined, name: string) {
  // Preserve the original order integration for tenants that have never configured access.
  const allowed = config?.allowedCollections === undefined ? ['demo_orders'] : parseAllowedCollections(config.allowedCollections);
  if (!allowed.includes(name)) throw new Error(`Collection "${name}" is not allowed. Update the company Firebase collection access settings.`);
}
