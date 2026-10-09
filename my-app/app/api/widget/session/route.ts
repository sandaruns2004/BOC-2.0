import { allowedWidget, companyForApiKey, issueWidgetSession, limitWidget, verifyWidgetSession, widgetFailure } from '@/lib/widget-auth';
// A client's backend calls this after verifying its own signed-in customer.
export async function POST(req: Request) {
  try {
    const company = await companyForApiKey(req);
    const body = await req.json();
    const context = await allowedWidget(company, body.origin);
    if (typeof body.customerId !== 'string') return Response.json({ error: 'A verified customerId is required.' }, { status: 400 });
    await limitWidget(req, company, 'customer-session', 30);
    return Response.json(await issueWidgetSession(company, context.origin, body.customerId), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return widgetFailure(error); }
}
export async function GET(req: Request) {
  try {
    const context = await verifyWidgetSession(req);
    return Response.json({ company: context.company, origin: context.origin, customer: context.customer ? { id: context.customer.userId, name: context.customer.name } : null }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return widgetFailure(error); }
}
