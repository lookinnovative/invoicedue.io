// =============================================================================
// INTERNAL ADMIN - GLOBAL SEARCH
// =============================================================================
//
// Search across all entities for the internal admin dashboard.
//
// =============================================================================

import { db } from '@/lib/db';

export interface SearchResult {
  entityType: 'client' | 'invoice' | 'call' | 'payment';
  entityId: string;
  title: string;
  subtitle: string;
  metadata?: Record<string, unknown>;
}

export interface SearchOptions {
  query: string;
  limit?: number;
  entityTypes?: SearchResult['entityType'][];
}

/**
 * Global search across all entities
 * Searches clients, invoices, calls, and payments
 */
export async function globalSearch(options: SearchOptions): Promise<SearchResult[]> {
  const { query, limit = 20, entityTypes } = options;
  
  if (!query || query.trim().length < 2) {
    return [];
  }

  const searchTerm = query.trim().toLowerCase();
  const results: SearchResult[] = [];
  const perEntityLimit = Math.ceil(limit / 4);

  // Search Clients (Tenants)
  if (!entityTypes || entityTypes.includes('client')) {
    const clients = await db.tenant.findMany({
      where: {
        OR: [
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { companyName: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      take: perEntityLimit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        companyName: true,
        createdAt: true,
        _count: {
          select: {
            invoices: true,
            callLogs: true,
          },
        },
      },
    });

    results.push(
      ...clients.map((client) => ({
        entityType: 'client' as const,
        entityId: client.id,
        title: client.companyName,
        subtitle: client.email,
        metadata: {
          invoiceCount: client._count.invoices,
          callCount: client._count.callLogs,
          createdAt: client.createdAt,
        },
      }))
    );
  }

  // Search Invoices
  if (!entityTypes || entityTypes.includes('invoice')) {
    const invoices = await db.invoice.findMany({
      where: {
        OR: [
          { invoiceNumber: { contains: searchTerm, mode: 'insensitive' } },
          { customerName: { contains: searchTerm, mode: 'insensitive' } },
          { phoneNumber: { contains: searchTerm } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      take: perEntityLimit,
      orderBy: { createdAt: 'desc' },
      include: {
        tenant: {
          select: { companyName: true },
        },
      },
    });

    results.push(
      ...invoices.map((invoice) => ({
        entityType: 'invoice' as const,
        entityId: invoice.id,
        title: invoice.invoiceNumber || `Invoice for ${invoice.customerName}`,
        subtitle: `${invoice.tenant.companyName} • $${invoice.amount} • ${invoice.status}`,
        metadata: {
          tenantId: invoice.tenantId,
          customerName: invoice.customerName,
          amount: invoice.amount,
          status: invoice.status,
          dueDate: invoice.dueDate,
        },
      }))
    );
  }

  // Search Calls
  if (!entityTypes || entityTypes.includes('call')) {
    const calls = await db.callLog.findMany({
      where: {
        OR: [
          { vapiCallId: { contains: searchTerm } },
          { phoneNumber: { contains: searchTerm } },
        ],
      },
      take: perEntityLimit,
      orderBy: { createdAt: 'desc' },
      include: {
        tenant: {
          select: { companyName: true },
        },
        invoice: {
          select: { invoiceNumber: true, customerName: true },
        },
      },
    });

    results.push(
      ...calls.map((call) => ({
        entityType: 'call' as const,
        entityId: call.id,
        title: call.vapiCallId || `Call to ${call.phoneNumber}`,
        subtitle: `${call.tenant.companyName} • ${call.outcome} • ${call.durationSeconds}s`,
        metadata: {
          tenantId: call.tenantId,
          invoiceId: call.invoiceId,
          outcome: call.outcome,
          duration: call.durationSeconds,
          startedAt: call.startedAt,
        },
      }))
    );
  }

  // Search Payments
  if (!entityTypes || entityTypes.includes('payment')) {
    const payments = await db.payment.findMany({
      where: {
        OR: [
          { stripePaymentIntentId: { contains: searchTerm } },
          { stripeCheckoutId: { contains: searchTerm } },
        ],
      },
      take: perEntityLimit,
      orderBy: { createdAt: 'desc' },
      include: {
        tenant: {
          select: { companyName: true },
        },
        invoice: {
          select: { invoiceNumber: true, customerName: true },
        },
      },
    });

    results.push(
      ...payments.map((payment) => ({
        entityType: 'payment' as const,
        entityId: payment.id,
        title: payment.stripePaymentIntentId || `Payment $${payment.amount}`,
        subtitle: `${payment.tenant.companyName} • ${payment.status} • $${payment.amount}`,
        metadata: {
          tenantId: payment.tenantId,
          invoiceId: payment.invoiceId,
          status: payment.status,
          amount: payment.amount,
          paidAt: payment.paidAt,
        },
      }))
    );
  }

  // Sort all results by relevance (exact matches first, then by date)
  results.sort((a, b) => {
    const aExact = a.title.toLowerCase().includes(searchTerm) ? 1 : 0;
    const bExact = b.title.toLowerCase().includes(searchTerm) ? 1 : 0;
    return bExact - aExact;
  });

  return results.slice(0, limit);
}

/**
 * Quick stats for the admin dashboard
 */
export async function getQuickStats() {
  const [
    clientCount,
    pendingInvoiceCount,
    todayCallCount,
    recentFailures,
  ] = await Promise.all([
    db.tenant.count(),
    db.invoice.count({ where: { status: 'PENDING' } }),
    db.callLog.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    db.callLog.count({
      where: {
        outcome: { in: ['DISCONNECTED', 'WRONG_NUMBER'] },
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  return {
    clientCount,
    pendingInvoiceCount,
    todayCallCount,
    recentFailures,
  };
}
