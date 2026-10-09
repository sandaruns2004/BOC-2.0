// Populate only the four named fictional profiles for the admin demo.
const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDocFromServer, setDoc } = require('firebase/firestore');
async function run() {
  const platform = getFirestore(initializeApp({ apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID }));
  for (const [tenantId, ids] of [['tnt_sample01', ['walkwave_jane', 'walkwave_bob']], ['tnt_nova_demo', ['nova_alice', 'nova_sam']]]) {
    const settings = await getDocFromServer(doc(platform, 'tenant_settings', tenantId));
    const config = settings.data()?.databaseConfig?.firebaseConfig;
    const target = config ? getFirestore(initializeApp(config, tenantId)) : platform;
    for (const id of ids) {
      const user = await getDocFromServer(doc(platform, 'users', id));
      if (!user.exists() || user.data().isDemo !== true || user.data().tenantId !== tenantId) throw new Error('Expected seeded demo customer missing.');
      const data = user.data();
      await setDoc(doc(target, 'demo_customers', id), { tenantId, name: data.name, email: data.email, isActive: data.isActive, isDemo: true }, { merge: true });
    }
    if (!settings.data()?.customerDirectory?.collectionName) await setDoc(doc(platform, 'tenant_settings', tenantId), { customerDirectory: { collectionName: 'demo_customers' } }, { merge: true });
    console.log(`${tenantId}: fictional customer directory ready.`);
  }
}
run().then(() => process.exit(0)).catch(error => { console.error(error.message); process.exit(1); });
