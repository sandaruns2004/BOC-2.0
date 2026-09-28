import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Mock data for the fleet dashboard
  const fleetData = {
    agents: 42,
    p50Latency: 542,
    guardrailIntercepts: 0.02,
    runRate: 158.41,
    recentDecisions: [
      {
        id: '1',
        title: 'Order Refund ($42.50) · 312ms',
        tag: 'Auto-Approved via Guardrail Rule #12',
        type: 'success',
        time: '4s ago'
      },
      {
        id: '2',
        title: 'CVE Vulnerability Enrichment · 640ms',
        tag: 'Triaged to SecOps P2 Queue',
        type: 'primary',
        time: '19s ago'
      },
      {
        id: '3',
        title: 'Logistics Route Recalculation · 185ms',
        tag: 'Completed with zero deviation',
        type: 'success',
        time: '42s ago'
      }
    ]
  };

  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 800));

  return NextResponse.json(fleetData);
}
