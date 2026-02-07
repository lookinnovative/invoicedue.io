'use client';

import { useEffect, useState } from 'react';

interface ActivityEvent {
  id: string;
  type: string;
  description: string;
  entityType: string;
  timestamp: string;
}

export default function ClientEventsPage() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    async function fetchEvents() {
      try {
        const params = new URLSearchParams();
        if (typeFilter !== 'all') {
          params.set('type', typeFilter);
        }
        const res = await fetch(`/api/client/events?${params}`);
        if (res.ok) {
          const data = await res.json();
          setEvents(data.events);
        }
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, [typeFilter]);

  const getTypeIcon = (entityType: string) => {
    const icons: Record<string, string> = {
      INVOICE: '📄',
      CALL: '📞',
      PAYMENT: '💳',
      POLICY: '⚙️',
      SYSTEM: '🔧',
    };
    return icons[entityType] || '📋';
  };

  const getTypeBadge = (entityType: string) => {
    const styles: Record<string, string> = {
      INVOICE: 'bg-blue-100 text-blue-800',
      CALL: 'bg-purple-100 text-purple-800',
      PAYMENT: 'bg-green-100 text-green-800',
      POLICY: 'bg-yellow-100 text-yellow-800',
      SYSTEM: 'bg-slate-100 text-slate-800',
    };
    return styles[entityType] || 'bg-slate-100 text-slate-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Activity</h2>
          <p className="text-slate-600 mt-1">
            Timeline of all account activity
          </p>
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-md text-sm"
        >
          <option value="all">All Activity</option>
          <option value="INVOICE">Invoices</option>
          <option value="CALL">Calls</option>
          <option value="PAYMENT">Payments</option>
          <option value="POLICY">Settings</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-500">Loading activity...</div>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
          <p className="text-slate-500">No activity found</p>
          <p className="text-sm text-slate-400 mt-1">
            Activity will appear here as actions occur on your account
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200">
          <div className="divide-y divide-slate-100">
            {events.map((event) => (
              <div key={event.id} className="px-4 py-3 flex items-start gap-3">
                <div className="text-xl">{getTypeIcon(event.entityType)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-900">{event.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${getTypeBadge(event.entityType)}`}>
                      {event.entityType}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
