'use client';

import { useState, useEffect } from 'react';
import WidgetSettings from './WidgetSettings';

export default function AdminSettingsPage() {
  const [allowedCollections, setAllowedCollections] = useState('');
  const [dataSchemaDescription, setDataSchemaDescription] = useState('');
  const [firebaseConfig, setFirebaseConfig] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/admin/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.databaseConfig) {
            setAllowedCollections(data.databaseConfig.allowedCollections || '');
            setDataSchemaDescription(data.databaseConfig.dataSchemaDescription || '');
            if (data.databaseConfig.firebaseConfig) {
              setFirebaseConfig(JSON.stringify(data.databaseConfig.firebaseConfig, null, 2));
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    let parsedConfig = null;
    if (firebaseConfig.trim()) {
      try {
        // Automatically add quotes to keys if the user pasted a raw JS object instead of strict JSON
        // Using a safer regex that only targets words followed by a colon and preceded by { or ,
        const sanitizedConfig = firebaseConfig
          .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
          .replace(/'/g, '"');
        parsedConfig = JSON.parse(sanitizedConfig);
      } catch (e) {
        console.error("JSON Parse error", e);
        setMessage('Invalid JSON in Firebase Config.');
        setSaving(false);
        return;
      }
    }

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          databaseConfig: {
            allowedCollections,
            dataSchemaDescription,
            firebaseConfig: parsedConfig
          }
        })
      });

      if (res.ok) {
        setMessage('Settings saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Failed to save settings.');
      }
    } catch (err) {
      setMessage('An error occurred.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-headline-lg font-bold text-on-surface">Company settings</h1>
        <p className="text-on-surface-variant font-body-md mt-1">Install your website assistant and connect your customer order database.</p>
      </div>

      <WidgetSettings />

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <span className="material-symbols-outlined animate-spin text-[32px] text-primary">progress_activity</span>
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-sm p-6">
          <h2 className="text-title-md font-semibold text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">database</span>
            Company Firebase connection
          </h2>
          <p className="text-sm text-on-surface-variant mb-6">
            The prototype reads customer-owned orders from demo_orders. It checks both company and customer identity.
          </p>

          <form onSubmit={handleSave} className="space-y-6">


            <div>
              <label className="block text-sm font-semibold text-on-surface mb-2">
                External Firebase Config (JSON)
              </label>
              <textarea
                value={firebaseConfig}
                onChange={e => setFirebaseConfig(e.target.value)}
                placeholder={'{\n  "apiKey": "...",\n  "projectId": "..."\n}'}
                className="w-full h-32 px-4 py-3 bg-surface border border-outline-variant/50 rounded-lg focus:border-primary focus:outline-none text-on-surface font-mono text-sm resize-none"
              />
              <p className="text-xs text-on-surface-variant mt-1">
                If provided, the Database Agent will connect to this external Firebase project instead of the platform database.
              </p>
            </div>



            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-primary text-on-primary rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    Save Configuration
                  </>
                )}
              </button>
              {message && (
                <span className={`text-sm ${message.includes('successfully') ? 'text-green-600' : 'text-error'}`}>
                  {message}
                </span>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
