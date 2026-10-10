/* eslint-disable @typescript-eslint/no-require-imports -- Verification scripts run directly in Node as CommonJS. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../lib/database-access.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const loaded = { exports: {} };
new Function('exports', 'module', compiled)(loaded.exports, loaded);
const { parseAllowedCollections, assertCollectionAllowed, orderCollection } = loaded.exports;

assert.deepEqual(parseAllowedCollections(' orders, customers\norders, '), ['orders', 'customers']);
assert.deepEqual(parseAllowedCollections(['orders', 'customers']), ['orders', 'customers']);
for (const value of ['*', 'orders/private', 'orders;users', ['orders', 1], {}, 'a'.repeat(101)]) {
  assert.throws(() => parseAllowedCollections(value));
}
assert.equal(orderCollection(undefined), 'demo_orders');
assert.equal(orderCollection({ ordersCollection: 'company_orders' }), 'company_orders');
assert.throws(() => orderCollection({ ordersCollection: 'orders/private' }));
assert.doesNotThrow(() => assertCollectionAllowed(undefined, 'demo_orders'));
assert.throws(() => assertCollectionAllowed(undefined, 'users'));
assert.throws(() => assertCollectionAllowed({ allowedCollections: '' }, 'demo_orders'));
assert.throws(() => assertCollectionAllowed({ allowedCollections: [] }, 'demo_orders'));
const config = { allowedCollections: 'orders, customers', ordersCollection: 'orders' };
assert.doesNotThrow(() => assertCollectionAllowed(config, orderCollection(config)));
assert.doesNotThrow(() => assertCollectionAllowed(config, 'customers'));
assert.throws(() => assertCollectionAllowed(config, 'Orders'));
assert.throws(() => assertCollectionAllowed(config, 'private_payments'));
assert.throws(() => assertCollectionAllowed({ allowedCollections: 'customers' }, 'orders'));
assert.throws(() => assertCollectionAllowed({ allowedCollections: 'orders' }, 'customers'));
async function verifyOrderReads() {
  let currentConfig = config;
  let companyReads = 0;
  let customer = { tenantId: 'company-1', isActive: true };
  const target = { app: { options: { projectId: 'company-project' } } };
  const mocks = {
    './firebase': { db: {} },
    './company-database': { companyDatabaseConnection: async () => ({ database: target, config: currentConfig }) },
    './database-access': loaded.exports,
    'firebase/firestore': {
      doc: () => ({}), getDocFromServer: async () => ({ data: () => customer }),
      collection: (database, name) => ({ database, name }), where: (...args) => args, limit: value => value,
      query: (reference, ...conditions) => ({ reference, conditions }),
      getDocsFromServer: async request => {
        companyReads++;
        assert.equal(request.reference.name, 'orders');
        assert.deepEqual(request.conditions.slice(0, 2), [['tenantId', '==', 'company-1'], ['customerId', '==', 'customer-1']]);
        return { docs: [] };
      }, addDoc: async () => {},
    },
    jspdf: {}, nodemailer: {},
  };
  const toolsSource = fs.readFileSync(path.join(__dirname, '../lib/tools.ts'), 'utf8');
  const toolsCode = ts.transpileModule(toolsSource, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const toolModule = { exports: {} };
  new Function('exports', 'module', 'require', toolsCode)(toolModule.exports, toolModule, name => {
    assert.ok(name in mocks, `Unexpected dependency: ${name}`);
    return mocks[name];
  });
  const { getCustomerOrders, queryDatabase } = toolModule.exports;
  await getCustomerOrders('company-1', 'customer-1');
  assert.equal(companyReads, 1);
  const denied = await queryDatabase({ tenantId: 'company-1', userId: 'customer-1', collectionName: 'customers', searchQuery: '' });
  assert.equal(denied.success, false);
  currentConfig = { ...config, allowedCollections: 'customers' };
  await assert.rejects(getCustomerOrders('company-1', 'customer-1'), /not allowed/);
  currentConfig = config;
  customer = { tenantId: 'another-company', isActive: true };
  await assert.rejects(getCustomerOrders('company-1', 'customer-1'), /not authorized/);
  assert.equal(companyReads, 1, 'Denied collections and other companies must never trigger company reads');
}
verifyOrderReads().then(() => console.log('Database access checks passed, including configured order reads, blocked collections and company identity enforcement.')).catch(error => { console.error(error); process.exitCode = 1; });
