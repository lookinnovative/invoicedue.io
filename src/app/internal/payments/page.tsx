'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Payment {
  id: string;
  amount: string;
  currency: string;
  status: string;
  stripePaymentIntentId: string | null;
  paidAt: string | null;
  failedAt: string | null;
  failureReason: string | null;
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

const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-600',
  SUCCEEDED: 'bg-green-600',
  FAILED: 'bg-red-600',
  REFUNDED: 'bg-purple-600',
};

const statusOptions = ['', 'PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED'];

export default function InternalPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function loadPayments() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '20',
          ...(status && { status }),
        });
        const res = await fetch(`/api/internal/payments?${params}`);
        if (res.ok) {
          const data = await res.json();
          setPayments(data.payments);
          setPages(data.pages);
          setTotal(data.total);
        }
      } catch (error) {
        console.error('Failed to load payments:', error);
      } finally {
        setLoading(false);
      }
    }
    loadPayments();
  }, [page, status]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Payments</h1>
          <p className="text-slate-400">
            {total} total payment{total !== 1 ? 's' : ''}
          </p>
        </div>
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
      </div>

      {/* Info Banner */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-6">
        <p className="text-sm text-slate-400">
          <span className="text-amber-400 font-medium">Note:</span> Payment data
          is sourced from Stripe webhooks. This table is read-only.
        </p>
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Created
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Client
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Stripe ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Invoice
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Paid At
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
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No payments found
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr
                  key={payment.id}
                  className="hover:bg-slate-700/50 transition-colors"
                >
                  <td className="px-4 py-3 text-slate-400 text-sm">
                    {new Date(payment.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/internal/clients/${payment.tenant.id}`}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      {payment.tenant.companyName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-white font-medium">
                    ${payment.amount} {payment.currency.toUpperCase()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs font-medium text-white rounded ${
                        statusColors[payment.status] || 'bg-slate-600'
                      }`}
                    >
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                    {payment.stripePaymentIntentId?.slice(0, 20) || '-'}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {payment.invoice.invoiceNumber || payment.invoice.customerName}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm">
                    {payment.paidAt
                      ? new Date(payment.paidAt).toLocaleString()
                      : '-'}
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
