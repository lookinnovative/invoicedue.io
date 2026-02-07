'use client';

import { useEffect, useState } from 'react';

interface Payment {
  id: string;
  invoiceNumber: string | null;
  customerName: string;
  amount: number;
  status: string;
  paidAt: string | null;
  createdAt: string;
}

export default function ClientPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    async function fetchPayments() {
      try {
        const params = new URLSearchParams();
        if (statusFilter !== 'all') {
          params.set('status', statusFilter);
        }
        const res = await fetch(`/api/client/payments?${params}`);
        if (res.ok) {
          const data = await res.json();
          setPayments(data.payments);
        }
      } catch (error) {
        console.error('Failed to fetch payments:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchPayments();
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
      SUCCEEDED: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
      REFUNDED: 'bg-slate-100 text-slate-800',
    };
    return styles[status] || 'bg-slate-100 text-slate-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'Pending',
      SUCCEEDED: 'Completed',
      FAILED: 'Failed',
      REFUNDED: 'Refunded',
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Payments</h2>
          <p className="text-slate-600 mt-1">
            View payment history and status
          </p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-md text-sm"
        >
          <option value="all">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="SUCCEEDED">Completed</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-500">Loading payments...</div>
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
          <p className="text-slate-500">No payments found</p>
          <p className="text-sm text-slate-400 mt-1">
            Payments will appear here once customers pay via your payment links
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
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">
                    {payment.invoiceNumber || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {payment.customerName}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadge(payment.status)}`}>
                      {getStatusLabel(payment.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {payment.paidAt
                      ? new Date(payment.paidAt).toLocaleDateString()
                      : new Date(payment.createdAt).toLocaleDateString()}
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
