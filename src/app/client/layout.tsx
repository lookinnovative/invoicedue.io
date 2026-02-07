'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface ClientUser {
  id: string;
  email: string;
  companyName: string;
}

const navItems = [
  { href: '/client', label: 'Overview', icon: '📊' },
  { href: '/client/invoices', label: 'Invoices', icon: '📄' },
  { href: '/client/payments', label: 'Payments', icon: '💳' },
  { href: '/client/calls', label: 'Calls', icon: '📞' },
  { href: '/client/events', label: 'Activity', icon: '📋' },
  { href: '/client/system-health', label: 'System Health', icon: '🏥' },
  { href: '/client/errors', label: 'Errors', icon: '⚠️' },
  { href: '/client/settings', label: 'Settings', icon: '⚙️' },
];

export default function ClientAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<ClientUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyAccess() {
      try {
        const res = await fetch('/api/client/verify');
        if (!res.ok) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        setUser(data.user);
      } catch {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    verifyAccess();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-slate-900">
              {user.companyName}
            </h1>
            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <span>{user.email}</span>
            <Link
              href="/dashboard"
              className="text-slate-500 hover:text-slate-900 transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-56 bg-white min-h-[calc(100vh-52px)] border-r border-slate-200">
          <nav className="p-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/client' && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Help section */}
          <div className="mt-6 mx-2 p-3 bg-slate-50 rounded-md">
            <p className="text-xs text-slate-500 mb-1">Need help?</p>
            <p className="text-sm text-slate-700">
              <a href="mailto:support@invoicedue.io" className="text-blue-600 hover:underline">
                Contact Support
              </a>
            </p>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
