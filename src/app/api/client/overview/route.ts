import { NextResponse } from 'next/server';
import { getClientTenantId } from '@/lib/client/permissions';
import { db } from '@/lib/db';
import { InvoiceStatus, CallOutcome } from '@prisma/client';

export async function GET() {
  try {
    const tenantId = await getClientTenantId();

    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get invoice stats
    const invoices = await db.invoice.findMany({
      where: { tenantId },
      select: {
        status: true,
        amount: true,
      },
    });

    const invoiceStats = {
      total: invoices.length,
      pending: invoices.filter((i) => i.status === InvoiceStatus.PENDING).length,
      paid: invoices.filter((i) => i.status === InvoiceStatus.COMPLETED).length,
      overdue: invoices.filter(
        (i) => i.status === InvoiceStatus.PENDING || i.status === InvoiceStatus.IN_PROGRESS
      ).length,
      totalAmount: invoices.reduce((sum, i) => sum + Number(i.amount), 0),
      paidAmount: invoices
        .filter((i) => i.status === InvoiceStatus.COMPLETED)
        .reduce((sum, i) => sum + Number(i.amount), 0),
    };

    // Get call stats
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const allCalls = await db.callLog.findMany({
      where: { tenantId },
      select: {
        outcome: true,
        createdAt: true,
      },
    });

    const thisWeekCalls = allCalls.filter((c) => c.createdAt >= oneWeekAgo);

    const callStats = {
      total: allCalls.length,
      thisWeek: thisWeekCalls.length,
      answered: allCalls.filter((c) => c.outcome === CallOutcome.ANSWERED).length,
      voicemail: allCalls.filter((c) => c.outcome === CallOutcome.VOICEMAIL).length,
    };

    // Get payment stats
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const payments = await db.payment.findMany({
      where: { tenantId },
      select: {
        status: true,
        amount: true,
        paidAt: true,
        createdAt: true,
      },
    });

    const thisMonthPayments = payments.filter(
      (p) => p.status === 'SUCCEEDED' && p.paidAt && p.paidAt >= oneMonthAgo
    );

    const paymentStats = {
      total: payments.filter((p) => p.status === 'SUCCEEDED').length,
      thisMonth: thisMonthPayments.length,
      totalCollected: thisMonthPayments.reduce((sum, p) => sum + Number(p.amount), 0),
    };

    // Get recent activity (simplified events from call logs)
    const recentCalls = await db.callLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        invoice: {
          select: {
            customerName: true,
            invoiceNumber: true,
          },
        },
      },
    });

    const recentActivity = recentCalls.map((call) => ({
      id: call.id,
      type: 'Call',
      description: `Call to ${call.invoice.customerName} - ${call.outcome}`,
      timestamp: call.createdAt.toISOString(),
    }));

    return NextResponse.json({
      invoices: invoiceStats,
      calls: callStats,
      payments: paymentStats,
      recentActivity,
    });
  } catch (error) {
    console.error('Client overview failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch overview' },
      { status: 500 }
    );
  }
}
