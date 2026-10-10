import { createHash } from 'node:crypto';
import { getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import { doc, getDocFromServer, getFirestore } from 'firebase/firestore';
import { db } from './firebase';

export function externalCompanyDatabase(tenantId: string, config: FirebaseOptions) {
  if (!config.projectId || !config.apiKey) throw new Error('Save a valid company Firebase connection first.');
  const fingerprint = createHash('sha256').update(JSON.stringify(config)).digest('hex').slice(0, 16);
  const name = `tenant-${tenantId}-${fingerprint}`;
  return getFirestore(getApps().find(app => app.name === name) || initializeApp(config, name));
}

export async function companyDatabase(tenantId: string) {
  return (await companyDatabaseConnection(tenantId)).database;
}

export async function companyDatabaseConnection(tenantId: string) {
  const config = (await getDocFromServer(doc(db, 'tenant_settings', tenantId))).data()?.databaseConfig;
  return { database: config?.firebaseConfig ? externalCompanyDatabase(tenantId, config.firebaseConfig) : db, config };
}
