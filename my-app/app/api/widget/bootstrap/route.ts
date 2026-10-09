import { allowedWidget, issueWidgetSession, limitWidget, widgetFailure } from '@/lib/widget-auth';
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const context = await allowedWidget(body.company, body.origin);
    await limitWidget(req, context.company, 'bootstrap', 20);
    return Response.json(await issueWidgetSession(context.company, context.origin), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return widgetFailure(error); }
}
