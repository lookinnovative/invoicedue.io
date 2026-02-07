import { NextRequest, NextResponse } from 'next/server';
import { getClientTenantId } from '@/lib/client/permissions';
import { db } from '@/lib/db';
import { PaymentStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const tenantId = await getClientTenantId();

    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: { tenantId: string; status?: PaymentStatus } = { tenantId };
    if (status && Object.values(PaymentStatus).includes(status as PaymentStatus)) {
      where.status = status as PaymentStatus;
    }

    const payments = await db.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        invoice: {
          select: {
            invoiceNumber: true,
            customerName: true,
          },
        },
      },
    });

    return NextResponse.json({
      payments: payments.map((payment) => ({
        id: payment.id,
        invoiceNumber: payment.invoice.invoiceNumber,
        customerName: payment.invoice.customerName,
        amount: Number(payment.amount),
        status: payment.status,
        paidAt: payment.paidAt?.toISOString() ?? null,
        createdAt: payment.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Client payments failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}
