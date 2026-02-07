import { NextRequest, NextResponse } from 'next/server';
import { getClientTenantId } from '@/lib/client/permissions';
import { db } from '@/lib/db';
import { InvoiceStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const tenantId = await getClientTenantId();

    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: { tenantId: string; status?: InvoiceStatus } = { tenantId };
    if (status && Object.values(InvoiceStatus).includes(status as InvoiceStatus)) {
      where.status = status as InvoiceStatus;
    }

    const invoices = await db.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        invoiceNumber: true,
        customerName: true,
        amount: true,
        dueDate: true,
        status: true,
        description: true,
        callAttempts: true,
        lastCallOutcome: true,
      },
    });

    return NextResponse.json({
      invoices: invoices.map((inv) => ({
        ...inv,
        amount: Number(inv.amount),
        dueDate: inv.dueDate.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Client invoices failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}
