'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

interface Invoice {
  id: string;
  invoiceNumber: string | null;
  customerName: string;
  amount: string;
  status: string;
  dueDate: string;
  callAttempts: number;
  lastCallOutcome: string | null;
  createdAt: string;
}

interface CallLog {
  id: string;
  phoneNumber: string;
  outcome: string;
  durationSeconds: number;
  startedAt: string;
  vapiCallId: string | null;
}

interface Payment {
  id: string;
  amount: string;
  status: string;
  stripePaymentIntentId: string | null;
  paidAt: string | null;
  createdAt: string;
}

interface Event {
  id: string;
  entityType: string;
  entityId: string;
  eventType: string;
  payload: Record<string, unknown>;
  source: string;
  createdAt: string;
}

interface Client {
  id: string;
  email: string;
  companyName: string;
  timezone: string;
  createdAt: string;
  policy: {
    paymentLink: string | null;
    maxAttempts: number;
    callWindowStart: string;
    callWindowEnd: string;
  } | null;
  invoices: Invoice[];
  callLogs: CallLog[];
  payments: Payment[];
  usageRecords: Array<{
    minutesAllocated: number;
    minutesUsed: string;
    periodStart: string;
    periodEnd: string;
  }>;
  _count: {
    invoices: number;
    callLogs: number;
    payments: number;
  };
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-600',
  IN_PROGRESS: 'bg-blue-600',
  COMPLETED: 'bg-green-600',
  FAILED: 'bg-red-600',
  SUCCEEDED: 'bg-green-600',
  ANSWERED: 'bg-green-600',
  VOICEMAIL: 'bg-purple-600',
  NO_ANSWER: 'bg-amber-600',
  BUSY: 'bg-amber-600',
  WRONG_NUMBER: 'bg-red-600',
  DISCONNECTED: 'bg-red-600',
};

export default function InternalClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [client, setClient] = useState<Client | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'invoices' | 'calls' | 'payments' | 'events'>('invoices');

  useEffect(() => {
    async function loadClient() {
      try {
        const res = await fetch(`/api/internal/clients/${id}`);
        if (res.ok) {
          const data = await res.json();
          setClient(data.client);
          setEvents(data.events);
        }
      } catch (error) {
        console.error('Failed to load client:', error);
      } finally {
        setLoading(false);
      }
    }
    loadClient();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Client not found</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/internal/clients"
          className="text-slate-400 hover:text-white text-sm mb-2 inline-block"
        >
          ← Back to Clients
        </Link>
        <h1 className="text-2xl font-bold text-white">{client.companyName}</h1>
        <p className="text-slate-400">{client.email}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800 rounded-lg p-4">
          <p className="text-2xl font-bold text-white">{client._count.invoices}</p>
          <p className="text-sm text-slate-400">Invoices</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4">
          <p className="text-2xl font-bold text-white">{client._count.callLogs}</p>
          <p className="text-sm text-slate-400">Calls</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4">
          <p className="text-2xl font-bold text-white">{client._count.payments}</p>
          <p className="text-sm text-slate-400">Payments</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4">
          <p className="text-2xl font-bold text-white">{client.timezone}</p>
          <p className="text-sm text-slate-400">Timezone</p>
        </div>
      </div>

      {/* Policy Info */}
      {client.policy && (
        <div className="bg-slate-800 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-white mb-3">Policy</h2>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-slate-400">Max Attempts</p>
              <p className="text-white">{client.policy.maxAttempts}</p>
            </div>
            <div>
              <p className="text-slate-400">Call Window</p>
              <p className="text-white">
                {client.policy.callWindowStart} - {client.policy.callWindowEnd}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Payment Link</p>
              <p className="text-white truncate">
                {client.policy.paymentLink || 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Created</p>
              <p className="text-white">
                {new Date(client.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-700 mb-4">
        <nav className="flex gap-4">
          {(['invoices', 'calls', 'payments', 'events'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-slate-800 rounded-lg overflow-hidden">
        {activeTab === 'invoices' && (
          <table className="w-full">
            <thead className="bg-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                  Invoice
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                  Attempts
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                  Due
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {client.invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No invoices
                  </td>
                </tr>
              ) : (
                client.invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-700/50">
                    <td className="px-4 py-3 text-white">
                      {inv.invoiceNumber || inv.id.slice(0, 8)}
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
                    <td className="px-4 py-3 text-slate-300">{inv.callAttempts}</td>
                    <td className="px-4 py-3 text-slate-400 text-sm">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {activeTab === 'calls' && (
          <table className="w-full">
            <thead className="bg-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                  Phone
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                  Outcome
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                  Duration
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                  VAPI ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {client.callLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No calls
                  </td>
                </tr>
              ) : (
                client.callLogs.map((call) => (
                  <tr key={call.id} className="hover:bg-slate-700/50">
                    <td className="px-4 py-3 text-white">{call.phoneNumber}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs font-medium text-white rounded ${
                          statusColors[call.outcome] || 'bg-slate-600'
                        }`}
                      >
                        {call.outcome}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{call.durationSeconds}s</td>
                    <td className="px-4 py-3 text-slate-400 text-sm font-mono">
                      {call.vapiCallId?.slice(0, 12) || '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-sm">
                      {new Date(call.startedAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {activeTab === 'payments' && (
          <table className="w-full">
            <thead className="bg-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                  Stripe ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                  Paid At
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {client.payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No payments
                  </td>
                </tr>
              ) : (
                client.payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-700/50">
                    <td className="px-4 py-3 text-white">${payment.amount}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs font-medium text-white rounded ${
                          statusColors[payment.status] || 'bg-slate-600'
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-sm font-mono">
                      {payment.stripePaymentIntentId?.slice(0, 16) || '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-sm">
                      {payment.paidAt
                        ? new Date(payment.paidAt).toLocaleString()
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-sm">
                      {new Date(payment.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {activeTab === 'events' && (
          <table className="w-full">
            <thead className="bg-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                  Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                  Entity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                  Source
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    No events
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event.id} className="hover:bg-slate-700/50">
                    <td className="px-4 py-3 text-slate-400 text-sm">
                      {new Date(event.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-white font-mono text-sm">
                      {event.eventType}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {event.entityType} / {event.entityId.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{event.source}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
