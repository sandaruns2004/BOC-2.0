import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secretKey = process.env.JWT_SECRET || 'super-secret-key-for-agentforge-dev-only';
const key = new TextEncoder().encode(secretKey);

export type Role = 'ops' | 'admin' | 'user';

export interface SessionPayload {
  userId: string;
  role: Role;
  tenantId?: string;
  email?: string;
  name?: string;
  expires: string;
}

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key);
}

export async function decrypt(input: string): Promise<SessionPayload> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  });
  return payload as unknown as SessionPayload;
}

export async function createSession(data: { userId: string, role: Role, tenantId?: string, email?: string, name?: string }) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const session = await encrypt({ ...data, expires: expires.toISOString() });

  const cookieStore = await cookies();
  cookieStore.set('session', session, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return null;
  try {
    return await decrypt(session);
  } catch (error) {
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.set('session', '', { expires: new Date(0) });
}
