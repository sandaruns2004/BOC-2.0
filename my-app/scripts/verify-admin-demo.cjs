const assert = require('node:assert/strict');
const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());
const base = 'http://127.0.0.1:3000';
async function request(path, method = 'GET', body, cookie) {
  const res = await fetch(base + path, { method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  return { res, data: res.headers.get('content-type')?.includes('text/event-stream') ? text.split('\n\n').filter(Boolean).map(line => JSON.parse(line.slice(6))).find(event => event.type === 'result') : JSON.parse(text) };
}
async function run() {
  const home = await (await fetch(base)).text(); assert.match(home, /href="\/admin\/dashboard"[^]*?Launch Live Console/); console.log('PASS: live console points to admin dashboard');
  const login = await request('/api/auth/admin-login', 'POST', { email: 'admin@walkwave.example', password: process.env.WALKWAVE_ADMIN_PASSWORD }); assert.equal(login.res.status, 200); const manager = login.res.headers.get('set-cookie').split(';')[0];
  let r = await request('/api/admin/users', 'GET', undefined, manager); assert.equal(r.res.status, 200); assert.ok(r.data.users.some(u => u.id === 'walkwave_jane')); assert.ok(r.data.users.some(u => u.id === 'walkwave_bob')); assert.ok(!r.data.users.some(u => u.id === 'nova_alice')); assert.ok(r.data.users.every(u => !Object.hasOwn(u, 'passwordHash'))); console.log('PASS: existing company users include prepared demos without credentials');
  r = await request('/api/admin/users', 'PATCH', { userId: 'nova_alice', isActive: false }, manager); assert.equal(r.res.status, 404); console.log('PASS: another company customer cannot be disabled');
  const customerLogin = await request('/api/demo/login', 'POST', { company: 'walkwave', customerId: 'walkwave_jane' }); const customer = customerLogin.res.headers.get('set-cookie').split(';')[0];
  try {
    r = await request('/api/admin/users', 'PATCH', { userId: 'walkwave_jane', isActive: false }, manager); assert.equal(r.res.status, 200);
    r = await request('/api/chat', 'POST', { message: 'Have my shoes shipped?' }, customer); assert.equal(r.res.status, 403); console.log('PASS: disabled customer existing session cannot chat');
  } finally { await request('/api/admin/users', 'PATCH', { userId: 'walkwave_jane', isActive: true }, manager); }
  r = await request('/api/chat', 'POST', { message: 'I want a refund of LKR 75,000', requestId: crypto.randomUUID() }, customer); const ticketId = r.data.escalationId; assert.ok(ticketId);
  r = await request('/api/escalation', 'GET', undefined, manager); const ticket = r.data.escalations.find(t => t.id === ticketId); assert.equal(ticket.customerName, 'Jane'); assert.match(ticket.userMessage, /75,000/); assert.match(ticket.reviewRule, /50,000/); console.log('PASS: review ticket contains customer, original request, and rule');
  r = await request('/api/escalation', 'PATCH', { id: ticketId, decision: 'rejected', adminNote: 'Demo verification: request needs further review.' }, manager); assert.equal(r.res.status, 200);
  r = await request('/api/escalation?status=rejected', 'GET', undefined, manager); assert.equal(r.data.escalations.find(t => t.id === ticketId).adminNote, 'Demo verification: request needs further review.'); console.log('PASS: decision notes persist in reviewed history');
}
run().catch(error => { console.error(error.message); process.exitCode = 1; });
