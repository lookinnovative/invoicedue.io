'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Invoice {
  id: string;
  invoiceNumber: string | null;
  customerName: string;
  phoneNumber: string;
  amount: string;
  status: string;
  dueDate: string;
  callAttempts: number;
  lastCallOutcome: string | null;
  createdAt: string;
  tenant: {
    id: string;
    companyName: string;
  };
  _count: {
    callLogs: number;
    payments: number;
  };
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-600',
  IN_PROGRESS: 'bg-blue-600',
  COMPLETED: 'bg-green-600',
  FAILED: 'bg-red-600',
};

const statusOptions = ['', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'];

export default function InternalInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function loadInvoices() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '20',
          ...(search && { search }),
          ...(status && { status }),
        });
        const res = await fetch(`/api/internal/invoices?${params}`);
        if (res.ok) {
          const data = await res.json();
          setInvoices(data.invoices);
          setPages(data.pages);
          setTotal(data.total);
        }
      } catch (error) {
        console.error('Failed to load invoices:', error);
      } finally {
        setLoading(false);
      }
    }
    loadInvoices();
  }, [page, search, status]);

  const getDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Invoices</h1>
          <p className="text-slate-400">
            {total} total invoice{total !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            {statusOptions.slice(1).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Search invoices..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Invoice
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Client
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Overdue
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Calls
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
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No invoices found
                </td>
              </tr>
            ) : (
              invoices.map((inv) => {
                const daysOverdue = getDaysOverdue(inv.dueDate);
                return (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="text-white font-medium">
                        {inv.invoiceNumber || inv.id.slice(0, 8)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/internal/clients/${inv.tenant.id}`}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        {inv.tenant.companyName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{inv.customerName}</td>
                    <td className="px-4 py-3 text-slate-300">${inv.amount}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs font-medium text-white rounded ${
                          statusColors[inv.status] || 'bg-slate-600'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {daysOverdue > 0 ? (
                        <span className="text-red-400">{daysOverdue} days</span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {inv.callAttempts}
                    </td>
                  </tr>
                );
              })
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
