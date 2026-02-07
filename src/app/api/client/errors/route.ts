import { NextRequest, NextResponse } from 'next/server';
import { getClientTenantId } from '@/lib/client/permissions';
import { db } from '@/lib/db';
import { CallOutcome, PaymentStatus, DeliveryStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const tenantId = await getClientTenantId();

    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeResolved = searchParams.get('includeResolved') === 'true';

    const errors: Array<{
      id: string;
      type: string;
      message: string;
      context: string;
      timestamp: string;
      resolved: boolean;
    }> = [];

    // Get failed calls (within last 30 days)
    // Call outcomes that indicate failure: NO_ANSWER, BUSY, WRONG_NUMBER, DISCONNECTED
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const failedCalls = await db.callLog.findMany({
      where: {
        tenantId,
        outcome: {
          in: [
            CallOutcome.NO_ANSWER,
            CallOutcome.BUSY,
            CallOutcome.WRONG_NUMBER,
            CallOutcome.DISCONNECTED,
          ],
        },
        createdAt: { gte: thirtyDaysAgo },
      },
      include: {
        invoice: {
          select: {
            customerName: true,
            invoiceNumber: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    for (const call of failedCalls) {
      errors.push({
        id: `call-${call.id}`,
        type: 'CALL_FAILED',
        message: `Call to ${call.invoice.customerName} failed`,
        context: call.invoice.invoiceNumber
          ? `Invoice ${call.invoice.invoiceNumber}`
          : 'Unknown invoice',
        timestamp: call.createdAt.toISOString(),
        resolved: false, // Calls can be retried automatically
      });
    }

    // Get failed payments
    const failedPayments = await db.payment.findMany({
      where: {
        tenantId,
        status: PaymentStatus.FAILED,
        createdAt: { gte: thirtyDaysAgo },
      },
      include: {
        invoice: {
          select: {
            customerName: true,
            invoiceNumber: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    for (const payment of failedPayments) {
      errors.push({
        id: `payment-${payment.id}`,
        type: 'PAYMENT_FAILED',
        message: `Payment from ${payment.invoice.customerName} failed`,
        context: payment.failureReason || 'Unknown reason',
        timestamp: payment.createdAt.toISOString(),
        resolved: false,
      });
    }

    // Get failed SMS deliveries
    const failedSms = await db.paymentLinkSent.findMany({
      where: {
        tenantId,
        deliveryStatus: DeliveryStatus.FAILED,
        createdAt: { gte: thirtyDaysAgo },
      },
      include: {
        invoice: {
          select: {
            customerName: true,
            invoiceNumber: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    for (const sms of failedSms) {
      errors.push({
        id: `sms-${sms.id}`,
        type: 'SMS_FAILED',
        message: `SMS to ${sms.invoice.customerName} failed to deliver`,
        context: sms.failureReason || 'Delivery failed',
        timestamp: sms.createdAt.toISOString(),
        resolved: false,
      });
    }

    // Sort by timestamp (newest first)
    errors.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Filter resolved if not requested
    const filteredErrors = includeResolved ? errors : errors.filter((e) => !e.resolved);

    return NextResponse.json({ errors: filteredErrors });
  } catch (error) {
    console.error('Client errors failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch errors' },
      { status: 500 }
    );
  }
}
