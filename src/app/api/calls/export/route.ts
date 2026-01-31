import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { formatDateTime, formatDuration } from '@/lib/utils';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const calls = await db.callLog.findMany({
      where: { tenantId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        invoice: {
          select: {
            customerName: true,
            invoiceNumber: true,
          },
        },
      },
    });

    const headers = ['Date/Time', 'Customer', 'Invoice #', 'Phone', 'Duration', 'Outcome'];
    const rows = calls.map((call) => [
      formatDateTime(call.startedAt),
      call.invoice.customerName,
      call.invoice.invoiceNumber || '',
      call.phoneNumber,
      formatDuration(call.durationSeconds),
      call.outcome.replace(/_/g, ' '),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="call-history.csv"`,
      },
    });
  } catch (error) {
    console.error('Export failed:', error);
    return NextResponse.json(
      { error: 'Export failed' },
      { status: 500 }
    );
  }
}
