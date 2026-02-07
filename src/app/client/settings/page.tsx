'use client';

import { useEffect, useState } from 'react';

interface ClientSettings {
  companyName: string;
  email: string;
  timezone: string;
  paymentLink: string | null;
  policy: {
    callWindowStart: string;
    callWindowEnd: string;
    callDays: string[];
    maxAttempts: number;
  } | null;
}

export default function ClientSettingsPage() {
  const [settings, setSettings] = useState<ClientSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/client/settings');
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const dayLabels: Record<string, string> = {
    monday: 'Mon',
    tuesday: 'Tue',
    wednesday: 'Wed',
    thursday: 'Thu',
    friday: 'Fri',
    saturday: 'Sat',
    sunday: 'Sun',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading settings...</div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Unable to load settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Settings</h2>
        <p className="text-slate-600 mt-1">
          View your account configuration
        </p>
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="px-4 py-3 border-b border-slate-200">
          <h3 className="font-medium text-slate-900">Account Information</h3>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <p className="text-sm text-slate-500">Company Name</p>
            <p className="text-sm font-medium text-slate-900">{settings.companyName}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Email</p>
            <p className="text-sm font-medium text-slate-900">{settings.email}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Timezone</p>
            <p className="text-sm font-medium text-slate-900">{settings.timezone}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Payment Link</p>
            {settings.paymentLink ? (
              <p className="text-sm font-medium text-blue-600 break-all">{settings.paymentLink}</p>
            ) : (
              <p className="text-sm text-slate-400 italic">Not configured</p>
            )}
          </div>
        </div>
      </div>

      {/* Follow-up Policy */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="px-4 py-3 border-b border-slate-200">
          <h3 className="font-medium text-slate-900">Follow-up Policy</h3>
        </div>
        {settings.policy ? (
          <div className="p-4 space-y-4">
            <div>
              <p className="text-sm text-slate-500">Call Window</p>
              <p className="text-sm font-medium text-slate-900">
                {settings.policy.callWindowStart} - {settings.policy.callWindowEnd}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Active Days</p>
              <div className="flex gap-1 mt-1">
                {Object.entries(dayLabels).map(([day, label]) => (
                  <span
                    key={day}
                    className={`px-2 py-1 text-xs rounded ${
                      settings.policy?.callDays.includes(day)
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-500">Maximum Attempts</p>
              <p className="text-sm font-medium text-slate-900">
                {settings.policy.maxAttempts} calls per invoice
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <p className="text-sm text-slate-400 italic">No policy configured</p>
          </div>
        )}
      </div>

      {/* Edit Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Need to make changes?</strong> Visit the{' '}
          <a href="/policy" className="underline">Policy Settings</a> or{' '}
          <a href="/settings" className="underline">Account Settings</a> pages 
          in your main dashboard to update your configuration.
        </p>
      </div>
    </div>
  );
}
