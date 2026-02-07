import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/internal/permissions';
import { db } from '@/lib/db';
import { CallOutcome } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const admin = await verifyAdminAccess();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const outcome = searchParams.get('outcome') as CallOutcome | null;
    const clientId = searchParams.get('clientId') || '';

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (outcome) {
      where.outcome = outcome;
    }

    if (clientId) {
      where.tenantId = clientId;
    }

    const [calls, total] = await Promise.all([
      db.callLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          tenant: {
            select: {
              id: true,
              companyName: true,
            },
          },
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              customerName: true,
            },
          },
        },
      }),
      db.callLog.count({ where }),
    ]);

    return NextResponse.json({
      calls,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Failed to get calls:', error);
    return NextResponse.json({ error: 'Failed to get calls' }, { status: 500 });
  }
}
