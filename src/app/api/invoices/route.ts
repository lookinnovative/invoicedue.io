import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { Prisma, InvoiceStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');

    const where: Prisma.InvoiceWhereInput = {
      tenantId: session.user.id,
    };

    if (
      statusParam &&
      statusParam !== 'all' &&
      Object.values(InvoiceStatus).includes(statusParam as InvoiceStatus)
    ) {
      where.status = statusParam as InvoiceStatus;
    }

    const invoices = await db.invoice.findMany({
      where,
      orderBy: { dueDate: 'asc' },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Failed to fetch invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}
