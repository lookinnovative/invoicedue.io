import { NextResponse } from 'next/server';
import { getClientTenantId } from '@/lib/client/permissions';
import { db } from '@/lib/db';
import { CallOutcome, PaymentStatus, DeliveryStatus } from '@prisma/client';

export async function GET() {
  try {
    const tenantId = await getClientTenantId();

    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Call success rate
    const calls = await db.callLog.findMany({
      where: {
        tenantId,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { outcome: true },
    });

    const successfulCalls = calls.filter(
      (c) => c.outcome === CallOutcome.ANSWERED || c.outcome === CallOutcome.VOICEMAIL
    ).length;
    const failedCalls = calls.filter(
      (c) =>
        c.outcome === CallOutcome.NO_ANSWER ||
        c.outcome === CallOutcome.BUSY ||
        c.outcome === CallOutcome.WRONG_NUMBER ||
        c.outcome === CallOutcome.DISCONNECTED
    ).length;

    const callSuccess = {
      total: calls.length,
      successful: successfulCalls,
      failed: failedCalls,
      rate: calls.length > 0 ? (successfulCalls / calls.length) * 100 : 100,
    };

    // Payment success rate
    const payments = await db.payment.findMany({
      where: {
        tenantId,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { status: true },
    });

    const successfulPayments = payments.filter(
      (p) => p.status === PaymentStatus.SUCCEEDED
    ).length;
    const failedPayments = payments.filter(
      (p) => p.status === PaymentStatus.FAILED
    ).length;

    const paymentSuccess = {
      total: payments.length,
      successful: successfulPayments,
      failed: failedPayments,
      rate: payments.length > 0 ? (successfulPayments / payments.length) * 100 : 100,
    };

    // SMS delivery rate
    const smsRecords = await db.paymentLinkSent.findMany({
      where: {
        tenantId,
        channel: 'SMS',
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { deliveryStatus: true },
    });

    const deliveredSms = smsRecords.filter(
      (s) => s.deliveryStatus === DeliveryStatus.DELIVERED
    ).length;
    const failedSms = smsRecords.filter(
      (s) => s.deliveryStatus === DeliveryStatus.FAILED
    ).length;

    const smsDelivery = {
      total: smsRecords.length,
      delivered: deliveredSms,
      failed: failedSms,
      rate: smsRecords.length > 0 ? (deliveredSms / smsRecords.length) * 100 : 100,
    };

    // Last activity
    const lastCall = await db.callLog.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    // Determine overall system status
    let systemStatus: 'healthy' | 'degraded' | 'down' = 'healthy';
    if (callSuccess.rate < 50 || paymentSuccess.rate < 50) {
      systemStatus = 'degraded';
    }
    if (callSuccess.rate < 20) {
      systemStatus = 'down';
    }

    return NextResponse.json({
      callSuccess,
      paymentSuccess,
      smsDelivery,
      lastActivity: lastCall?.createdAt.toISOString() ?? null,
      systemStatus,
    });
  } catch (error) {
    console.error('Client system health failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system health' },
      { status: 500 }
    );
  }
}
