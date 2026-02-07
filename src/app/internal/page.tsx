'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface SearchResult {
  entityType: 'client' | 'invoice' | 'call' | 'payment';
  entityId: string;
  title: string;
  subtitle: string;
  metadata?: Record<string, unknown>;
}

interface QuickStats {
  clientCount: number;
  pendingInvoiceCount: number;
  todayCallCount: number;
  recentFailures: number;
}

const entityColors = {
  client: 'bg-blue-600',
  invoice: 'bg-green-600',
  call: 'bg-purple-600',
  payment: 'bg-amber-600',
};

const entityLinks = {
  client: (id: string) => `/internal/clients/${id}`,
  invoice: (id: string) => `/internal/invoices?id=${id}`,
  call: (id: string) => `/internal/calls?id=${id}`,
  payment: (id: string) => `/internal/payments?id=${id}`,
};

export default function InternalAdminHomePage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [stats, setStats] = useState<QuickStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);

  // Load quick stats on mount
  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/internal/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setStatsLoading(false);
      }
    }
    loadStats();
  }, []);

  // Search with debounce
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/internal/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results);
        }
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Global Search</h1>
        <p className="text-slate-400">
          Search across clients, invoices, calls, and payments
        </p>
      </div>

      {/* Search Box */}
      <div className="mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by email, phone, invoice ID, client name, Stripe ID..."
          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          autoFocus
        />
        {loading && (
          <p className="mt-2 text-sm text-slate-500">Searching...</p>
        )}
      </div>

      {/* Search Results */}
      {results.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-slate-400 mb-3">
            {results.length} result{results.length !== 1 ? 's' : ''}
          </h2>
          <div className="space-y-2">
            {results.map((result) => (
              <Link
                key={`${result.entityType}-${result.entityId}`}
                href={entityLinks[result.entityType](result.entityId)}
                className="flex items-center gap-4 p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <span
                  className={`px-2 py-1 text-xs font-medium text-white rounded ${entityColors[result.entityType]}`}
                >
                  {result.entityType.toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{result.title}</p>
                  <p className="text-sm text-slate-400 truncate">{result.subtitle}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-slate-400 mb-3">Quick Stats</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800 rounded-lg p-4">
            <p className="text-2xl font-bold text-white">
              {statsLoading ? '...' : stats?.clientCount ?? 0}
            </p>
            <p className="text-sm text-slate-400">Total Clients</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <p className="text-2xl font-bold text-amber-400">
              {statsLoading ? '...' : stats?.pendingInvoiceCount ?? 0}
            </p>
            <p className="text-sm text-slate-400">Pending Invoices</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <p className="text-2xl font-bold text-white">
              {statsLoading ? '...' : stats?.todayCallCount ?? 0}
            </p>
            <p className="text-sm text-slate-400">Calls Today</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <p className="text-2xl font-bold text-red-400">
              {statsLoading ? '...' : stats?.recentFailures ?? 0}
            </p>
            <p className="text-sm text-slate-400">Failures (24h)</p>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-sm font-medium text-slate-400 mb-3">Quick Links</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/internal/clients"
            className="flex flex-col items-center gap-2 p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <span className="text-2xl">👥</span>
            <span className="text-sm text-slate-300">All Clients</span>
          </Link>
          <Link
            href="/internal/invoices"
            className="flex flex-col items-center gap-2 p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <span className="text-2xl">📄</span>
            <span className="text-sm text-slate-300">All Invoices</span>
          </Link>
          <Link
            href="/internal/system-health"
            className="flex flex-col items-center gap-2 p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <span className="text-2xl">🏥</span>
            <span className="text-sm text-slate-300">System Health</span>
          </Link>
          <Link
            href="/internal/events"
            className="flex flex-col items-center gap-2 p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <span className="text-2xl">📋</span>
            <span className="text-sm text-slate-300">Event Log</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
