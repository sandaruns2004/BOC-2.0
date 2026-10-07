'use client';

export default function AdminEscalations() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-headline-lg font-bold text-on-surface">Escalations Queue</h1>
          <p className="text-on-surface-variant font-body-md mt-1">Human-in-the-loop review for agent actions lacking confidence.</p>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-sm p-12 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant mb-6 border border-outline-variant/30">
          <span className="material-symbols-outlined text-[40px]">task_alt</span>
        </div>
        <h2 className="text-headline-sm font-semibold text-on-surface mb-2">No Active Escalations</h2>
        <p className="text-on-surface-variant text-sm max-w-md">
          The AI agent is currently handling all queries within confidence thresholds. Any action requiring human review will appear here.
        </p>
      </div>
    </div>
  );
}