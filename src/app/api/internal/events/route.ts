import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/internal/permissions';
import { db } from '@/lib/db';
import { EntityType } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const admin = await verifyAdminAccess();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const entityType = searchParams.get('entityType') as EntityType | null;
    const eventType = searchParams.get('eventType') || '';
    const clientId = searchParams.get('clientId') || '';

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (entityType) {
      where.entityType = entityType;
    }

    if (eventType) {
      where.eventType = { contains: eventType };
    }

    if (clientId) {
      where.tenantId = clientId;
    }

    const [events, total] = await Promise.all([
      db.event.findMany({
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
        },
      }),
      db.event.count({ where }),
    ]);

    return NextResponse.json({
      events,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Failed to get events:', error);
    return NextResponse.json({ error: 'Failed to get events' }, { status: 500 });
  }
}
