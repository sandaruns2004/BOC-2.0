import { doc, getDocFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { verifyWidgetSession, widgetFailure, WidgetError } from '@/lib/widget-auth';
export async function GET(req: Request) {
  try {
    const { company, customer } = await verifyWidgetSession(req);
    if (!customer) throw new WidgetError('Sign in to view your review request.', 401);
    const id = new URL(req.url).searchParams.get('id');
    if (!id || !/^[a-zA-Z0-9_-]{1,200}$/.test(id)) throw new WidgetError('Invalid review request.');
    const record = await getDocFromServer(doc(db, 'escalations', id));
    const data = record.data();
    if (!data || data.tenantId !== company || data.userId !== customer.userId) throw new WidgetError('Review request not found.', 404);
    return Response.json({ status: data.status, decisionNote: data.decisionNote || '' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return widgetFailure(error); }
}
