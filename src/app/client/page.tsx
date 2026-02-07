'use client';

import { useEffect, useState } from 'react';

interface OverviewStats {
  invoices: {
    total: number;
    pending: number;
    paid: number;
    overdue: number;
    totalAmount: number;
    paidAmount: number;
  };
  calls: {
    total: number;
    thisWeek: number;
    answered: number;
    voicemail: number;
  };
  payments: {
    total: number;
    thisMonth: number;
    totalCollected: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>;
}

export default function ClientOverviewPage() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/client/overview');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch overview:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading overview...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Unable to load overview data.</p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Overview</h2>
        <p className="text-slate-600 mt-1">
          Your accounts receivable at a glance
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Outstanding */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Outstanding</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">
            {formatCurrency(stats.invoices.totalAmount - stats.invoices.paidAmount)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {stats.invoices.pending} pending invoices
          </p>
        </div>

        {/* Collected */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Collected</p>
          <p className="text-2xl font-semibold text-green-600 mt-1">
            {formatCurrency(stats.invoices.paidAmount)}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {stats.invoices.paid} invoices paid
          </p>
        </div>

        {/* Calls This Week */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Calls This Week</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">
            {stats.calls.thisWeek}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {stats.calls.answered} answered, {stats.calls.voicemail} voicemail
          </p>
        </div>

        {/* Payments This Month */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <p className="text-sm text-slate-500">Payments This Month</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">
            {stats.payments.thisMonth}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {formatCurrency(stats.payments.totalCollected)} collected
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="px-4 py-3 border-b border-slate-200">
          <h3 className="font-medium text-slate-900">Recent Activity</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {stats.recentActivity.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-500">
              No recent activity
            </div>
          ) : (
            stats.recentActivity.map((activity) => (
              <div key={activity.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-900">{activity.description}</p>
                  <p className="text-xs text-slate-400">{activity.type}</p>
                </div>
                <p className="text-xs text-slate-400">
                  {new Date(activity.timestamp).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
