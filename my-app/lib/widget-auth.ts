import { SignJWT, jwtVerify } from 'jose';
import { createHash, randomUUID } from 'node:crypto';
import { collection, doc, getDocFromServer, getDocsFromServer, query, runTransaction, where } from 'firebase/firestore';
import { db } from './firebase';
import { getWidgetConfig, siteOrigin, validCompany } from './widget-config';

export class WidgetError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export function widgetFailure(error: unknown) {
  if (error instanceof WidgetError) return Response.json({ error: error.message }, { status: error.status, headers: { 'Cache-Control': 'no-store' } });
  console.error('Widget request failed:', error);
  return Response.json({ error: 'Unable to connect to the assistant. Please try again.' }, { status: 503 });
}
function signingKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') throw new WidgetError('Widget sessions are not configured on the server.', 503);
  return new TextEncoder().encode(secret || 'super-secret-key-for-agentforge-dev-only');
}
export async function allowedWidget(company: unknown, origin: unknown) {
  if (!validCompany(company)) throw new WidgetError('Unknown company.');
  let normalized: string;
  try { normalized = siteOrigin(origin); } catch { throw new WidgetError('Invalid website origin.'); }
  const config = await getWidgetConfig(company);
  if (!config.enabled) throw new WidgetError('This company has disabled its assistant.', 403);
  if (!config.allowedOrigins.includes(normalized)) throw new WidgetError('This website is not enabled for this assistant.', 403);
  return { company, origin: normalized, config };
}
export async function companyForApiKey(req: Request) {
  const bearer = req.headers.get('Authorization');
  if (!bearer?.startsWith('Bearer ')) throw new WidgetError('A server API key is required.', 401);
  const key = bearer.slice(7);
  if (!key || key.length > 200) throw new WidgetError('Invalid API key.', 401);
  const keys = await getDocsFromServer(query(collection(db, 'api_keys'), where('key', '==', key)));
  const record = keys.docs[0]?.data();
  if (record?.isActive !== true || !validCompany(record.tenantId)) throw new WidgetError('Invalid or inactive API key.', 401);
  return record.tenantId;
}
export async function widgetCustomer(company: string, customerId: unknown) {
  if (!validCompany(customerId)) throw new WidgetError('Invalid customer identity.');
  const user = await getDocFromServer(doc(db, 'users', customerId));
  const data = user.data();
  if (!data || data.tenantId !== company || data.isActive !== true) throw new WidgetError('Customer is not authorized for this company.', 403);
  return { userId: user.id, name: String(data.name || 'Customer'), email: typeof data.email === 'string' ? data.email : undefined, isDemo: data.isDemo === true };
}
export async function issueWidgetSession(company: string, origin: string, customerId?: string) {
  const { config } = await allowedWidget(company, origin);
  const customer = customerId ? await widgetCustomer(company, customerId) : undefined;
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  const token = await new SignJWT({ company, origin, ...(customer ? { customerId: customer.userId } : {}) })
    .setProtectedHeader({ alg: 'HS256' }).setIssuer('agentforge-widget').setAudience('agentforge-widget')
    .setJti(randomUUID()).setIssuedAt().setExpirationTime('30m').sign(signingKey());
  return { token, expiresAt, customer: customer ? { id: customer.userId, name: customer.name } : null, name: config.name };
}
export async function verifyWidgetSession(req: Request) {
  const bearer = req.headers.get('Authorization');
  if (!bearer?.startsWith('Bearer ')) throw new WidgetError('Open the assistant to start a session.', 401);
  let payload;
  try { ({ payload } = await jwtVerify(bearer.slice(7), signingKey(), { algorithms: ['HS256'], issuer: 'agentforge-widget', audience: 'agentforge-widget' })); }
  catch (error) { if (error instanceof WidgetError) throw error; throw new WidgetError('Your chat session expired. Close and reopen the assistant.', 401); }
  if (typeof payload.jti !== 'string') throw new WidgetError('Invalid chat session.', 401);
  const context = await allowedWidget(payload.company, payload.origin);
  const customer = payload.customerId !== undefined ? await widgetCustomer(context.company, payload.customerId) : undefined;
  return { ...context, customer, sessionId: payload.jti };
}
export async function limitWidget(req: Request, company: string, operation: string, maximum: number) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';
  const id = createHash('sha256').update(`${company}:${operation}:${ip}`).digest('hex');
  const ref = doc(db, 'widget_limits', id);
  const now = Date.now();
  await runTransaction(db, async transaction => {
    const previous = (await transaction.get(ref)).data();
    const active = previous && Number(previous.resetAt) > now;
    const count = active ? Number(previous.count || 0) : 0;
    if (count >= maximum) throw new WidgetError('Too many requests. Please wait a minute and try again.', 429);
    transaction.set(ref, { count: count + 1, resetAt: active ? previous.resetAt : now + 60000 });
  });
}
