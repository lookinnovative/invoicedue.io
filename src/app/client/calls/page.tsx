'use client';

import { useEffect, useState } from 'react';

interface Call {
  id: string;
  invoiceNumber: string | null;
  customerName: string;
  phoneNumber: string;
  outcome: string;
  duration: number | null;
  callDate: string;
}

export default function ClientCallsPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [outcomeFilter, setOutcomeFilter] = useState<string>('all');

  useEffect(() => {
    async function fetchCalls() {
      try {
        const params = new URLSearchParams();
        if (outcomeFilter !== 'all') {
          params.set('outcome', outcomeFilter);
        }
        const res = await fetch(`/api/client/calls?${params}`);
        if (res.ok) {
          const data = await res.json();
          setCalls(data.calls);
        }
      } catch (error) {
        console.error('Failed to fetch calls:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchCalls();
  }, [outcomeFilter]);

  const getOutcomeBadge = (outcome: string) => {
    const styles: Record<string, string> = {
      ANSWERED: 'bg-green-100 text-green-800',
      VOICEMAIL: 'bg-blue-100 text-blue-800',
      NO_ANSWER: 'bg-yellow-100 text-yellow-800',
      BUSY: 'bg-orange-100 text-orange-800',
      FAILED: 'bg-red-100 text-red-800',
      PENDING: 'bg-slate-100 text-slate-800',
    };
    return styles[outcome] || 'bg-slate-100 text-slate-800';
  };

  const getOutcomeLabel = (outcome: string) => {
    const labels: Record<string, string> = {
      ANSWERED: 'Answered',
      VOICEMAIL: 'Voicemail',
      NO_ANSWER: 'No Answer',
      BUSY: 'Busy',
      FAILED: 'Failed',
      PENDING: 'Pending',
    };
    return labels[outcome] || outcome;
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const maskPhone = (phone: string) => {
    // Show only last 4 digits for privacy
    if (phone.length > 4) {
      return `***${phone.slice(-4)}`;
    }
    return phone;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Calls</h2>
          <p className="text-slate-600 mt-1">
            View follow-up call history and outcomes
          </p>
        </div>
        <select
          value={outcomeFilter}
          onChange={(e) => setOutcomeFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-md text-sm"
        >
          <option value="all">All Outcomes</option>
          <option value="ANSWERED">Answered</option>
          <option value="VOICEMAIL">Voicemail</option>
          <option value="NO_ANSWER">No Answer</option>
          <option value="BUSY">Busy</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-500">Loading calls...</div>
        </div>
      ) : calls.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
          <p className="text-slate-500">No calls found</p>
          <p className="text-sm text-slate-400 mt-1">
            Calls will appear here once follow-up calls are placed
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Invoice
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Phone
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Outcome
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Duration
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {calls.map((call) => (
                <tr key={call.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">
                    {call.invoiceNumber || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {call.customerName}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 font-mono">
                    {maskPhone(call.phoneNumber)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getOutcomeBadge(call.outcome)}`}>
                      {getOutcomeLabel(call.outcome)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {formatDuration(call.duration)}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {new Date(call.callDate).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
