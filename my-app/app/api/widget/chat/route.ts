import { chat, validateChatInput } from '@/lib/chat-service';
import { limitWidget, verifyWidgetSession, widgetFailure, WidgetError } from '@/lib/widget-auth';
export const maxDuration = 60;
export async function POST(req: Request) {
  try {
    const context = await verifyWidgetSession(req);
    let input;
    try { input = validateChatInput(await req.json()); } catch (error) { throw new WidgetError(error instanceof Error ? error.message : 'Invalid message.'); }
    await limitWidget(req, context.company, 'chat', 30);
    const result = await chat(input, { tenantId: context.company, companyName: context.config.name, ...(context.customer ? { userId: context.customer.userId, name: context.customer.name, email: context.customer.email } : {}) });
    return Response.json({ ...result, requestId: input.requestId }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return widgetFailure(error); }
}
