'use client';

export default function AdminReports() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-headline-lg font-bold text-on-surface">Export Reports</h1>
          <p className="text-on-surface-variant font-body-md mt-1">Generate compliance and usage reports for your tenant.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">receipt_long</span>
            </div>
            <a 
              href="/api/admin/reports/billing" 
              download 
              className="text-primary font-medium text-sm hover:underline cursor-pointer"
            >
              Generate CSV
            </a>
          </div>
          <h3 className="font-semibold text-on-surface text-lg">Billing & Token Usage</h3>
          <p className="text-on-surface-variant text-sm mt-1">Detailed breakdown of tokens consumed by the Gemini 1.5 Pro model.</p>
        </div>
        
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-sm p-6 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-lg bg-tertiary/10 text-tertiary flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">gavel</span>
            </div>
            <a 
              href="/api/admin/reports/audit" 
              download 
              className="text-primary font-medium text-sm hover:underline cursor-pointer"
            >
              Generate CSV
            </a>
          </div>
          <h3 className="font-semibold text-on-surface text-lg">Compliance Audit Trail</h3>
          <p className="text-on-surface-variant text-sm mt-1">Full log of AI actions and human escalations for regulatory review.</p>
        </div>
      </div>
    </div>
  );
}