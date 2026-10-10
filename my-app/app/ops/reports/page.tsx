'use client';

export default function OpsReports() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-headline-lg font-bold text-on-surface">Platform Reports</h1>
          <p className="text-on-surface-variant font-body-md mt-1">Aggregated usage metrics across all isolated tenants.</p>
        </div>
        <button className="px-4 py-2 border border-outline-variant/30 text-on-surface rounded-lg font-medium hover:bg-surface-container-low transition-colors flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">download</span>
          Export CSV
        </button>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-sm p-6 mb-8">
        <h2 className="text-headline-sm font-semibold text-on-surface mb-6">Monthly Cost Projection</h2>
        <div className="h-64 flex items-end gap-2 border-b border-outline-variant/20 pb-4 relative">
          {/* Y Axis */}
          <div className="absolute left-0 top-0 bottom-4 w-12 flex flex-col justify-between text-[10px] text-on-surface-variant font-code-base border-r border-outline-variant/20 pr-2 text-right">
            <span>$500</span>
            <span>$375</span>
            <span>$250</span>
            <span>$125</span>
            <span>$0</span>
          </div>
          
          {/* Chart Bars */}
          <div className="flex-1 flex items-end justify-around pl-16">
            <div className="w-12 h-[20%] bg-surface-container-high rounded-t-md hover:bg-primary/50 transition-colors relative group">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-container-highest px-2 py-1 rounded text-[10px] font-code-base opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">$102</div>
              <div className="absolute -bottom-6 w-full text-center text-[11px] text-on-surface-variant">Jun</div>
            </div>
            <div className="w-12 h-[45%] bg-surface-container-high rounded-t-md hover:bg-primary/50 transition-colors relative group">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-container-highest px-2 py-1 rounded text-[10px] font-code-base opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">$245</div>
              <div className="absolute -bottom-6 w-full text-center text-[11px] text-on-surface-variant">Jul</div>
            </div>
            <div className="w-12 h-[35%] bg-surface-container-high rounded-t-md hover:bg-primary/50 transition-colors relative group">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-container-highest px-2 py-1 rounded text-[10px] font-code-base opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">$180</div>
              <div className="absolute -bottom-6 w-full text-center text-[11px] text-on-surface-variant">Aug</div>
            </div>
            <div className="w-12 h-[75%] bg-primary rounded-t-md relative group">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-container-highest px-2 py-1 rounded text-[10px] font-code-base opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">$380</div>
              <div className="absolute -bottom-6 w-full text-center text-[11px] text-primary font-bold">Sep</div>
            </div>
            <div className="w-12 h-[15%] bg-surface-container-low rounded-t-md border border-dashed border-outline-variant relative group">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-container-highest px-2 py-1 rounded text-[10px] font-code-base opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">$499</div>
              <div className="absolute -bottom-6 w-full text-center text-[11px] text-on-surface-variant">Oct (Est)</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-sm p-6">
          <h2 className="text-headline-sm font-semibold text-on-surface mb-4">Resource Utilization</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-on-surface-variant">LLM Token Limits</span>
                <span className="font-code-base font-medium">45%</span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full w-[45%]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-on-surface-variant">Pinecone Vector Storage</span>
                <span className="font-code-base font-medium">12%</span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div className="bg-tertiary h-full w-[12%]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-on-surface-variant">Cloud Run Concurrency</span>
                <span className="font-code-base font-medium">8%</span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                <div className="bg-secondary h-full w-[8%]"></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-sm p-6">
          <h2 className="text-headline-sm font-semibold text-on-surface mb-4">Escalation Rates</h2>
          <div className="flex items-center justify-center h-32 text-center text-on-surface-variant">
            <div>
              <div className="text-headline-lg font-bold text-on-surface">1.2%</div>
              <div className="text-sm">Of all agent actions require human review</div>
              <div className="text-xs text-primary mt-2">Well within 5% target SLA</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}