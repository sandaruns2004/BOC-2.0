'use client';

export default function OpsSystem() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-headline-lg font-bold text-on-surface">System Health</h1>
          <p className="text-on-surface-variant font-body-md mt-1">Infrastructure status and active incidents.</p>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-sm overflow-hidden mb-8">
        <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-low">
          <h2 className="text-headline-sm font-semibold text-on-surface">Service Status</h2>
          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[12px] font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            All Systems Operational
          </span>
        </div>
        <div className="divide-y divide-outline-variant/20">
          {[
            { name: 'API Gateway Ingress', status: 'Operational', latency: '4ms', uptime: '99.99%' },
            { name: 'Cloud Run Orchestrator', status: 'Operational', latency: '12ms', uptime: '100%' },
            { name: 'LLM Provider (OpenAI / Gemini)', status: 'Operational', latency: '340ms', uptime: '99.95%' },
            { name: 'Pinecone Vector DB', status: 'Operational', latency: '38ms', uptime: '100%' },
            { name: 'Firestore Config DB', status: 'Operational', latency: '8ms', uptime: '99.99%' },
            { name: 'AWS DynamoDB Audit Sink', status: 'Operational', latency: 'async', uptime: '100%' },
          ].map((service, i) => (
            <div key={i} className="p-4 flex items-center justify-between hover:bg-surface-container-low/50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                <span className="font-medium text-on-surface text-[14px]">{service.name}</span>
              </div>
              <div className="flex items-center gap-6 text-[12px] font-code-base text-on-surface-variant">
                <span>Latency: {service.latency}</span>
                <span>Uptime: {service.uptime}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}