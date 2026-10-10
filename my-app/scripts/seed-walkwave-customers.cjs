// Seed the connected Walkwave CLIENT database. AgentForge imports these profiles.
require('@next/env').loadEnvConfig(process.cwd());
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDocFromServer, runTransaction } = require('firebase/firestore');
const platform = getFirestore(initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}, 'walkwave-customer-seed'));
const names = ['Nimal Perera', 'Dilini Fernando', 'Kasun Silva', 'Tharushi Jayasinghe', 'Amal Wijesinghe', 'Sachini Bandara', 'Ruwan Dissanayake', 'Ishara Gunawardena', 'Dinesh Kumara', 'Anjali Senanayake'];
async function run() {
  const config = (await getDocFromServer(doc(platform, 'tenant_settings', 'tnt_sample01'))).data()?.databaseConfig?.firebaseConfig;
  if (!config?.projectId || config.projectId === process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) throw new Error('Walkwave needs a separate connected client Firebase project.');
  const db = getFirestore(initializeApp(config, 'walkwave-client-customers'));
  let added = 0;
  for (const [index, name] of names.entries()) {
    const id = `walkwave_mock_${String(index + 1).padStart(2, '0')}`;
    const data = {
      tenantId: 'tnt_sample01', name,
      email: `${name.toLowerCase().replaceAll(' ', '.')}@walkwave.example`,
      role: 'user', isActive: true, isDemo: true,
      createdAt: new Date().toISOString(), lastLogin: null,
    };
    const created = await runTransaction(db, async transaction => {
      const ref = doc(db, 'users', id);
      if ((await transaction.get(ref)).exists()) return false;
      transaction.set(ref, data); return true;
    });
    if (created) added++;
    console.log(`${created ? 'Added' : 'Already exists'}: ${name} (${id})`);
  }
  console.log(`${added} added to the CLIENT database; 10 mock Walkwave customers are available for syncing. Existing source records unchanged. No passwords stored.`);
}
run().then(() => process.exit(0)).catch(error => { console.error(error.message); process.exit(1); });
