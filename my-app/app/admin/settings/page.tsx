'use client';

import { useState, useEffect } from 'react';
import WidgetSettings from './WidgetSettings';
import CustomerSyncSettings from './CustomerSyncSettings';
import { validateDatabaseConfig } from '@/lib/database-access';

export default function AdminSettingsPage() {
  const [allowedCollections, setAllowedCollections] = useState('demo_orders');
  const [ordersCollection, setOrdersCollection] = useState('demo_orders');
  const [dataSchemaDescription, setDataSchemaDescription] = useState('');
  const [firebaseConfig, setFirebaseConfig] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [loadFailed, setLoadFailed] = useState(false);
  const collectionNames = allowedCollections.split(/[,\n]/).map(name => name.trim()).filter(Boolean);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/admin/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.databaseConfig) {
            const allowed = data.databaseConfig.allowedCollections ?? 'demo_orders';
            setAllowedCollections(Array.isArray(allowed) ? allowed.join(', ') : allowed);
            setOrdersCollection(data.databaseConfig.ordersCollection || 'demo_orders');
            setDataSchemaDescription(data.databaseConfig.dataSchemaDescription || '');
            if (data.databaseConfig.firebaseConfig) {
              setFirebaseConfig(JSON.stringify(data.databaseConfig.firebaseConfig, null, 2));
            }
          }
        } else { throw new Error('Unable to load settings.'); }
      } catch (err) {
        console.error(err);
        setLoadFailed(true);
        setMessage('Unable to load settings. Reload this page before saving.');
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
        parsedConfig = JSON.parse(firebaseConfig);
      } catch (e) {
        console.error("JSON Parse error", e);
        setMessage('Invalid Firebase JSON. Use double quotes around keys and text values.');
        setSaving(false);
        return;
      }
    }

    let databaseConfig;
    try { databaseConfig = validateDatabaseConfig({ allowedCollections, ordersCollection, dataSchemaDescription, firebaseConfig: parsedConfig }); }
    catch (error) {
      setMessage(error instanceof Error ? error.message : 'Invalid database configuration.');
      setSaving(false);
      return;
    }
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ databaseConfig })
      });

      if (res.ok) {
        setAllowedCollections(databaseConfig.allowedCollections);
        setDataSchemaDescription(databaseConfig.dataSchemaDescription);
        setFirebaseConfig(databaseConfig.firebaseConfig ? JSON.stringify(databaseConfig.firebaseConfig, null, 2) : '');
        setMessage('Settings saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        const data = await res.json();
        setMessage(data.error || 'Failed to save settings.');
      }
    } catch {
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
            Connect your company Firestore database and choose which collections the system may read. Order lookups check both company and customer identity.
          </p>

          <form onSubmit={handleSave} className="space-y-6">
            <fieldset disabled={saving || loadFailed} className="space-y-6 disabled:opacity-60">
            <div>
              <label htmlFor="firebase-config" className="block text-sm font-semibold text-on-surface mb-2">
                External Firebase Config (JSON)
              </label>
              <textarea
                id="firebase-config"
                value={firebaseConfig}
                onChange={e => setFirebaseConfig(e.target.value)}
                placeholder={'{\n  "apiKey": "...",\n  "projectId": "..."\n}'}
                className="w-full h-32 px-4 py-3 bg-surface border border-outline-variant/50 rounded-lg focus:border-primary focus:outline-none text-on-surface font-mono text-sm resize-none"
              />
              <p className="text-xs text-on-surface-variant mt-1">
                If provided, the Database Agent will connect to this external Firebase project instead of the platform database.
              </p>
            </div>
            <div>
              <label htmlFor="allowed-collections" className="block text-sm font-semibold text-on-surface mb-2">Allowed collections</label>
              <textarea id="allowed-collections" value={allowedCollections} onChange={e => setAllowedCollections(e.target.value)} placeholder={'demo_orders, customers'} className="w-full h-24 px-4 py-3 bg-surface border border-outline-variant/50 rounded-lg focus:border-primary focus:outline-none text-on-surface font-mono text-sm" aria-describedby="collection-access-help" />
              <p id="collection-access-help" className="text-xs text-on-surface-variant mt-1">Enter exact top-level collection names separated by commas or new lines. Order lookups and customer sync cannot read unlisted collections. An empty list blocks all company collection reads. Include the source collection configured in Customer sync below.</p>
              <div className="mt-3 rounded-lg bg-surface p-3 text-sm" aria-live="polite">
                <p className="font-semibold text-on-surface">Allowed: {collectionNames.length ? [...new Set(collectionNames)].join(', ') : 'None'}</p>
                <p className="text-on-surface-variant mt-1">Blocked: every other company collection. This controls company data reads; platform account records and action logs are managed separately.</p>
              </div>
            </div>
            <div>
              <label htmlFor="orders-collection" className="block text-sm font-semibold text-on-surface mb-2">Customer order collection</label>
              <input id="orders-collection" value={ordersCollection} onChange={e => setOrdersCollection(e.target.value)} required pattern="[a-zA-Z0-9_-]{1,100}" className="w-full px-4 py-3 bg-surface border border-outline-variant/50 rounded-lg focus:border-primary focus:outline-none text-on-surface font-mono text-sm" />
              <p className="text-xs text-on-surface-variant mt-1">Must appear in Allowed collections to enable order lookups. Records need tenantId and customerId fields, plus orderId, productName, shippingStatus, trackingNumber, estimatedDelivery, totalAmount and currency. Other allowed collections are available only through supported integrations such as customer sync.</p>
              {!collectionNames.includes(ordersCollection) && <p className="text-xs text-error mt-2">Order lookups are blocked because this collection is not in the allowed list.</p>}
            </div>
            <div>
              <label htmlFor="collection-schema" className="block text-sm font-semibold text-on-surface mb-2">Collection and field notes (optional)</label>
              <textarea id="collection-schema" value={dataSchemaDescription} onChange={e => setDataSchemaDescription(e.target.value)} maxLength={5000} placeholder="Describe each collection, its purpose and available fields." className="w-full h-24 px-4 py-3 bg-surface border border-outline-variant/50 rounded-lg focus:border-primary focus:outline-none text-on-surface text-sm" />
              <p className="text-xs text-on-surface-variant mt-1">Documentation for your admins. These notes do not grant access or change field mappings.</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={saving || loadFailed}
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
                <span role="status" className={`text-sm ${message.includes('successfully') ? 'text-green-600' : 'text-error'}`}>
                  {message}
                </span>
              )}
            </div>
            </fieldset>
          </form>
        </div>
      )}
      <CustomerSyncSettings />
    </div>
  );
}
