import { NextRequest, NextResponse } from 'next/server';
import { getClientTenantId } from '@/lib/client/permissions';
import { db } from '@/lib/db';
import { CallOutcome } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const tenantId = await getClientTenantId();

    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const outcome = searchParams.get('outcome');

    const where: { tenantId: string; outcome?: CallOutcome } = { tenantId };
    if (outcome && Object.values(CallOutcome).includes(outcome as CallOutcome)) {
      where.outcome = outcome as CallOutcome;
    }

    const calls = await db.callLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        invoice: {
          select: {
            invoiceNumber: true,
            customerName: true,
            phoneNumber: true,
          },
        },
      },
    });

    return NextResponse.json({
      calls: calls.map((call) => ({
        id: call.id,
        invoiceNumber: call.invoice.invoiceNumber,
        customerName: call.invoice.customerName,
        phoneNumber: call.invoice.phoneNumber,
        outcome: call.outcome,
        duration: call.durationSeconds,
        callDate: call.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Client calls failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calls' },
      { status: 500 }
    );
  }
}
