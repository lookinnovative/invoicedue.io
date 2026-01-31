import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: { tenantId: string; status?: string } = {
      tenantId: session.user.id,
    };

    if (status && status !== 'all') {
      where.status = status as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
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
