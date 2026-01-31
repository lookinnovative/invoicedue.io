import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUsageStatus, getOrCreateUsageRecord } from '@/lib/usage';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [status, record] = await Promise.all([
      getUsageStatus(session.user.id),
      getOrCreateUsageRecord(session.user.id),
    ]);

    return NextResponse.json({
      ...status,
      periodStart: record.periodStart,
      periodEnd: record.periodEnd,
    });
  } catch (error) {
    console.error('Failed to fetch usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage' },
      { status: 500 }
    );
  }
}
