// Add fictional customers without changing existing accounts. Safe to run again.
require('@next/env').loadEnvConfig(process.cwd());
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, runTransaction } = require('firebase/firestore');
const { randomBytes } = require('node:crypto');
const bcrypt = require('bcryptjs');
const db = getFirestore(initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}, 'walkwave-customer-seed'));
const names = ['Nimal Perera', 'Dilini Fernando', 'Kasun Silva', 'Tharushi Jayasinghe', 'Amal Wijesinghe', 'Sachini Bandara', 'Ruwan Dissanayake', 'Ishara Gunawardena', 'Dinesh Kumara', 'Anjali Senanayake'];
async function run() {
  let added = 0;
  for (const [index, name] of names.entries()) {
    const id = `walkwave_mock_${String(index + 1).padStart(2, '0')}`;
    const data = {
      tenantId: 'tnt_sample01', name,
      email: `${name.toLowerCase().replaceAll(' ', '.')}@walkwave.example`,
      role: 'user', isActive: true, isDemo: true,
      passwordHash: await bcrypt.hash(randomBytes(32).toString('hex'), 10),
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
  console.log(`${added} added; 10 mock Walkwave customers are available. Existing accounts unchanged.`);
}
run().then(() => process.exit(0)).catch(error => { console.error(error.message); process.exit(1); });
