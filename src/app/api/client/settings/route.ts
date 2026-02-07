import { NextResponse } from 'next/server';
import { getClientTenantId } from '@/lib/client/permissions';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const tenantId = await getClientTenantId();

    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: {
        companyName: true,
        email: true,
        timezone: true,
        policy: {
          select: {
            callWindowStart: true,
            callWindowEnd: true,
            callDays: true,
            maxAttempts: true,
            paymentLink: true,
          },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    return NextResponse.json({
      companyName: tenant.companyName,
      email: tenant.email,
      timezone: tenant.timezone,
      paymentLink: tenant.policy?.paymentLink ?? null,
      policy: tenant.policy
        ? {
            callWindowStart: tenant.policy.callWindowStart,
            callWindowEnd: tenant.policy.callWindowEnd,
            callDays: tenant.policy.callDays,
            maxAttempts: tenant.policy.maxAttempts,
          }
        : null,
    });
  } catch (error) {
    console.error('Client settings failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}
