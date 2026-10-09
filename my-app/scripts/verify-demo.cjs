// Exercises actual HTTP handlers and real seeded data. --send-email sends one update to DEMO_EMAIL_TO.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());
const base = process.env.DEMO_API_BASE_URL || 'http://127.0.0.1:3000';
async function request(path, body, cookie, headers = {}) {
  const response = await fetch(base + path, { method: body === undefined ? 'GET' : 'POST', headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...headers }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(60000) });
  const text = await response.text();
  const data = response.headers.get('content-type')?.includes('text/event-stream') ? text.split('\n\n').filter(Boolean).map(line => JSON.parse(line.slice(6))).find(event => event.type === 'result') || { error: text } : JSON.parse(text);
  return { response, data };
}
async function login(company, customerId) {
  const r = await request('/api/demo/login', { company, customerId }); assert.equal(r.response.status, 200, r.data.error);
  return r.response.headers.get('set-cookie').split(';')[0];
}
async function say(cookie, message, route = '/api/chat', extra = {}) {
  const r = await request(route, { message, requestId: crypto.randomUUID(), ...extra }, cookie); assert.equal(r.response.status, 200, JSON.stringify(r.data)); assert.ok(r.data.reply, JSON.stringify(r.data)); return r.data;
}
async function run() {
  assert.equal((await request('/api/chat', { message: 'Hello' })).response.status, 401); console.log('PASS: anonymous chat rejected');
  const jane = await login('walkwave', 'walkwave_jane'); const bob = await login('walkwave', 'walkwave_bob');
  let r = await say(jane, 'Have my shoes shipped?'); assert.match(r.reply, /WW-1001.*shipped/i); assert.equal(r.orders.length, 1); console.log('PASS: Jane receives only her shipped order');
  r = await say(bob, 'Have my shoes shipped?'); assert.match(r.reply, /WW-1002.*processing/i); console.log('PASS: Bob receives his processing order');
  r = await say(jane, 'What is the status of WW-1002?'); assert.match(r.reply, /couldn't find/); assert.equal(r.orders.length, 0); console.log('PASS: another customer order is not disclosed');
  r = await say(jane, 'What is your return window?'); assert.match(r.reply, /30/); assert.ok(r.sources.length); console.log('PASS: Walkwave answer uses indexed policy');
  const alice = await login('nova', 'nova_alice');
  r = await say(alice, 'What is my order status?', '/api/demo/enterprise-chat'); assert.match(r.reply, /NV-1001.*delivered/i); assert.ok(r.requestId); console.log('PASS: Nova custom backend calls enterprise API and retrieves Alice order');
  const auth = { Authorization: 'Bearer ' + process.env.NOVA_DEMO_API_KEY };
  assert.equal((await request('/api/v1/chat', { message: 'Check my order', customerId: 'walkwave_jane' }, undefined, auth)).response.status, 403); console.log('PASS: enterprise API rejects customer from another company');
  assert.equal((await request('/api/v1/chat', { message: 'Hello' }, undefined, { Authorization: 'Bearer invalid' })).response.status, 401); console.log('PASS: invalid API key rejected');
  const manager = await request('/api/auth/admin-login', { email: 'admin@walkwave.example', password: process.env.WALKWAVE_ADMIN_PASSWORD }); assert.equal(manager.response.status, 200, JSON.stringify(manager.data));
  const admin = manager.response.headers.get('set-cookie').split(';')[0];
  const form = new FormData(); form.set('title', 'Walkwave PDF verification'); form.set('file', new File([fs.readFileSync('public/demo/Walkwave_Policies.pdf')], 'Walkwave_Policies.pdf', { type: 'application/pdf' }));
  const upload = await fetch(base + '/api/admin/documents', { method: 'POST', headers: { Cookie: admin }, body: form, signal: AbortSignal.timeout(60000) }); const uploaded = await upload.json(); assert.equal(upload.status, 200, JSON.stringify(uploaded)); assert.ok(uploaded.document.chunkCount > 0); console.log('PASS: actual PDF upload extracts and indexes text');
  const textForm = new FormData(); textForm.set('title', 'Walkwave TXT verification'); textForm.set('file', new File(['Walkwave offers 30-day eligible returns.'], 'walkwave-check.txt', { type: 'text/plain' }));
  const textUpload = await fetch(base + '/api/admin/documents', { method: 'POST', headers: { Cookie: admin }, body: textForm }); const textResult = await textUpload.json(); assert.equal(textUpload.status, 200, JSON.stringify(textResult)); assert.ok(textResult.document.chunkCount > 0); console.log('PASS: actual TXT upload indexes text');
  const emptyForm = new FormData(); emptyForm.set('file', new File([''], 'empty.txt')); const empty = await fetch(base + '/api/admin/documents', { method: 'POST', headers: { Cookie: admin }, body: emptyForm }); assert.equal(empty.status, 400); console.log('PASS: empty upload rejected');
  r = await say(jane, 'I demand a refund of LKR 75,000.'); assert.ok(r.escalationId); assert.ok(r.actions.includes('escalateToHuman'));
  const id = r.escalationId;
  assert.equal((await request('/api/escalation/' + encodeURIComponent(id), undefined, bob)).response.status, 404); console.log('PASS: refund ticket created, private to its customer');
  const queue = await request('/api/escalation?tenantId=tnt_sample01', undefined, admin); assert.ok(queue.data.escalations.some(t => t.id === id));
  const decision = await fetch(base + '/api/escalation', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Cookie: admin }, body: JSON.stringify({ id, decision: 'rejected' }) }); assert.equal(decision.status, 200);
  assert.equal((await request('/api/escalation/' + encodeURIComponent(id), undefined, jane)).data.status, 'rejected'); console.log('PASS: manager rejects ticket and customer sees persisted decision');
  assert.equal((await request('/api/escalation?tenantId=tnt_nova_demo', undefined, admin)).response.status, 403); console.log('PASS: cross-company manager access rejected');
  if (process.argv.includes('--send-email')) {
    const requestId = crypto.randomUUID();
    r = await say(jane, 'Email me my shipping update to ' + process.env.DEMO_EMAIL_TO, '/api/chat', { requestId }); assert.match(r.reply, /accepted your email/); console.log('PASS: shipping update accepted by SMTP server');
    r = await say(jane, 'Email me my shipping update to ' + process.env.DEMO_EMAIL_TO, '/api/chat', { requestId }); assert.match(r.reply, /not be sent twice/); console.log('PASS: duplicate email request does not resend');
  }
  console.log('DEMO VERIFICATION PASSED. Test policy records and the rejected test ticket remain as demo evidence.');
}
run().then(() => process.exit(0)).catch(e => { console.error('FAIL:', e.message); process.exit(1); });
