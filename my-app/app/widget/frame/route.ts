import { allowedWidget, widgetFailure } from '@/lib/widget-auth';
export const dynamic = 'force-dynamic';
function escapeHtml(value: string) { return value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!); }
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const context = await allowedWidget(url.searchParams.get('company'), url.searchParams.get('origin'));
    const config = JSON.stringify({ company: context.company, origin: context.origin, name: context.config.name, color: context.config.color }).replace(/</g, '\\u003c');
    return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(context.config.name)}</title><link rel="stylesheet" href="/widget/frame.css"><script id="widget-config" type="application/json">${config}</script><script src="/widget/frame.js" defer></script></head><body>
      <section class="widget-shell" aria-label="${escapeHtml(context.config.name)}">
        <header><span class="mark" aria-hidden="true">${escapeHtml(context.config.name.charAt(0))}</span><div><h1>${escapeHtml(context.config.name)}</h1><p id="identity">Connecting…</p></div><button id="close" aria-label="Close chat">×</button></header>
        <main id="conversation" role="log" aria-live="polite" aria-relevant="additions text"><div class="welcome"><span>YOUR PERSONAL SUPPORT</span><h2>A little help.<br>A lot less waiting.</h2><p>Ask about our policies, check an order, or request an email update.</p></div></main>
        <div id="review" role="status" hidden></div><p id="status" role="status">Opening your assistant…</p>
        <div id="suggestions"><button disabled>What is your return policy?</button><button disabled>What is my order status?</button><button disabled>Email me my shipping update</button><button disabled>I want a refund of LKR 75,000</button></div>
        <form id="compose"><label class="sr-only" for="message">Message</label><input id="message" placeholder="Ask us anything…" maxlength="4000" autocomplete="off" disabled><button id="send" aria-label="Send message" disabled>↑</button></form>
        <footer>Powered by AgentForge</footer>
      </section></body></html>`, { headers: {
        'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store',
        'Content-Security-Policy': `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; frame-ancestors ${context.config.allowedOrigins.join(' ')}; base-uri 'none'; form-action 'none'`,
        'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff',
      } });
  } catch (error) { return widgetFailure(error); }
}
