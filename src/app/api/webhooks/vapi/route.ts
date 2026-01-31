import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { recordUsage } from '@/lib/usage';
import { mapVapiOutcome, verifyVapiWebhook } from '@/lib/vapi';

interface VapiWebhookPayload {
  type: string;
  call: {
    id: string;
    status: string;
    duration?: number;
    metadata?: {
      tenantId: string;
      invoiceId: string;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('x-vapi-signature') || '';

    // Verify webhook signature in production
    if (process.env.APP_ENV === 'production') {
      if (!verifyVapiWebhook(payload, signature)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const data: VapiWebhookPayload = JSON.parse(payload);

    // Handle call ended event
    if (data.type === 'call-ended' || data.type === 'call.ended') {
      const { call } = data;
      const metadata = call.metadata;

      if (!metadata?.tenantId || !metadata?.invoiceId) {
        console.log('Missing metadata in webhook:', call.id);
        return NextResponse.json({ received: true });
      }

      const outcome = mapVapiOutcome(call.status);
      const duration = call.duration || 0;

      // Update call log
      const callLog = await db.callLog.findFirst({
        where: { vapiCallId: call.id },
      });

      if (callLog) {
        await db.callLog.update({
          where: { id: callLog.id },
          data: {
            endedAt: new Date(),
            durationSeconds: duration,
            outcome: outcome as 'ANSWERED' | 'VOICEMAIL' | 'NO_ANSWER' | 'BUSY' | 'WRONG_NUMBER' | 'DISCONNECTED',
          },
        });

        // Record usage
        if (duration > 0) {
          await recordUsage(metadata.tenantId, duration);
        }

        // Update invoice
        const invoice = await db.invoice.findUnique({
          where: { id: metadata.invoiceId },
        });

        if (invoice) {
          const newAttempts = invoice.callAttempts + 1;
          const policy = await db.policy.findUnique({
            where: { tenantId: metadata.tenantId },
          });

          let newStatus = invoice.status;
          let nextCallDate: Date | null = null;

          if (outcome === 'ANSWERED') {
            newStatus = 'COMPLETED';
          } else if (newAttempts >= (policy?.maxAttempts || 5)) {
            newStatus = 'FAILED';
          } else {
            newStatus = 'IN_PROGRESS';
            // Calculate next call date based on cadence
            if (policy?.cadenceDays) {
              const today = new Date();
              const dueDate = new Date(invoice.dueDate);
              const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
              
              const nextCadenceDay = policy.cadenceDays.find((d) => d > daysOverdue);
              if (nextCadenceDay) {
                nextCallDate = new Date(dueDate);
                nextCallDate.setDate(nextCallDate.getDate() + nextCadenceDay);
              }
            }
          }

          await db.invoice.update({
            where: { id: metadata.invoiceId },
            data: {
              callAttempts: newAttempts,
              lastCallOutcome: outcome,
              status: newStatus as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED',
              nextCallDate,
            },
          });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing failed:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
