import { getSession } from '@/lib/session';
import { demoCompanies } from '@/lib/demo-config';
import { allowedWidget, issueWidgetSession, limitWidget, widgetCustomer, widgetFailure, WidgetError } from '@/lib/widget-auth';
export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Only Nova's fictional storefront gets a prepared demo customer.
    const company = demoCompanies.nova.tenantId;
    if (body.company !== company) throw new WidgetError('Unknown demo company.', 403);
    const requestOrigin = req.headers.get('Origin');
    if (requestOrigin && requestOrigin !== new URL(req.url).origin) throw new WidgetError('Use the Nova storefront to start this demo.', 403);
    const context = await allowedWidget(company, body.origin);
    const session = await getSession();
    const id = session?.role === 'user' && session.tenantId === company ? session.userId : 'nova_alice';
    const customer = await widgetCustomer(company, id);
    if (!customer.isDemo || !demoCompanies.nova.customers.some(c => c.id === id)) throw new WidgetError('Select a prepared Nova demo customer.', 403);
    await limitWidget(req, company, 'demo-session', 30);
    return Response.json(await issueWidgetSession(company, context.origin, id), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return widgetFailure(error); }
}
