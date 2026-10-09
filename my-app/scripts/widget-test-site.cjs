// A separate-origin installation fixture for manual UI verification.
// Add http://localhost:4000 to Nova's allowed origins before running this.
// Uses prepared fictional accounts, not a real client's login system.
require('@next/env').loadEnvConfig(process.cwd());
const http = require('node:http');
const service = process.env.WIDGET_TEST_SERVICE_URL || 'http://localhost:3000';
const origin = 'http://localhost:4000';
const server = http.createServer(async (req, res) => {
  if (req.url === '/api/support/widget-token' && req.method === 'POST') {
    try {
      const sam = (req.headers.cookie || '').includes('fixture_customer=sam');
      const response = await fetch(service + '/api/widget/session', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + process.env.NOVA_DEMO_API_KEY }, body: JSON.stringify({ customerId: sam ? 'nova_sam' : 'nova_alice', origin }) });
      res.writeHead(response.status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(await response.text());
    } catch { res.writeHead(502, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Test backend could not reach AgentForge.' })); }
    return;
  }
  if (req.url === '/alice' || req.url === '/sam') {
    res.writeHead(302, { Location: '/', 'Set-Cookie': `fixture_customer=${req.url.slice(1)}; Path=/; HttpOnly; SameSite=Lax` }); res.end(); return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nova external widget verification</title></head><body style="margin:0;font-family:Arial,sans-serif;background:#f3f6fc;color:#202f4e"><main style="max-width:900px;margin:80px auto;padding:30px"><p style="letter-spacing:3px">NOVA ELECTRONICS</p><h1 style="font-size:52px">Support on our own website.</h1><p>This verification site runs on port 4000. AgentForge and the embedded chat run on port 3000.</p><p>The only frontend integration is the reusable installation script below.</p><pre style="background:white;padding:25px;overflow:auto">&lt;script src="${service}/widget.js" data-company="tnt_nova_demo" data-token-url="/api/support/widget-token" defer&gt;&lt;/script&gt;</pre><p><a href="/alice">Use prepared Alice account</a> · <a href="/sam">Use prepared Sam account</a></p><p style="font-size:12px">Fictional test identities. This fixture simulates a first-party backend, not a production login.</p></main><script src="${service}/widget.js" data-company="tnt_nova_demo" data-token-url="/api/support/widget-token" defer></script></body></html>`);
});
server.listen(4000, '127.0.0.1', () => console.log('External widget verification site: http://localhost:4000'));
process.stdin.setEncoding('utf8'); process.stdin.on('data', text => { if (text.trim() === 'stop') server.close(() => process.exit(0)); });
