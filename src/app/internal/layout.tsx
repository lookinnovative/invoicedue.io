import { redirect } from 'next/navigation';
import { verifyAdminAccess } from '@/lib/internal/permissions';
import Link from 'next/link';

const navItems = [
  { href: '/internal', label: 'Search', icon: '🔍' },
  { href: '/internal/clients', label: 'Clients', icon: '👥' },
  { href: '/internal/invoices', label: 'Invoices', icon: '📄' },
  { href: '/internal/calls', label: 'Calls', icon: '📞' },
  { href: '/internal/payments', label: 'Payments', icon: '💳' },
  { href: '/internal/events', label: 'Events', icon: '📋' },
  { href: '/internal/system-health', label: 'System Health', icon: '🏥' },
];

export default async function InternalAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verify admin access before rendering
  const admin = await verifyAdminAccess();

  if (!admin) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-white">
              InvoiceDue Admin
            </h1>
            <span className="px-2 py-0.5 text-xs font-medium bg-amber-600 text-white rounded">
              INTERNAL
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <span>{admin.email}</span>
            <Link 
              href="/dashboard" 
              className="text-slate-400 hover:text-white transition-colors"
            >
              Exit Admin →
            </Link>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-56 bg-slate-800 min-h-[calc(100vh-52px)] border-r border-slate-700">
          <nav className="p-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-md text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <span>{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Quick Info */}
          <div className="mt-6 mx-2 p-3 bg-slate-700/50 rounded-md">
            <p className="text-xs text-slate-400 mb-1">Mode</p>
            <p className="text-sm text-amber-400 font-medium">Read-Only</p>
            <p className="text-xs text-slate-500 mt-1">
              No edits in v0
            </p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
