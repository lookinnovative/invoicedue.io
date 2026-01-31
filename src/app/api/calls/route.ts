import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { Prisma, CallOutcome } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const outcomeParam = searchParams.get('outcome');

    const where: Prisma.CallLogWhereInput = {
      tenantId: session.user.id,
    };

    if (
      outcomeParam &&
      outcomeParam !== 'all' &&
      Object.values(CallOutcome).includes(outcomeParam as CallOutcome)
    ) {
      where.outcome = outcomeParam as CallOutcome;
    }

    const calls = await db.callLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        invoice: {
          select: {
            id: true,
            customerName: true,
          },
        },
      },
    });

    return NextResponse.json(calls);
  } catch (error) {
    console.error('Failed to fetch calls:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calls' },
      { status: 500 }
    );
  }
}

