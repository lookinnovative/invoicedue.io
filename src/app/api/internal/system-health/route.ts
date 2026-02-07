import { NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/internal/permissions';
import {
  getSystemHealthMetrics,
  getCallMetrics,
  getPaymentMetrics,
  getRecentFailures,
} from '@/lib/internal/aggregations';

export async function GET() {
  try {
    // Verify admin access
    const admin = await verifyAdminAccess();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [health, callMetrics, paymentMetrics, recentFailures] = await Promise.all([
      getSystemHealthMetrics(),
      getCallMetrics(7),
      getPaymentMetrics(),
      getRecentFailures(10),
    ]);

    return NextResponse.json({
      health,
      callMetrics,
      paymentMetrics,
      recentFailures,
    });
  } catch (error) {
    console.error('Failed to get system health:', error);
    return NextResponse.json({ error: 'Failed to get system health' }, { status: 500 });
  }
}
