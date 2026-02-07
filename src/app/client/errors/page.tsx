'use client';

import { useEffect, useState } from 'react';

interface ErrorItem {
  id: string;
  type: string;
  message: string;
  context: string;
  timestamp: string;
  resolved: boolean;
}

export default function ClientErrorsPage() {
  const [errors, setErrors] = useState<ErrorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResolved, setShowResolved] = useState(false);

  useEffect(() => {
    async function fetchErrors() {
      try {
        const params = new URLSearchParams();
        params.set('includeResolved', showResolved.toString());
        const res = await fetch(`/api/client/errors?${params}`);
        if (res.ok) {
          const data = await res.json();
          setErrors(data.errors);
        }
      } catch (error) {
        console.error('Failed to fetch errors:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchErrors();
  }, [showResolved]);

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      CALL_FAILED: '📞',
      PAYMENT_FAILED: '💳',
      SMS_FAILED: '💬',
      WEBHOOK_FAILED: '🔗',
      SYSTEM_ERROR: '⚠️',
    };
    return icons[type] || '⚠️';
  };

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      CALL_FAILED: 'bg-purple-100 text-purple-800',
      PAYMENT_FAILED: 'bg-red-100 text-red-800',
      SMS_FAILED: 'bg-orange-100 text-orange-800',
      WEBHOOK_FAILED: 'bg-yellow-100 text-yellow-800',
      SYSTEM_ERROR: 'bg-slate-100 text-slate-800',
    };
    return styles[type] || 'bg-slate-100 text-slate-800';
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      CALL_FAILED: 'Call Failed',
      PAYMENT_FAILED: 'Payment Failed',
      SMS_FAILED: 'SMS Failed',
      WEBHOOK_FAILED: 'Sync Issue',
      SYSTEM_ERROR: 'System Error',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Errors</h2>
          <p className="text-slate-600 mt-1">
            View and track issues that need attention
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showResolved}
            onChange={(e) => setShowResolved(e.target.checked)}
            className="rounded border-slate-300"
          />
          <span className="text-slate-600">Show resolved</span>
        </label>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-500">Loading errors...</div>
        </div>
      ) : errors.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-slate-900 font-medium">No errors to report</p>
          <p className="text-sm text-slate-500 mt-1">
            Everything is running smoothly
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {errors.map((error) => (
            <div
              key={error.id}
              className={`bg-white rounded-lg border p-4 ${
                error.resolved ? 'border-slate-200 opacity-60' : 'border-red-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-xl">{getTypeIcon(error.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${getTypeBadge(error.type)}`}>
                      {getTypeLabel(error.type)}
                    </span>
                    {error.resolved && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-800">
                        Resolved
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-900">{error.message}</p>
                  <p className="text-xs text-slate-500 mt-1">{error.context}</p>
                  <p className="text-xs text-slate-400 mt-2">
                    {new Date(error.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Help Note */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <p className="text-sm text-slate-600">
          <strong>Need help?</strong> If you&apos;re seeing recurring errors, please{' '}
          <a href="mailto:support@invoicedue.io" className="text-blue-600 hover:underline">
            contact support
          </a>{' '}
          and we&apos;ll help resolve them.
        </p>
      </div>
    </div>
  );
}
