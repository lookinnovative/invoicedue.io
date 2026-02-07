'use client';

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface SystemHealth {
  failedCallsLast24h: number;
  pendingWebhooks: number;
  errorCount: number;
  activeClients: number;
  pendingInvoices: number;
  totalInvoices: number;
  totalCalls: number;
}

interface CallMetrics {
  callsPerDay: { date: string; count: number }[];
  outcomeDistribution: { outcome: string; count: number }[];
  failureRate: number;
  totalCalls: number;
}

interface PaymentMetrics {
  conversionRate: number;
  revenueThisWeek: number;
  pendingPayments: number;
  completedPayments: number;
}

interface Failure {
  id: string;
  client: string;
  invoice: string;
  phoneNumber: string;
  outcome: string;
  createdAt: string;
}

const COLORS = ['#22c55e', '#a855f7', '#f59e0b', '#f59e0b', '#ef4444', '#ef4444'];
const OUTCOME_COLORS: Record<string, string> = {
  ANSWERED: '#22c55e',
  VOICEMAIL: '#a855f7',
  NO_ANSWER: '#f59e0b',
  BUSY: '#eab308',
  WRONG_NUMBER: '#ef4444',
  DISCONNECTED: '#dc2626',
  PENDING: '#64748b',
};

export default function InternalSystemHealthPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [callMetrics, setCallMetrics] = useState<CallMetrics | null>(null);
  const [paymentMetrics, setPaymentMetrics] = useState<PaymentMetrics | null>(null);
  const [recentFailures, setRecentFailures] = useState<Failure[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/internal/system-health');
        if (res.ok) {
          const data = await res.json();
          setHealth(data.health);
          setCallMetrics(data.callMetrics);
          setPaymentMetrics(data.paymentMetrics);
          setRecentFailures(data.recentFailures);
        }
      } catch (error) {
        console.error('Failed to load system health:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  const hasIssues =
    (health?.failedCallsLast24h ?? 0) > 0 ||
    (health?.pendingWebhooks ?? 0) > 0 ||
    (health?.errorCount ?? 0) > 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">System Health</h1>
        <p className="text-slate-400">
          Observability dashboard — read-only
        </p>
      </div>

      {/* Status Banner */}
      <div
        className={`rounded-lg p-4 mb-6 ${
          hasIssues
            ? 'bg-amber-900/50 border border-amber-700'
            : 'bg-green-900/50 border border-green-700'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{hasIssues ? '⚠️' : '✅'}</span>
          <div>
            <p className="text-white font-medium">
              {hasIssues ? 'Issues Detected' : 'All Systems Operational'}
            </p>
            <p className="text-sm text-slate-300">
              {hasIssues
                ? `${health?.failedCallsLast24h ?? 0} failed calls, ${health?.errorCount ?? 0} errors in last 24h`
                : 'No failures or errors in the last 24 hours'}
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-800 rounded-lg p-4">
          <p className="text-3xl font-bold text-white">{health?.activeClients ?? 0}</p>
          <p className="text-sm text-slate-400">Active Clients (30d)</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4">
          <p className="text-3xl font-bold text-amber-400">
            {health?.pendingInvoices ?? 0}
          </p>
          <p className="text-sm text-slate-400">Pending Invoices</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4">
          <p className="text-3xl font-bold text-white">{health?.totalCalls ?? 0}</p>
          <p className="text-sm text-slate-400">Total Calls</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4">
          <p
            className={`text-3xl font-bold ${
              (callMetrics?.failureRate ?? 0) > 10 ? 'text-red-400' : 'text-green-400'
            }`}
          >
            {(callMetrics?.failureRate ?? 0).toFixed(1)}%
          </p>
          <p className="text-sm text-slate-400">Failure Rate (7d)</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Calls Per Day */}
        <div className="bg-slate-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-white mb-4">
            Calls Per Day (7 days)
          </h2>
          <div className="h-64">
            {callMetrics?.callsPerDay && callMetrics.callsPerDay.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={callMetrics.callsPerDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="date"
                    stroke="#9ca3af"
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })
                    }
                  />
                  <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                No call data
              </div>
            )}
          </div>
        </div>

        {/* Outcome Distribution */}
        <div className="bg-slate-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-white mb-4">
            Call Outcomes (7 days)
          </h2>
          <div className="h-64">
            {callMetrics?.outcomeDistribution &&
            callMetrics.outcomeDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={callMetrics.outcomeDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="outcome"
                    label={({ name, percent }) =>
                      `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {callMetrics.outcomeDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={OUTCOME_COLORS[entry.outcome] || COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend
                    formatter={(value) => (
                      <span style={{ color: '#9ca3af' }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                No outcome data
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Metrics */}
      <div className="bg-slate-800 rounded-lg p-4 mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Payment Metrics</h2>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-2xl font-bold text-green-400">
              ${(paymentMetrics?.revenueThisWeek ?? 0).toLocaleString()}
            </p>
            <p className="text-sm text-slate-400">Revenue This Week</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">
              {(paymentMetrics?.conversionRate ?? 0).toFixed(1)}%
            </p>
            <p className="text-sm text-slate-400">Conversion Rate</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-400">
              {paymentMetrics?.pendingPayments ?? 0}
            </p>
            <p className="text-sm text-slate-400">Pending Payments</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-400">
              {paymentMetrics?.completedPayments ?? 0}
            </p>
            <p className="text-sm text-slate-400">Completed Payments</p>
          </div>
        </div>
      </div>

      {/* Recent Failures */}
      <div className="bg-slate-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Recent Failures</h2>
          <p className="text-sm text-slate-400">
            Last 10 failed or disconnected calls
          </p>
        </div>
        <table className="w-full">
          <thead className="bg-slate-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                Client
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                Invoice
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                Phone
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                Outcome
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {recentFailures.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No recent failures
                </td>
              </tr>
            ) : (
              recentFailures.map((failure) => (
                <tr key={failure.id} className="hover:bg-slate-700/50">
                  <td className="px-4 py-3 text-slate-400 text-sm">
                    {new Date(failure.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-white">{failure.client}</td>
                  <td className="px-4 py-3 text-slate-300">{failure.invoice}</td>
                  <td className="px-4 py-3 text-slate-300 font-mono text-sm">
                    {failure.phoneNumber}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs font-medium text-white rounded bg-red-600">
                      {failure.outcome}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
