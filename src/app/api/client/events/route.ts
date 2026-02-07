import { NextRequest, NextResponse } from 'next/server';
import { getClientTenantId } from '@/lib/client/permissions';
import { db } from '@/lib/db';
import { EntityType } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const tenantId = await getClientTenantId();

    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    const where: { tenantId: string; entityType?: EntityType } = { tenantId };
    if (type && Object.values(EntityType).includes(type as EntityType)) {
      where.entityType = type as EntityType;
    }

    const events = await db.event.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        eventType: true,
        entityType: true,
        payload: true,
        createdAt: true,
      },
    });

    // Transform events into human-readable format
    const formattedEvents = events.map((event) => {
      const payload = event.payload as Record<string, unknown>;
      
      // Generate a human-readable description
      let description = event.eventType;
      if (payload.customerName) {
        description = `${event.eventType} for ${payload.customerName}`;
      } else if (payload.invoiceNumber) {
        description = `${event.eventType} - Invoice ${payload.invoiceNumber}`;
      }

      return {
        id: event.id,
        type: event.eventType,
        description,
        entityType: event.entityType,
        timestamp: event.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ events: formattedEvents });
  } catch (error) {
    console.error('Client events failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
