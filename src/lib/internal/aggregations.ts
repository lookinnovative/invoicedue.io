// =============================================================================
// INTERNAL ADMIN - AGGREGATIONS & METRICS
// =============================================================================
//
// Compute aggregate metrics for the internal admin dashboard.
//
// =============================================================================

import { db } from '@/lib/db';
import { CallOutcome, InvoiceStatus, PaymentStatus } from '@prisma/client';

export interface SystemHealthMetrics {
  failedCallsLast24h: number;
  pendingWebhooks: number;
  errorCount: number;
  activeClients: number;
  pendingInvoices: number;
  totalInvoices: number;
  totalCalls: number;
}

export interface CallMetrics {
  callsPerDay: { date: string; count: number }[];
  outcomeDistribution: { outcome: string; count: number }[];
  failureRate: number;
  totalCalls: number;
}

export interface PaymentMetrics {
  conversionRate: number;
  revenueThisWeek: number;
  pendingPayments: number;
  completedPayments: number;
}

export interface ClientMetrics {
  totalClients: number;
  activeClientsThisWeek: number;
  newClientsThisMonth: number;
}

/**
 * Get system health metrics for the dashboard
 */
export async function getSystemHealthMetrics(): Promise<SystemHealthMetrics> {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [
    failedCallsLast24h,
    pendingWebhooks,
    activeClients,
    pendingInvoices,
    totalInvoices,
    totalCalls,
  ] = await Promise.all([
    // Failed calls in last 24 hours
    db.callLog.count({
      where: {
        createdAt: { gte: last24h },
        outcome: { in: [CallOutcome.DISCONNECTED, CallOutcome.WRONG_NUMBER] },
      },
    }),
    // Unprocessed webhooks
    db.webhookLog.count({
      where: { processedAt: null },
    }),
    // Active clients (with activity in last 30 days)
    db.tenant.count({
      where: {
        OR: [
          { invoices: { some: { createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } } } },
          { callLogs: { some: { createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } } } },
        ],
      },
    }),
    // Pending invoices
    db.invoice.count({ where: { status: InvoiceStatus.PENDING } }),
    // Total invoices
    db.invoice.count(),
    // Total calls
    db.callLog.count(),
  ]);

  // Error count from webhook logs
  const errorCount = await db.webhookLog.count({
    where: {
      processingError: { not: null },
      createdAt: { gte: last24h },
    },
  });

  return {
    failedCallsLast24h,
    pendingWebhooks,
    errorCount,
    activeClients,
    pendingInvoices,
    totalInvoices,
    totalCalls,
  };
}

/**
 * Get call metrics for charts
 */
export async function getCallMetrics(days: number = 7): Promise<CallMetrics> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  // Get calls grouped by date
  const calls = await db.callLog.findMany({
    where: {
      createdAt: { gte: startDate },
    },
    select: {
      createdAt: true,
      outcome: true,
    },
  });

  // Group by date
  const callsByDate: Record<string, number> = {};
  const outcomeCount: Record<string, number> = {};

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    callsByDate[date.toISOString().split('T')[0]] = 0;
  }

  let failedCalls = 0;
  calls.forEach((call) => {
    const dateKey = call.createdAt.toISOString().split('T')[0];
    if (callsByDate[dateKey] !== undefined) {
      callsByDate[dateKey]++;
    }
    
    outcomeCount[call.outcome] = (outcomeCount[call.outcome] || 0) + 1;
    
    if (call.outcome === CallOutcome.DISCONNECTED || call.outcome === CallOutcome.WRONG_NUMBER) {
      failedCalls++;
    }
  });

  const callsPerDay = Object.entries(callsByDate).map(([date, count]) => ({
    date,
    count,
  }));

  const outcomeDistribution = Object.entries(outcomeCount).map(([outcome, count]) => ({
    outcome,
    count,
  }));

  const totalCalls = calls.length;
  const failureRate = totalCalls > 0 ? (failedCalls / totalCalls) * 100 : 0;

  return {
    callsPerDay,
    outcomeDistribution,
    failureRate,
    totalCalls,
  };
}

/**
 * Get payment metrics
 */
export async function getPaymentMetrics(): Promise<PaymentMetrics> {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  const [
    pendingPayments,
    completedPayments,
    weeklyPayments,
  ] = await Promise.all([
    db.payment.count({ where: { status: PaymentStatus.PENDING } }),
    db.payment.count({ where: { status: PaymentStatus.SUCCEEDED } }),
    db.payment.findMany({
      where: {
        status: PaymentStatus.SUCCEEDED,
        paidAt: { gte: weekStart },
      },
      select: { amount: true },
    }),
  ]);

  const revenueThisWeek = weeklyPayments.reduce(
    (sum, p) => sum + Number(p.amount),
    0
  );

  const total = pendingPayments + completedPayments;
  const conversionRate = total > 0 ? (completedPayments / total) * 100 : 0;

  return {
    conversionRate,
    revenueThisWeek,
    pendingPayments,
    completedPayments,
  };
}

/**
 * Get client metrics
 */
export async function getClientMetrics(): Promise<ClientMetrics> {
  const now = new Date();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalClients, activeClientsThisWeek, newClientsThisMonth] = await Promise.all([
    db.tenant.count(),
    db.tenant.count({
      where: {
        callLogs: {
          some: {
            createdAt: { gte: weekStart },
          },
        },
      },
    }),
    db.tenant.count({
      where: {
        createdAt: { gte: monthStart },
      },
    }),
  ]);

  return {
    totalClients,
    activeClientsThisWeek,
    newClientsThisMonth,
  };
}

/**
 * Get recent failures for the system health page
 */
export async function getRecentFailures(limit: number = 10) {
  const failures = await db.callLog.findMany({
    where: {
      outcome: { in: [CallOutcome.DISCONNECTED, CallOutcome.WRONG_NUMBER] },
    },
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      tenant: { select: { companyName: true } },
      invoice: { select: { invoiceNumber: true, customerName: true } },
    },
  });

  return failures.map((f) => ({
    id: f.id,
    client: f.tenant.companyName,
    invoice: f.invoice.invoiceNumber || f.invoice.customerName,
    phoneNumber: f.phoneNumber,
    outcome: f.outcome,
    createdAt: f.createdAt,
  }));
}
