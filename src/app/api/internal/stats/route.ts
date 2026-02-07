import { NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/internal/permissions';
import { getQuickStats } from '@/lib/internal/search';

export async function GET() {
  try {
    // Verify admin access
    const admin = await verifyAdminAccess();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await getQuickStats();

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to get stats:', error);
    return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 });
  }
}
