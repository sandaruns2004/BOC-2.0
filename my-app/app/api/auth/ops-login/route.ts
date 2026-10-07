import { NextResponse } from 'next/server';
import { createSession } from '@/lib/session';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const opsEmail = process.env.PLATFORM_OPS_EMAIL || 'admin@agentforge.ai';
  const opsPass = process.env.PLATFORM_OPS_PASSWORD || 'AgentForge2026!';

  if (email === opsEmail && password === opsPass) {
    await createSession({ userId: 'ops-admin', role: 'ops', email, name: 'Platform Operator' });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
}