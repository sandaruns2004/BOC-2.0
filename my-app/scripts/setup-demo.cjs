/* Non-destructive setup: only dedicated demo users/orders/key/documents are created. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDocFromServer, setDoc } = require('firebase/firestore');
const { embedText, embeddingModelId, requiredKey } = require('./ai-embed.cjs');
const { Pinecone } = require('@pinecone-database/pinecone');
const { jsPDF } = require('jspdf');
const bcrypt = require('bcryptjs');

async function run() {
  for (const name of [requiredKey(), 'PINECONE_API_KEY', 'PINECONE_INDEX_NAME', 'NEXT_PUBLIC_FIREBASE_PROJECT_ID']) if (!process.env[name]) throw new Error(`${name} is missing.`);
  const db = getFirestore(initializeApp({ apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID }));
  const settings = await getDocFromServer(doc(db, 'tenant_settings', 'tnt_sample01'));
  const externalConfig = settings.data()?.databaseConfig?.firebaseConfig;
  const ordersDb = externalConfig ? getFirestore(initializeApp(externalConfig, 'demo-company-data')) : db;
  const envPath = path.join(process.cwd(), '.env.local');
  let env = fs.readFileSync(envPath, 'utf8');
  function setting(name, value) {
    if (!new RegExp(`^${name}=`, 'm').test(env)) env += `\n${name}=${value}\n`;
  }
  setting('JWT_SECRET', crypto.randomBytes(32).toString('hex'));
  setting('ENABLE_DEMO', 'true');
  setting('NOVA_DEMO_API_KEY', 'af_' + crypto.randomBytes(24).toString('hex'));
  setting('NOVA_ADMIN_PASSWORD', crypto.randomBytes(12).toString('base64url'));
  setting('WALKWAVE_ADMIN_PASSWORD', crypto.randomBytes(12).toString('base64url'));
  setting('DEMO_API_BASE_URL', 'http://127.0.0.1:3000');
  setting('NODE_USE_SYSTEM_CA', '1');
  fs.writeFileSync(envPath, env);
  const readSetting = name => env.match(new RegExp(`^${name}=(.*)$`, 'm'))?.[1].trim();
  const companies = [
    { id: 'walkwave', name: 'Walkwave', tenant: 'tnt_sample01', customers: [['walkwave_jane', 'Jane'], ['walkwave_bob', 'Bob']], policy: fs.readFileSync(path.resolve('..', 'walkwave', 'policies.md'), 'utf8') },
    { id: 'nova', name: 'Nova Electronics', tenant: 'tnt_nova_demo', customers: [['nova_alice', 'Alice'], ['nova_sam', 'Sam']], policy: '# Nova Electronics policies\nNova Electronics is a fictional Sri Lankan technology retailer. All prices are LKR. We sell laptops, wireless headphones, and desk accessories. Delivery costs LKR 450 and normally takes 3-5 business days after dispatch. Eligible unused items in their original packaging can be returned within 14 calendar days of delivery. Faulty items require support review. Refund requests over LKR 50,000 require manager approval. No payments are executed in this demo. Customers can access only their own orders. Shipping updates may be emailed only on request to the verified account address. Never invent tracking details. Support is available Monday-Friday, 9am-5pm Sri Lanka time.' },
  ];
  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY, fetchApi: fetch });
  const output = path.join(process.cwd(), 'public', 'demo'); fs.mkdirSync(output, { recursive: true });
  for (const c of companies) {
    await setDoc(doc(db, 'tenant_settings', c.tenant), { companyName: c.name, databaseConfig: { ...(settings.data()?.databaseConfig || {}), allowedCollections: 'demo_orders', dataSchemaDescription: 'Customer-owned orders: orderId, productName, customerId, tenantId, shippingStatus, trackingNumber, estimatedDelivery.', ...(externalConfig ? { firebaseConfig: externalConfig } : {}) } }, { merge: true });
    for (const [id, name] of c.customers) {
      const userRef = doc(db, 'users', id);
      if (!(await getDocFromServer(userRef)).exists()) await setDoc(userRef, { tenantId: c.tenant, name, email: `${name.toLowerCase()}@${c.id}.example`, role: 'user', isActive: true, isDemo: true, passwordHash: await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 10), createdAt: new Date().toISOString() });
    }
    const pdf = new jsPDF(); let y = 18;
    pdf.setFontSize(11);
    for (const paragraph of c.policy.replace(/^#+\s*/gm, '').split('\n')) {
      const lines = pdf.splitTextToSize(paragraph, 175);
      for (const line of lines) { if (y > 278) { pdf.addPage(); y = 18; } pdf.text(line, 18, y); y += 5; } y += 2;
    }
    fs.writeFileSync(path.join(output, `${c.name.replace(/ /g, '_')}_Policies.pdf`), Buffer.from(pdf.output('arraybuffer')));
    fs.writeFileSync(path.join(output, `${c.name.replace(/ /g, '_')}_Policies.txt`), c.policy);
    const id = `demo_${c.id}_policy`; const records = [];
    for (let i = 0; i < c.policy.length; i += 1100) {
      const content = c.policy.slice(i, i + 1300);
      records.push({ id: `${id}_chunk_${records.length}`, values: await embedText(content), metadata: { tenantId: c.tenant, docId: id, title: `${c.name} policies`, content, embeddingModel: embeddingModelId } });
    }
    await pc.index(process.env.PINECONE_INDEX_NAME).upsert({ records });
    await setDoc(doc(db, 'documents', id), { tenantId: c.tenant, adminId: 'demo_setup', title: `${c.name} policies`, filename: `${c.name}_Policies.txt`, status: 'indexed', chunkCount: records.length, fileSize: Buffer.byteLength(c.policy), text: c.policy, createdAt: new Date().toISOString() });
    console.log(`${c.name}: dedicated customers and indexed policy ready.`);
  }
  const rows = [
    ['WW-1001', 'tnt_sample01', 'walkwave_jane', 'Coast Runner', 'Shipped', 'WW-DEMO-1001', '2026-10-13', 13250],
    ['WW-1002', 'tnt_sample01', 'walkwave_bob', 'City Stride', 'Processing', null, null, 10400],
    ['NV-1001', 'tnt_nova_demo', 'nova_alice', 'Nova Air Headphones', 'Delivered', 'NV-DEMO-1001', '2026-10-09', 24900],
    ['NV-1002', 'tnt_nova_demo', 'nova_sam', 'NovaBook 14', 'Shipped', 'NV-DEMO-1002', '2026-10-14', 189900],
  ];
  for (const [orderId, tenantId, customerId, productName, shippingStatus, trackingNumber, estimatedDelivery, totalAmount] of rows) await setDoc(doc(ordersDb, 'demo_orders', orderId), { orderId, tenantId, customerId, productName, shippingStatus, trackingNumber, estimatedDelivery, totalAmount, currency: 'LKR', isDemo: true });
  await setDoc(doc(db, 'api_keys', 'nova_demo_key'), { tenantId: 'tnt_nova_demo', key: readSetting('NOVA_DEMO_API_KEY'), name: 'Nova server integration (demo)', isActive: true, usageCount: 0, createdAt: new Date().toISOString() }, { merge: true });
  await setDoc(doc(db, 'business_admins', 'nova_demo_admin'), { tenantId: 'tnt_nova_demo', email: 'admin@nova.example', name: 'Nova Demo Manager', role: 'admin', isActive: true, passwordHash: await bcrypt.hash(readSetting('NOVA_ADMIN_PASSWORD'), 10), createdAt: new Date().toISOString() });
  await setDoc(doc(db, 'business_admins', 'walkwave_demo_admin'), { tenantId: 'tnt_sample01', email: 'admin@walkwave.example', name: 'Walkwave Demo Manager', role: 'admin', isActive: true, passwordHash: await bcrypt.hash(readSetting('WALKWAVE_ADMIN_PASSWORD'), 10), createdAt: new Date().toISOString() });
  console.log('Four demo_orders are ready in the selected company database. Nova API key and manager account are ready. Secrets were saved only in .env.local; existing accounts and records were preserved.');
}
run().then(() => process.exit(0)).catch(e => { console.error('Demo setup failed:', e.message); process.exit(1); });
