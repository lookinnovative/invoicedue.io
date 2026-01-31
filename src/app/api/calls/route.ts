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
    const outcome = searchParams.get('outcome');

    const where: { tenantId: string; outcome?: string } = {
      tenantId: session.user.id,
    };

    if (outcome && outcome !== 'all') {
      where.outcome = outcome as 'ANSWERED' | 'VOICEMAIL' | 'NO_ANSWER' | 'BUSY' | 'WRONG_NUMBER' | 'DISCONNECTED';
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
