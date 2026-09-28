import { NextResponse } from 'next/server';

export async function GET() {
  // Mock health data for the 5-layer architecture
  const layerHealth = {
    edge: { status: 'healthy', latency: '14ms', label: 'Apigee Gateway / Cloud Armor' },
    runtime: { status: 'healthy', latency: '4ms', label: 'Cloud Run / Memorystore' },
    cognitive: { status: 'healthy', latency: '380ms', label: 'Vertex AI / Vector Search' },
    sandbox: { status: 'healthy', latency: '85ms', label: 'gVisor Execution Sandbox' },
    audit: { status: 'healthy', latency: '< 1ms', label: 'BigQuery / Cloud Trace' },
    overall: { status: 'healthy', activeRegion: 'us-central1' }
  };

  await new Promise(resolve => setTimeout(resolve, 300));
  return NextResponse.json(layerHealth);
}
