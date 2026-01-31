import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const policy = await db.policy.findUnique({
      where: { tenantId: session.user.id },
    });

    return NextResponse.json(policy);
  } catch (error) {
    console.error('Failed to fetch policy:', error);
    return NextResponse.json(
      { error: 'Failed to fetch policy' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const policy = await db.policy.upsert({
      where: { tenantId: session.user.id },
      update: {
        cadenceDays: body.cadenceDays,
        maxAttempts: body.maxAttempts,
        callWindowStart: body.callWindowStart,
        callWindowEnd: body.callWindowEnd,
        callDays: body.callDays,
        greetingScript: body.greetingScript,
        voicemailScript: body.voicemailScript,
        paymentLink: body.paymentLink,
        smsEnabled: body.smsEnabled,
      },
      create: {
        tenantId: session.user.id,
        cadenceDays: body.cadenceDays,
        maxAttempts: body.maxAttempts,
        callWindowStart: body.callWindowStart,
        callWindowEnd: body.callWindowEnd,
        callDays: body.callDays,
        greetingScript: body.greetingScript,
        voicemailScript: body.voicemailScript,
        paymentLink: body.paymentLink,
        smsEnabled: body.smsEnabled,
      },
    });

    return NextResponse.json(policy);
  } catch (error) {
    console.error('Failed to save policy:', error);
    return NextResponse.json(
      { error: 'Failed to save policy' },
      { status: 500 }
    );
  }
}
