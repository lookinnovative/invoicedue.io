'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Call {
  id: string;
  phoneNumber: string;
  outcome: string;
  durationSeconds: number;
  startedAt: string;
  vapiCallId: string | null;
  createdAt: string;
  tenant: {
    id: string;
    companyName: string;
  };
  invoice: {
    id: string;
    invoiceNumber: string | null;
    customerName: string;
  };
}

const outcomeColors: Record<string, string> = {
  PENDING: 'bg-slate-600',
  ANSWERED: 'bg-green-600',
  VOICEMAIL: 'bg-purple-600',
  NO_ANSWER: 'bg-amber-600',
  BUSY: 'bg-amber-600',
  WRONG_NUMBER: 'bg-red-600',
  DISCONNECTED: 'bg-red-600',
};

const outcomeOptions = [
  '',
  'PENDING',
  'ANSWERED',
  'VOICEMAIL',
  'NO_ANSWER',
  'BUSY',
  'WRONG_NUMBER',
  'DISCONNECTED',
];

export default function InternalCallsPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [outcome, setOutcome] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function loadCalls() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '20',
          ...(outcome && { outcome }),
        });
        const res = await fetch(`/api/internal/calls?${params}`);
        if (res.ok) {
          const data = await res.json();
          setCalls(data.calls);
          setPages(data.pages);
          setTotal(data.total);
        }
      } catch (error) {
        console.error('Failed to load calls:', error);
      } finally {
        setLoading(false);
      }
    }
    loadCalls();
  }, [page, outcome]);

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Calls</h1>
          <p className="text-slate-400">
            {total} total call{total !== 1 ? 's' : ''}
          </p>
        </div>
        <select
          value={outcome}
          onChange={(e) => {
            setOutcome(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Outcomes</option>
          {outcomeOptions.slice(1).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Client
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Outcome
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                VAPI ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Invoice
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  Loading...
                </td>
              </tr>
            ) : calls.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No calls found
                </td>
              </tr>
            ) : (
              calls.map((call) => (
                <tr
                  key={call.id}
                  className="hover:bg-slate-700/50 transition-colors"
                >
                  <td className="px-4 py-3 text-slate-400 text-sm">
                    {new Date(call.startedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/internal/clients/${call.tenant.id}`}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      {call.tenant.companyName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-white font-mono text-sm">
                    {call.phoneNumber}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs font-medium text-white rounded ${
                        outcomeColors[call.outcome] || 'bg-slate-600'
                      }`}
                    >
                      {call.outcome}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {formatDuration(call.durationSeconds)}
                  </td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                    {call.vapiCallId?.slice(0, 12) || '-'}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {call.invoice.invoiceNumber || call.invoice.customerName}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-slate-400">
            Page {page} of {pages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 bg-slate-700 text-slate-300 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="px-3 py-1 bg-slate-700 text-slate-300 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
