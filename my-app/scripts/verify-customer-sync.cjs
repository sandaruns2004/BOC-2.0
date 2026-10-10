// Exercise the real API against separate verification records in the connected
// client database. Verification accounts and integrations are disabled at the end.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
require('@next/env').loadEnvConfig(process.cwd());
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, getDocFromServer, getDocsFromServer, query, where, setDoc, updateDoc } = require('firebase/firestore');
const base = process.env.SYNC_TEST_BASE_URL || 'http://127.0.0.1:3000';
const id = crypto.randomUUID().replaceAll('-', '').slice(0, 12);
const tenant = 'tnt_sync_check_' + id, adminId = 'sync_admin_' + id, keyId = 'sync_key_' + id;
const clientId = 'client_customer_' + id, sourceCollection = 'sync_check_' + id;
const password = crypto.randomBytes(20).toString('hex'), apiKey = 'af_' + crypto.randomBytes(24).toString('hex');
const db = getFirestore(initializeApp({ apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID }, 'customer-sync-check-' + id));
let target, importedId;
async function request(path, body, headers = {}) {
  const response = await fetch(base + path, { method: body === undefined ? 'GET' : path === '/api/admin/users' && body.userId ? 'PATCH' : 'POST', headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...headers }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(60000) });
  return { status: response.status, data: await response.json() };
}
async function run() {
  try {
    const firebase = (await getDocFromServer(doc(db, 'tenant_settings', 'tnt_sample01'))).data()?.databaseConfig?.firebaseConfig;
    assert.ok(firebase?.projectId);
    target = getFirestore(initializeApp(firebase, 'client-sync-check-' + id));
    await Promise.all([
      setDoc(doc(db, 'business_admins', adminId), { tenantId: tenant, name: 'Sync verification', email: id + '@sync-check.example', passwordHash: await bcrypt.hash(password, 10), isActive: true }),
      setDoc(doc(db, 'tenant_settings', tenant), { companyName: 'Sync test', databaseConfig: { firebaseConfig: firebase } }),
      setDoc(doc(db, 'api_keys', keyId), { tenantId: tenant, key: apiKey, isActive: true }),
      // A matching raw ID in another tenant must never be overwritten.
      setDoc(doc(db, 'users', clientId), { tenantId: 'other_sync_tenant_' + id, name: 'Other tenant customer', isActive: false }),
      setDoc(doc(target, sourceCollection, clientId), { tenantId: tenant, name: 'Client profile', email: 'profile@sync-check.example', isActive: true, password: 'DO-NOT-IMPORT', passwordHash: 'DO-NOT-IMPORT', privateNotes: 'DO-NOT-IMPORT', createdAt: new Date().toISOString() }),
      setDoc(doc(target, sourceCollection, 'foreign_' + id), { tenantId: 'other_sync_tenant_' + id, name: 'Foreign source customer', isActive: true }),
      setDoc(doc(target, sourceCollection, 'invalid_' + id), { tenantId: tenant, name: 'Bad email record', email: 'invalid email', isActive: true }),
      setDoc(doc(target, 'demo_orders', 'SYNC_ORDER_' + id), { tenantId: tenant, customerId: clientId, orderId: 'SYNC-1001', productName: 'Verified Client Shoes', shippingStatus: 'Shipped', totalAmount: 5000, currency: 'LKR' }),
    ]);
    assert.equal((await request('/api/admin/customer-sync')).status, 401);
    const login = await fetch(base + '/api/auth/admin-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: id + '@sync-check.example', password }) });
    assert.equal(login.status, 200);
    const auth = { Cookie: login.headers.get('set-cookie').split(';')[0] };
    const config = { enabled: true, collection: sourceCollection, tenantField: 'tenantId', tenantValue: tenant };
    assert.equal((await request('/api/admin/customer-sync', { config: { ...config, collection: '../users' } }, auth)).status, 400);
    assert.equal((await request('/api/admin/customer-sync', { config, tenantId: 'tnt_nova_demo' }, auth)).status, 200);
    let result = await request('/api/admin/users', undefined, auth);
    assert.equal(result.status, 200); assert.equal(result.data.users.length, 1);
    importedId = result.data.users[0].id;
    assert.notEqual(importedId, clientId); assert.equal(result.data.users[0].externalCustomerId, clientId);
    assert.equal(result.data.users[0].source, 'Company database'); assert.equal(result.data.sync.skipped, 1);
    const copied = (await getDocFromServer(doc(db, 'users', importedId))).data();
    for (const privateField of ['password', 'passwordHash', 'privateNotes']) assert.equal(copied[privateField], undefined);
    assert.equal((await getDocFromServer(doc(db, 'users', clientId))).data().name, 'Other tenant customer');
    console.log('PASS: real client profile imported into its own tenant; foreign records and passwords excluded');
    result = await request('/api/admin/customer-sync', { action: 'sync' }, auth);
    assert.equal(result.status, 200); assert.equal(result.data.sync.created, 0); assert.equal(result.data.sync.unchanged, 1);
    assert.equal((await request('/api/admin/users', undefined, auth)).data.users.length, 1);
    console.log('PASS: repeated syncing keeps a stable identity and creates no duplicates');
    result = await request('/api/v1/chat', { customerId: importedId, message: 'What is my order status?', requestId: crypto.randomUUID() }, { Authorization: 'Bearer ' + apiKey });
    assert.equal(result.status, 200); assert.match(result.data.reply, /Verified Client Shoes.*shipped/i);
    assert.equal((await request('/api/v1/chat', { customerId: clientId, message: 'My order status?' }, { Authorization: 'Bearer ' + apiKey })).status, 403);
    console.log('PASS: imported platform identity retrieves orders using the original client customer ID');
    await request('/api/admin/users', { userId: importedId, isActive: false }, auth);
    await updateDoc(doc(target, sourceCollection, clientId), { name: 'Updated client profile' });
    await request('/api/admin/customer-sync', { action: 'sync' }, auth);
    let user = (await request('/api/admin/users', undefined, auth)).data.users[0];
    assert.equal(user.name, 'Updated client profile'); assert.equal(user.isActive, false);
    await request('/api/admin/users', { userId: importedId, isActive: true }, auth);
    await updateDoc(doc(target, sourceCollection, clientId), { isActive: false });
    await request('/api/admin/customer-sync', { action: 'sync' }, auth);
    assert.equal((await request('/api/admin/users', undefined, auth)).data.users[0].isActive, false);
    assert.equal((await request('/api/admin/users', { userId: importedId, isActive: true }, auth)).data.isActive, false);
    console.log('PASS: profile updates propagate; admin disable survives sync; client disable revokes access');
    await updateDoc(doc(target, sourceCollection, clientId), { isActive: true });
    await request('/api/admin/customer-sync', { action: 'sync' }, auth);
    assert.equal((await request('/api/admin/users', undefined, auth)).data.users[0].isActive, true);
    // Moving outside the configured company filter simulates removal from the source.
    await updateDoc(doc(target, sourceCollection, clientId), { tenantId: 'removed_source_' + id });
    await request('/api/admin/customer-sync', { action: 'sync' }, auth);
    user = (await request('/api/admin/users', undefined, auth)).data.users[0]; assert.equal(user.isActive, false);
    assert.equal((await request('/api/auth/user-login', { email: 'profile@sync-check.example', password: 'DO-NOT-IMPORT' })).status, 401);
    console.log('PASS: missing source profiles lose access; imported users keep company login instead of copied passwords');
    console.log('CUSTOMER SYNC VERIFICATION PASSED. Verification accounts disabled; no emails sent.');
  } finally {
    const cleanup = [setDoc(doc(db, 'business_admins', adminId), { isActive: false }, { merge: true }), setDoc(doc(db, 'api_keys', keyId), { isActive: false }, { merge: true }), setDoc(doc(db, 'tenant_settings', tenant), { customerSync: { enabled: false, collection: sourceCollection, tenantField: 'tenantId', tenantValue: tenant } }, { merge: true })];
    const users = await getDocsFromServer(query(collection(db, 'users'), where('tenantId', '==', tenant)));
    for (const user of users.docs) cleanup.push(setDoc(user.ref, { isActive: false, accessDisabled: true }, { merge: true }));
    if (target) cleanup.push(setDoc(doc(target, sourceCollection, clientId), { isActive: false }, { merge: true }));
    await Promise.all(cleanup);
  }
}
run().then(() => process.exit(0)).catch(error => { console.error('FAIL:', error.message); process.exit(1); });
