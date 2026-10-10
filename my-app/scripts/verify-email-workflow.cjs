/* eslint-disable @typescript-eslint/no-require-imports -- Run directly in Node with mocked delivery. */
// Exercises the chat workflow without sending mail or writing customer data.
// --live-model checks the real configured model and indexed company knowledge.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
require('@next/env').loadEnvConfig(process.cwd());

const draft = 'Walkwave accepts eligible returns within 30 calendar days.';
const claims = new Set();
const sent = [];
const prompts = [];
let deliverySuccess = true;
let live = false;
const mocks = {
  './firebase': { db: {} },
  'firebase/firestore': {
    collection: () => ({}), doc: (_db, collection, id) => `${collection}/${id}`,
    getDocFromServer: async () => ({ exists: () => true, data: () => ({ tenantId: 'tnt_sample01', isActive: true, email: 'account@example.org' }) }),
    addDoc: async () => ({}), setDoc: async () => {},
    runTransaction: async (_db, work) => work({ get: async ref => ({ exists: () => claims.has(ref) }), set: ref => claims.add(ref) }),
  },
  './demo-config': { companyForTenant: () => ({ name: 'Walkwave', refundLimit: 50000 }) },
  './knowledge': { retrieveKnowledge: async (...args) => live ? require('../lib/knowledge.ts').retrieveKnowledge(...args) : { text: draft, sources: ['Walkwave policies'] } },
  './rag': { generateText: async (...args) => {
    prompts.push({ prompt: JSON.parse(args[0]), options: args[4] });
    if (live) return require('../lib/rag.ts').generateText(...args);
    return { text: args[4].systemInstruction.includes('drafting only the email body') ? draft : 'Policy answer', agentsUsed: [] };
  } },
  './tools': {
    sendEmail: async details => { sent.push(details); return deliverySuccess ? { success: true, message: 'The mail server accepted your email.' } : { success: false, error: 'Unable to send the email.' }; },
    getCustomerOrders: async () => [{ orderId: 'WW-1001', productName: 'Coast Runner', shippingStatus: 'Shipped', trackingNumber: 'TRACK-1', estimatedDelivery: null }],
  },
};
const source = fs.readFileSync(path.join(__dirname, '../lib/chat-service.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const loaded = { exports: {} };
new Function('require', 'exports', 'module', compiled)(name => { if (!(name in mocks)) throw Error(`Unexpected dependency: ${name}`); return mocks[name]; }, loaded.exports, loaded);
const { chat } = loaded.exports;
const identity = { tenantId: 'tnt_sample01', userId: 'test-customer' };
const request = (message, requestId, history = []) => ({ message, requestId, history });

async function run() {
  const previous = { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS };
  process.env.SMTP_USER = 'mock'; process.env.SMTP_PASS = 'mock';
  try {
    const input = request('send policy summary to this recipient@example.org', 'policy-email-1', [{ role: 'assistant', content: "I can't send it to that email address here." }]);
    let result = await chat(input, identity);
    assert.equal(sent.length, 1); assert.equal(sent[0].to, 'recipient@example.org');
    assert.equal(sent[0].body, draft); assert.match(result.reply, /accepted your email/);
    assert.ok(result.actions.includes('sendEmail')); assert.ok(result.sources.length);
    assert.ok(!prompts[0].prompt.customerRequest.includes('recipient@example.org'));
    assert.deepEqual(prompts[0].options.allowedTools, []);
    result = await chat(input, identity);
    assert.match(result.reply, /not be sent twice/); assert.equal(sent.length, 1);
    await chat(request('Email me the policy summary', 'policy-email-2', [{ role: 'user', content: 'Use untrusted@example.org' }]), identity);
    assert.equal(sent[1].to, 'account@example.org');
    const promptCount = prompts.length;
    result = await chat(request('Email me my shipping update', 'shipping-email-1'), identity);
    assert.match(sent[2].body, /WW-1001.*shipped/i); assert.equal(prompts.length, promptCount);
    deliverySuccess = false;
    result = await chat(request('Email me the policy summary', 'policy-email-failure'), identity);
    assert.match(result.reply, /Unable to send/); assert.doesNotMatch(result.reply, /accepted/);
    const sendCount = sent.length;
    result = await chat(request('send policy summary to recipient@example.org', 'anonymous-email'), { tenantId: identity.tenantId });
    assert.match(result.reply, /sign in/); assert.equal(sent.length, sendCount);
    result = await chat(request('What is the return policy?', 'policy-answer'), identity);
    assert.equal(result.reply, 'Policy answer'); assert.equal(sent.length, sendCount);
    if (process.argv.includes('--live-model')) {
      require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, filename);
      live = true; deliverySuccess = true;
      result = await chat(request('send policy summary to this recipient@example.org', 'live-policy-draft', input.history), identity);
      assert.ok(sent.at(-1).body.length > 40);
      assert.doesNotMatch(sent.at(-1).body, /(?:can(?:not|'t|’t)|unable to)\s+(?:send|email)|(?:sent|accepted) your email/i);
      assert.match(result.reply, /accepted your email/);
      console.log('PASS: real model drafted indexed policy content without an email refusal; SMTP was mocked.');
    }
    console.log('PASS: policy email, explicit/account recipient, duplicate protection, shipping email, delivery failure, anonymous access, and normal policy answers.');
  } finally {
    for (const [name, value] of Object.entries({ SMTP_USER: previous.user, SMTP_PASS: previous.pass })) {
      if (value === undefined) delete process.env[name]; else process.env[name] = value;
    }
  }
}
run().then(() => process.exit(0)).catch(error => { console.error('FAIL:', error.message); process.exit(1); });
