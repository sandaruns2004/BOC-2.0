'use client';

import { useState } from 'react';

export default function KnowledgeBaseStudio() {
  const [tenantId, setTenantId] = useState('acme_corp');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setStatus('idle');

    try {
      const res = await fetch('/api/kb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, title, content }),
      });
      
      if (res.ok) {
        setStatus('success');
        setTitle('');
        setContent('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="w-full min-h-screen pt-16 bg-surface p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Knowledge Base Injection</h1>
        <p className="text-on-surface-variant mb-8">Upload company-specific documents to the Vector Database for RAG.</p>

        <form onSubmit={handleUpload} className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/30 flex flex-col gap-6">
          
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-sm">Select Tenant</label>
            <select 
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              className="p-3 rounded-lg border border-outline-variant/50 bg-transparent focus:ring-2 focus:ring-primary outline-none"
            >
              <option value="acme_corp">Acme Corp</option>
              <option value="fintech_global">Fintech Global AG</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-semibold text-sm">Document Title</label>
            <input 
              required
              type="text" 
              placeholder="e.g. Return Policy 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="p-3 rounded-lg border border-outline-variant/50 bg-transparent focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-semibold text-sm">Document Content (Text)</label>
            <textarea 
              required
              rows={8}
              placeholder="Paste the raw text of the document here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="p-3 rounded-lg border border-outline-variant/50 bg-transparent focus:ring-2 focus:ring-primary outline-none resize-y"
            />
          </div>

          <button 
            type="submit" 
            disabled={uploading}
            className="mt-2 bg-primary text-on-primary py-3 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                Vectorizing & Uploading...
              </>
            ) : status === 'success' ? (
              <>
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
                Uploaded to Pinecone
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">upload_file</span>
                Upload to Vector Database
              </>
            )}
          </button>
          
          {status === 'error' && (
            <p className="text-error text-sm text-center">Failed to upload document. Check console.</p>
          )}
        </form>
      </div>
    </main>
  );
}
