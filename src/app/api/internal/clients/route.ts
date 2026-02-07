import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/internal/permissions';
import { db } from '@/lib/db';

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
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { companyName: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [clients, total] = await Promise.all([
      db.tenant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          companyName: true,
          timezone: true,
          createdAt: true,
          _count: {
            select: {
              invoices: true,
              callLogs: true,
              payments: true,
            },
          },
        },
      }),
      db.tenant.count({ where }),
    ]);

    return NextResponse.json({
      clients,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Failed to get clients:', error);
    return NextResponse.json({ error: 'Failed to get clients' }, { status: 500 });
  }
}
