import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET || 'super-secret-key-for-agentforge-dev-only';
const key = new TextEncoder().encode(secretKey);

export async function middleware(req: NextRequest) {
  const sessionCookie = req.cookies.get('session')?.value;
  const url = req.nextUrl.clone();
  
  let session: any = null;
  if (sessionCookie) {
    try {
      const { payload } = await jwtVerify(sessionCookie, key, { algorithms: ['HS256'] });
      session = payload;
    } catch (e) {
      session = null;
    }
  }

  // Protect /ops
  if (req.nextUrl.pathname.startsWith('/ops') && req.nextUrl.pathname !== '/ops/login') {
    if (!session || session.role !== 'ops') {
      url.pathname = '/ops/login';
      return NextResponse.redirect(url);
    }
  }

  // Protect /admin
  if (req.nextUrl.pathname.startsWith('/admin') && req.nextUrl.pathname !== '/admin/login') {
    if (!session || session.role !== 'admin') {
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }
  }

  // Protect /portal (chat/history)
  if (req.nextUrl.pathname.startsWith('/portal/chat') || req.nextUrl.pathname.startsWith('/portal/history')) {
    if (!session || session.role !== 'user') {
      url.pathname = '/portal/login';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/ops/:path*', '/admin/:path*', '/portal/:path*'],
};
