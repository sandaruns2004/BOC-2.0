/* eslint-disable @typescript-eslint/no-require-imports -- Direct Node verification script. */
// Regression checks use an in-memory store. --live round-trips existing settings
// through authenticated HTTP without changing their configured values.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
require('@next/env').loadEnvConfig(process.cwd());
const clone = value => structuredClone(value);
let session = { role: 'admin', tenantId: 'company-a', userId: 'admin-a' };
let unavailable = false;
const database = { allowedCollections: 'demo_orders, users', ordersCollection: 'demo_orders', dataSchemaDescription: 'Orders and customers', firebaseConfig: { projectId: 'external-company', apiKey: 'test-key', appId: 'old-app' } };
const sync = { enabled: true, collection: 'users', tenantField: 'tenantId', tenantValue: 'company-a' };
const widget = { enabled: true, name: 'Support', color: '#214d3b', allowedOrigins: ['https://shop.example.org'] };
const store = new Map([
  ['business_admins/admin-a', { tenantId: 'company-a', isActive: true }],
  ['tenant_settings/company-a', { companyName: 'Company A', databaseConfig: clone(database), customerSync: clone(sync), widgetConfig: clone(widget) }],
  ['tenant_settings/company-b', { companyName: 'Company B' }],
]);
const snapshot = ref => ({ exists: () => store.has(ref), data: () => clone(store.get(ref)) });
const firestore = {
  doc: (_db, collection, id) => `${collection}/${id}`,
  getDocFromServer: async ref => { if (unavailable) throw Error('Offline'); return snapshot(ref); },
  setDoc: async (ref, data) => store.set(ref, { ...store.get(ref), ...clone(data) }),
  runTransaction: async (_db, work) => {
    const pending = [];
    await work({ get: async ref => snapshot(ref), set: (ref, data, options) => pending.push({ ref, data, options }) });
    for (const { ref, data, options } of pending) {
      assert.ok(options.mergeFields || options.merge);
      store.set(ref, { ...store.get(ref), ...clone(data) });
    }
  },
};
const shared = { 'firebase/firestore': firestore, './firebase': { db: {} }, '@/lib/firebase': { db: {} }, '@/lib/session': { getSession: async () => session }, 'next/server': { NextResponse: Response } };
function load(file, extras = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const loaded = { exports: {} }; const dependencies = { ...shared, ...extras };
  new Function('require', 'exports', 'module', code)(name => name in dependencies ? dependencies[name] : require(name), loaded.exports, loaded);
  return loaded.exports;
}
const access = load('lib/database-access.ts');
const widgetConfig = load('lib/widget-config.ts', { './demo-config': { companyForTenant: () => null } });
const customer = load('lib/customer-sync.ts', { './company-database': {}, './database-access': access });
const routes = {
  settings: load('app/api/admin/settings/route.ts', { '@/lib/database-access': access }),
  widget: load('app/api/admin/widget/route.ts', { '@/lib/widget-config': widgetConfig }),
  sync: load('app/api/admin/customer-sync/route.ts', { '@/lib/database-access': access, '@/lib/customer-sync': { ...customer, customerSyncSettings: async tenant => { const settings = store.get(`tenant_settings/${tenant}`); return { settings, config: settings.customerSync }; }, syncCompanyCustomers: async () => ({ status: 'ready' }) } }),
};
const request = body => new Request('http://localhost/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const post = (route, body) => route.POST(request(body));
const settings = () => store.get('tenant_settings/company-a');

async function regression() {
  for (const bad of [null, { role: 'user', tenantId: 'company-a', userId: 'admin-a' }, { role: 'admin', tenantId: 'company-b', userId: 'admin-a' }]) {
    session = bad;
    for (const route of Object.values(routes)) { assert.equal((await route.GET()).status, 401); assert.equal((await post(route, {})).status, 401); }
  }
  session = { role: 'admin', tenantId: 'company-a', userId: 'admin-a' };
  store.get('business_admins/admin-a').isActive = false;
  for (const route of Object.values(routes)) { assert.equal((await route.GET()).status, 401); assert.equal((await post(route, {})).status, 401); }
  store.get('business_admins/admin-a').isActive = true;
  for (const route of Object.values(routes)) { const response = await route.GET(); assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'no-store'); }
  const original = clone(settings());
  for (const input of [null, { ...database, allowedCollections: '*' }, { ...database, ordersCollection: '../orders' }, { ...database, dataSchemaDescription: 'x'.repeat(5001) }, { ...database, firebaseConfig: [] }, { ...database, firebaseConfig: { projectId: 'x' } }, { ...database, firebaseConfig: { projectId: 'x', apiKey: 'key', appId: 12 } }, { ...database, allowedCollections: 'demo_orders' }, { ...database, firebaseConfig: null }, { ...database, firebaseConfig: { projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, apiKey: 'key' } }]) {
    assert.equal((await post(routes.settings, { databaseConfig: input })).status, 400);
    assert.deepEqual(settings(), original);
  }
  assert.equal((await routes.settings.POST(new Request('http://localhost', { method: 'POST', body: '{broken' }))).status, 400);
  const changed = { ...database, firebaseConfig: { projectId: ' external-company ', apiKey: ' test-key ' } };
  assert.equal((await post(routes.settings, { databaseConfig: changed, tenantId: 'company-b' })).status, 200);
  assert.equal(settings().databaseConfig.firebaseConfig.appId, undefined);
  assert.equal(settings().databaseConfig.firebaseConfig.projectId, 'external-company');
  assert.deepEqual(settings().widgetConfig, widget); assert.deepEqual(settings().customerSync, sync);
  assert.equal(store.get('tenant_settings/company-b').databaseConfig, undefined);
  for (const bad of [{ ...widget, color: 'red' }, { ...widget, name: '' }, { ...widget, allowedOrigins: [] }, { ...widget, allowedOrigins: ['https://example.org/path'] }, { ...widget, allowedOrigins: ['http://remote.example.org'] }]) assert.equal((await post(routes.widget, { widget: bad })).status, 400);
  assert.equal((await post(routes.widget, { widget: { ...widget, name: ' New name ', color: '#2255aa', allowedOrigins: ['https://shop.example.org/', 'https://shop.example.org'] } })).status, 200);
  assert.equal(settings().widgetConfig.name, 'New name'); assert.equal(settings().widgetConfig.allowedOrigins.length, 1);
  assert.deepEqual(settings().customerSync, sync); assert.equal(settings().databaseConfig.firebaseConfig.apiKey, 'test-key');
  for (const bad of [{ ...sync, collection: '../users' }, { ...sync, collection: 'unlisted' }, { ...sync, tenantValue: '' }]) assert.equal((await post(routes.sync, { config: bad })).status, 400);
  assert.equal((await post(routes.sync, { config: { ...sync, enabled: false } })).status, 200);
  assert.equal((await post(routes.settings, { databaseConfig: { ...database, firebaseConfig: null, allowedCollections: '' } })).status, 200);
  assert.equal(settings().databaseConfig.firebaseConfig, null);
  assert.equal((await post(routes.sync, { config: sync })).status, 400);
  assert.equal((await post(routes.settings, { databaseConfig: database })).status, 200);
  assert.equal((await post(routes.sync, { config: sync })).status, 200);
  assert.equal((await post(routes.sync, { action: 'sync' })).status, 200);
  assert.equal(settings().widgetConfig.name, 'New name');
  unavailable = true;
  for (const route of Object.values(routes)) { assert.equal((await route.GET()).status, 503); assert.equal((await post(route, {})).status, 503); }
  unavailable = false;
  console.log('PASS: admin isolation/revocation, input validation, enabled-sync protection, complete Firebase replacement, independent form saves, origin validation, and connection failures.');
}

async function live() {
  const base = process.env.SETTINGS_TEST_BASE_URL || 'http://127.0.0.1:3101';
  const login = await fetch(base + '/api/auth/admin-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin@walkwave.example', password: process.env.WALKWAVE_ADMIN_PASSWORD }) });
  assert.equal(login.status, 200, 'Existing Walkwave admin login failed');
  const cookie = login.headers.get('set-cookie').split(';')[0];
  async function http(route, body) {
    const response = await fetch(base + route, { method: body === undefined ? 'GET' : 'POST', headers: { Cookie: cookie, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(60000) });
    const data = await response.json(); assert.equal(response.status, 200, data.error); return data;
  }
  const before = await http('/api/admin/settings');
  const currentWidget = await http('/api/admin/widget');
  const currentSync = await http('/api/admin/customer-sync');
  const expected = access.validateDatabaseConfig(before.databaseConfig);
  await http('/api/admin/settings', { databaseConfig: expected });
  await http('/api/admin/widget', { widget: currentWidget.widget });
  await http('/api/admin/customer-sync', { config: currentSync.config });
  const after = await http('/api/admin/settings');
  assert.deepEqual(after.databaseConfig, expected);
  assert.deepEqual(after.widgetConfig, widgetConfig.validateWidget(currentWidget.widget));
  assert.deepEqual(after.customerSync, currentSync.config);
  if (currentSync.config.enabled) {
    const synced = await http('/api/admin/customer-sync', { action: 'sync' });
    assert.equal(synced.sync.status, 'ready');
    console.log('PASS: connected customer sync completed; imported customers:', synced.sync.importedCount);
  }
  const page = await fetch(base + '/admin/settings', { headers: { Cookie: cookie } });
  assert.equal(page.status, 200);
  const html = await page.text(); assert.ok(html.includes('Company settings') && html.includes('Website chat widget') && html.includes('Customer database sync'));
  console.log('PASS: authenticated page renders; all three current settings save and reload through real APIs and Firestore.');
}
regression().then(() => process.argv.includes('--live') ? live() : undefined).then(() => process.exit(0)).catch(error => { console.error('FAIL:', error.message); process.exit(1); });
