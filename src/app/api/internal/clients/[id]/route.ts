import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/internal/permissions';
import { db } from '@/lib/db';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Verify admin access
    const admin = await verifyAdminAccess();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const client = await db.tenant.findUnique({
      where: { id },
      include: {
        policy: true,
        invoices: {
          take: 50,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            invoiceNumber: true,
            customerName: true,
            amount: true,
            status: true,
            dueDate: true,
            callAttempts: true,
            lastCallOutcome: true,
            createdAt: true,
          },
        },
        callLogs: {
          take: 50,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            phoneNumber: true,
            outcome: true,
            durationSeconds: true,
            startedAt: true,
            vapiCallId: true,
          },
        },
        payments: {
          take: 50,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            amount: true,
            status: true,
            stripePaymentIntentId: true,
            paidAt: true,
            createdAt: true,
          },
        },
        usageRecords: {
          take: 3,
          orderBy: { periodStart: 'desc' },
        },
        _count: {
          select: {
            invoices: true,
            callLogs: true,
            payments: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Get recent events for this client
    const events = await db.event.findMany({
      where: { tenantId: id },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ client, events });
  } catch (error) {
    console.error('Failed to get client:', error);
    return NextResponse.json({ error: 'Failed to get client' }, { status: 500 });
  }
}
