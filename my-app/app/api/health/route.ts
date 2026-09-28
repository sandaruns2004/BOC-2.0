// ============================================================
// AgentForge — Health Check API
// GET /api/health
// Returns a simple 200 OK with system status.
// Used by Cloud Monitoring uptime checks.
// ============================================================

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'agentforge-mvp',
    timestamp: new Date().toISOString(),
    version: '1.0.0-mvp',
  });
}
