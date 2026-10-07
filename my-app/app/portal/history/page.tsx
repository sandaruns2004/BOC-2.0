'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/components/AuthProvider';

interface HistoryItem {
  id: string;
  message: string;
  reply: string;
  createdAt: string;
}

export default function PortalHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch('/api/chat');
        if (res.ok) {
          const data = await res.json();
          setHistory(data.history || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  return (
    <div className="p-8 h-full flex flex-col bg-surface">
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div>
          <h1 className="text-headline-lg font-bold text-on-surface">Chat History</h1>
          <p className="text-on-surface-variant font-body-md mt-1">Review your past conversations with the AI.</p>
        </div>
      </div>

      <div className="flex-1 bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-sm flex flex-col overflow-y-auto">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <span className="material-symbols-outlined animate-spin text-[40px] text-primary">progress_activity</span>
          </div>
        ) : history.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-12">
            <div className="w-20 h-20 mx-auto rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant mb-6 border border-outline-variant/30">
              <span className="material-symbols-outlined text-[40px]">history_toggle_off</span>
            </div>
            <h2 className="text-headline-sm font-semibold text-on-surface mb-2">No Past Conversations</h2>
            <p className="text-on-surface-variant text-sm max-w-sm">
              You haven't started any chats yet. Head over to the New Chat tab to start interacting with the Agent.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/10">
            {history.map((item) => (
              <div key={item.id} className="p-6 hover:bg-surface-container-low/30 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-[18px]">person</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-on-surface text-sm">{user?.name || 'You'}</span>
                    <span className="text-[11px] text-on-surface-variant leading-tight">{user?.email || 'Unknown User'}</span>
                  </div>
                  <span className="text-xs text-on-surface-variant ml-auto">
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-on-surface-variant bg-surface px-4 py-3 rounded-lg border border-outline-variant/20 mb-4">{item.message}</p>
                
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary text-[18px]">smart_toy</span>
                  <span className="font-semibold text-on-surface text-sm">AI replied:</span>
                </div>
                <p className="text-sm text-on-surface bg-primary/5 px-4 py-3 rounded-lg border border-primary/10 whitespace-pre-wrap">{item.reply}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}