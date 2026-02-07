'use client';

import { useEffect, useState } from 'react';

interface HealthMetrics {
  callSuccess: {
    total: number;
    successful: number;
    failed: number;
    rate: number;
  };
  paymentSuccess: {
    total: number;
    successful: number;
    failed: number;
    rate: number;
  };
  smsDelivery: {
    total: number;
    delivered: number;
    failed: number;
    rate: number;
  };
  lastActivity: string | null;
  systemStatus: 'healthy' | 'degraded' | 'down';
}

export default function ClientSystemHealthPage() {
  const [health, setHealth] = useState<HealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHealth() {
      try {
        const res = await fetch('/api/client/system-health');
        if (res.ok) {
          const data = await res.json();
          setHealth(data);
        }
      } catch (error) {
        console.error('Failed to fetch health:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchHealth();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'down':
        return 'bg-red-500';
      default:
        return 'bg-slate-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'All Systems Operational';
      case 'degraded':
        return 'Partial Outage';
      case 'down':
        return 'Service Disruption';
      default:
        return 'Unknown';
    }
  };

  const getRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading system health...</div>
      </div>
    );
  }

  if (!health) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Unable to load system health data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">System Health</h2>
        <p className="text-slate-600 mt-1">
          Monitor the health of your follow-up system
        </p>
      </div>

      {/* Overall Status */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${getStatusColor(health.systemStatus)}`} />
          <div>
            <p className="font-medium text-slate-900">
              {getStatusLabel(health.systemStatus)}
            </p>
            {health.lastActivity && (
              <p className="text-sm text-slate-500">
                Last activity: {new Date(health.lastActivity).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Success Rates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Call Success */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-500">Call Success Rate</p>
            <span className="text-xl">📞</span>
          </div>
          <p className={`text-3xl font-semibold ${getRateColor(health.callSuccess.rate)}`}>
            {health.callSuccess.rate.toFixed(1)}%
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {health.callSuccess.successful} of {health.callSuccess.total} calls successful
          </p>
          <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${health.callSuccess.rate}%` }}
            />
          </div>
        </div>

        {/* Payment Success */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-500">Payment Success Rate</p>
            <span className="text-xl">💳</span>
          </div>
          <p className={`text-3xl font-semibold ${getRateColor(health.paymentSuccess.rate)}`}>
            {health.paymentSuccess.rate.toFixed(1)}%
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {health.paymentSuccess.successful} of {health.paymentSuccess.total} payments completed
          </p>
          <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${health.paymentSuccess.rate}%` }}
            />
          </div>
        </div>

        {/* SMS Delivery */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-500">SMS Delivery Rate</p>
            <span className="text-xl">💬</span>
          </div>
          <p className={`text-3xl font-semibold ${getRateColor(health.smsDelivery.rate)}`}>
            {health.smsDelivery.rate.toFixed(1)}%
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {health.smsDelivery.delivered} of {health.smsDelivery.total} messages delivered
          </p>
          <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${health.smsDelivery.rate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Info Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Success rates are calculated based on your account&apos;s activity 
          over the past 30 days. For detailed failure information, visit the Errors page.
        </p>
      </div>
    </div>
  );
}
