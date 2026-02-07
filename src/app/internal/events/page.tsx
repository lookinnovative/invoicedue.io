'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Event {
  id: string;
  entityType: string;
  entityId: string;
  eventType: string;
  payload: Record<string, unknown>;
  source: string;
  createdAt: string;
  tenant: {
    id: string;
    companyName: string;
  } | null;
}

const entityTypeColors: Record<string, string> = {
  CLIENT: 'bg-blue-600',
  INVOICE: 'bg-green-600',
  CALL: 'bg-purple-600',
  PAYMENT: 'bg-amber-600',
  POLICY: 'bg-cyan-600',
  SYSTEM: 'bg-slate-600',
};

const entityTypeOptions = ['', 'CLIENT', 'INVOICE', 'CALL', 'PAYMENT', 'POLICY', 'SYSTEM'];

export default function InternalEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityType, setEntityType] = useState('');
  const [eventType, setEventType] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadEvents() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '50',
          ...(entityType && { entityType }),
          ...(eventType && { eventType }),
        });
        const res = await fetch(`/api/internal/events?${params}`);
        if (res.ok) {
          const data = await res.json();
          setEvents(data.events);
          setPages(data.pages);
          setTotal(data.total);
        }
      } catch (error) {
        console.error('Failed to load events:', error);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, [page, entityType, eventType]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Event Log</h1>
          <p className="text-slate-400">
            {total} total event{total !== 1 ? 's' : ''} (append-only audit trail)
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Entity Types</option>
            {entityTypeOptions.slice(1).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Filter by event type..."
            value={eventType}
            onChange={(e) => {
              setEventType(e.target.value);
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
                Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Event Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Entity
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Client
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Source
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Payload
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Loading...
                </td>
              </tr>
            ) : events.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No events found
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <>
                  <tr
                    key={event.id}
                    className="hover:bg-slate-700/50 transition-colors cursor-pointer"
                    onClick={() =>
                      setExpandedId(expandedId === event.id ? null : event.id)
                    }
                  >
                    <td className="px-4 py-3 text-slate-400 text-sm whitespace-nowrap">
                      {new Date(event.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-white font-mono text-sm">
                        {event.eventType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs font-medium text-white rounded ${
                          entityTypeColors[event.entityType] || 'bg-slate-600'
                        }`}
                      >
                        {event.entityType}
                      </span>
                      <span className="ml-2 text-slate-400 font-mono text-xs">
                        {event.entityId.slice(0, 8)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {event.tenant ? (
                        <Link
                          href={`/internal/clients/${event.tenant.id}`}
                          className="text-blue-400 hover:text-blue-300 text-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {event.tenant.companyName}
                        </Link>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-sm">
                      {event.source}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-sm">
                      <button
                        className="text-blue-400 hover:text-blue-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedId(expandedId === event.id ? null : event.id);
                        }}
                      >
                        {expandedId === event.id ? 'Hide' : 'View'}
                      </button>
                    </td>
                  </tr>
                  {expandedId === event.id && (
                    <tr key={`${event.id}-payload`}>
                      <td colSpan={6} className="px-4 py-3 bg-slate-900">
                        <pre className="text-xs text-slate-300 overflow-x-auto">
                          {JSON.stringify(event.payload, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  )}
                </>
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
