'use client';

import { useEffect, useState } from 'react';

interface Invoice {
  id: string;
  invoiceNumber: string | null;
  customerName: string;
  amount: number;
  dueDate: string;
  status: string;
  description: string | null;
  callAttempts: number;
  lastCallOutcome: string | null;
}

export default function ClientInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    async function fetchInvoices() {
      try {
        const params = new URLSearchParams();
        if (statusFilter !== 'all') {
          params.set('status', statusFilter);
        }
        const res = await fetch(`/api/client/invoices?${params}`);
        if (res.ok) {
          const data = await res.json();
          setInvoices(data.invoices);
        }
      } catch (error) {
        console.error('Failed to fetch invoices:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchInvoices();
  }, [statusFilter]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      PAID: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
    };
    return styles[status] || 'bg-slate-100 text-slate-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'Pending',
      IN_PROGRESS: 'In Progress',
      PAID: 'Paid',
      FAILED: 'Failed',
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Invoices</h2>
          <p className="text-slate-600 mt-1">
            Track the status of your outstanding invoices
          </p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-md text-sm"
        >
          <option value="all">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="PAID">Paid</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-500">Loading invoices...</div>
        </div>
      ) : invoices.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
          <p className="text-slate-500">No invoices found</p>
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
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Due Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Follow-ups
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-slate-900">
                      {invoice.invoiceNumber || '—'}
                    </p>
                    {invoice.description && (
                      <p className="text-xs text-slate-500">{invoice.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {invoice.customerName}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">
                    {formatCurrency(invoice.amount)}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadge(invoice.status)}`}>
                      {getStatusLabel(invoice.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-slate-600">
                      {invoice.callAttempts} calls
                    </p>
                    {invoice.lastCallOutcome && (
                      <p className="text-xs text-slate-400">{invoice.lastCallOutcome}</p>
                    )}
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
