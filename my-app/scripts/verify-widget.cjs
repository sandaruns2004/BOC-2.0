// Real HTTP/data verification. Creates a separate temporary test company;
// its accounts, API key and widget are disabled in finally. No email is sent.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
require('@next/env').loadEnvConfig(process.cwd());
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
const base = process.env.WIDGET_TEST_BASE_URL || 'http://127.0.0.1:3000';
const origin = 'http://localhost:4000';
const id = crypto.randomUUID().replaceAll('-', '').slice(0, 12);
const tenant = 'tnt_widget_check_' + id, customer = 'widget_customer_' + id, adminId = 'widget_admin_' + id, keyId = 'widget_key_' + id;
const password = crypto.randomBytes(20).toString('hex'), apiKey = 'af_' + crypto.randomBytes(24).toString('hex');
const db = getFirestore(initializeApp({ apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID }, 'widget-check-' + id));
const config = { enabled: true, name: 'Acme Support', color: '#2255aa', allowedOrigins: [origin] };
async function request(path, body, headers = {}) {
  const response = await fetch(base + path, { method: body === undefined ? 'GET' : 'POST', headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...headers }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(60000) });
  const data = await response.json(); return { status: response.status, data };
}
async function run() {
  try {
    await Promise.all([
      setDoc(doc(db, 'business_admins', adminId), { tenantId: tenant, name: 'Widget verification', company: 'Acme', email: id + '@widget-check.example', passwordHash: await bcrypt.hash(password, 10), isActive: true, createdAt: new Date().toISOString() }),
      setDoc(doc(db, 'users', customer), { tenantId: tenant, name: 'Acme customer', email: 'customer@widget-check.example', isActive: true }),
      setDoc(doc(db, 'api_keys', keyId), { tenantId: tenant, key: apiKey, isActive: true, name: 'Widget verification' }),
      setDoc(doc(db, 'demo_orders', 'widget_order_' + id), { tenantId: tenant, customerId: customer, orderId: 'ACME-1001', productName: 'Acme Backpack', shippingStatus: 'Shipped', trackingNumber: 'ACME-TRACK', estimatedDelivery: '2026-10-14', totalAmount: 5000, currency: 'LKR' }),
    ]);
    const signedIn = await request('/api/auth/admin-login', { email: id + '@widget-check.example', password });
    assert.equal(signedIn.status, 200);
    // Obtain the admin cookie without ever printing it.
    const login = await fetch(base + '/api/auth/admin-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: id + '@widget-check.example', password }) });
    const adminHeaders = { Cookie: login.headers.get('set-cookie').split(';')[0] };
    assert.equal((await request('/api/admin/widget')).status, 401);
    let r = await request('/api/admin/widget', undefined, adminHeaders); assert.equal(r.data.companyId, tenant); assert.equal(r.data.widget.enabled, false);
    assert.equal((await request('/api/admin/widget', { widget: { ...config, allowedOrigins: ['https://example.com/path'] } }, adminHeaders)).status, 400);
    assert.equal((await request('/api/admin/widget', { widget: config, companyId: 'tnt_nova_demo' }, adminHeaders)).status, 200);
    r = await request('/api/admin/widget', undefined, adminHeaders); assert.equal(r.data.companyId, tenant); assert.equal(r.data.widget.name, 'Acme Support');
    console.log('PASS: a new company can configure its own widget; admin scope and origin validation enforced');
    r = await request('/api/widget/config?company=' + tenant + '&origin=' + encodeURIComponent(origin), undefined, { Origin: origin }); assert.equal(r.status, 200); assert.equal(r.data.name, 'Acme Support');
    assert.equal((await request('/api/widget/config?company=' + tenant + '&origin=https://unapproved.example')).status, 403);
    assert.equal((await request('/api/widget/config?company=' + tenant + '&origin=' + encodeURIComponent(origin), undefined, { Origin: 'https://unapproved.example' })).status, 403);
    const frame = await fetch(base + '/widget/frame?company=' + tenant + '&origin=' + encodeURIComponent(origin)); assert.equal(frame.status, 200); assert.ok(frame.headers.get('content-security-policy').includes('frame-ancestors ' + origin));
    console.log('PASS: cross-origin configuration and iframe policy only allow configured websites');
    const auth = { Authorization: 'Bearer ' + apiKey };
    assert.equal((await request('/api/widget/session', { customerId: customer, origin }, { Authorization: 'Bearer invalid' })).status, 401);
    assert.equal((await request('/api/widget/session', { customerId: 'walkwave_jane', origin }, auth)).status, 403);
    assert.equal((await request('/api/widget/session', { origin }, auth)).status, 400);
    r = await request('/api/widget/session', { customerId: customer, origin }, auth); assert.equal(r.status, 200); assert.equal(r.data.customer.id, customer);
    const token = r.data.token, bearer = { Authorization: 'Bearer ' + token };
    assert.equal((await request('/api/widget/session', undefined, bearer)).data.company, tenant);
    assert.equal((await request('/api/widget/chat', { message: 'My order status?' }, { Authorization: 'Bearer ' + token.slice(0, -12) + 'invalidtoken' })).status, 401);
    r = await request('/api/widget/chat', { message: 'What is my order status?', requestId: crypto.randomUUID() }, bearer); assert.equal(r.status, 200); assert.match(r.data.reply, /Acme Backpack.*shipped/i); assert.equal(r.data.orders.length, 1);
    console.log('PASS: signed customer token retrieves only the new company customer’s real order');
    const anonymous = await request('/api/widget/bootstrap', { company: tenant, origin, customerId: customer }); assert.equal(anonymous.status, 200); assert.equal(anonymous.data.customer, null);
    r = await request('/api/widget/chat', { message: 'My order status?' }, { Authorization: 'Bearer ' + anonymous.data.token }); assert.match(r.data.reply, /sign in/i); assert.ok(!r.data.orders?.length);
    r = await request('/api/widget/chat', { message: 'Email me my shipping update' }, { Authorization: 'Bearer ' + anonymous.data.token }); assert.match(r.data.reply, /sign in/i); assert.ok(!r.data.actions.length);
    console.log('PASS: browser-supplied customerId cannot turn an anonymous session into personal access');
    await setDoc(doc(db, 'users', customer), { isActive: false }, { merge: true });
    assert.equal((await request('/api/widget/chat', { message: 'My order status?' }, bearer)).status, 403);
    await setDoc(doc(db, 'users', customer), { isActive: true }, { merge: true });
    const refund = await request('/api/widget/chat', { message: 'I want a refund of LKR 75,000', requestId: crypto.randomUUID() }, bearer); assert.equal(refund.status, 200); assert.ok(refund.data.escalationId);
    r = await request('/api/widget/escalation?id=' + encodeURIComponent(refund.data.escalationId), undefined, bearer); assert.equal(r.status, 200); assert.equal(r.data.status, 'pending');
    const otherCustomer = 'widget_other_' + id;
    await setDoc(doc(db, 'users', otherCustomer), { tenantId: tenant, name: 'Other test customer', isActive: true });
    const other = await request('/api/widget/session', { customerId: otherCustomer, origin }, auth);
    assert.equal((await request('/api/widget/escalation?id=' + encodeURIComponent(refund.data.escalationId), undefined, { Authorization: 'Bearer ' + other.data.token })).status, 404);
    await setDoc(doc(db, 'users', otherCustomer), { isActive: false }, { merge: true });
    await request('/api/admin/widget', { widget: { ...config, enabled: false } }, adminHeaders);
    assert.equal((await request('/api/widget/chat', { message: 'My order status?' }, bearer)).status, 403);
    console.log('PASS: disabled customer/widget revokes access immediately; review tickets remain private');
    console.log('WIDGET VERIFICATION PASSED. Dedicated verification records remain disabled. No email was sent.');
  } finally {
    await Promise.all([
      setDoc(doc(db, 'users', customer), { isActive: false }, { merge: true }),
      setDoc(doc(db, 'business_admins', adminId), { isActive: false }, { merge: true }),
      setDoc(doc(db, 'api_keys', keyId), { isActive: false }, { merge: true }),
      setDoc(doc(db, 'tenant_settings', tenant), { widgetConfig: { ...config, enabled: false } }, { merge: true }),
    ]);
  }
}
run().then(() => process.exit(0)).catch(error => { console.error('FAIL:', error.message); process.exit(1); });
