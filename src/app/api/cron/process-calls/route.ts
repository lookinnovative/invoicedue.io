import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkUsageBeforeCall, recordUsage } from '@/lib/usage';
import { initiateCall, getCallStatus, mapVapiOutcome } from '@/lib/vapi';
import { InvoiceStatus, CallOutcome } from '@prisma/client';

// Verify cron secret for Vercel
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (process.env.APP_ENV === 'development') return true;
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);
    const dayOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now.getDay()];

    // Get all tenants with policies
    const policies = await db.policy.findMany({
      where: {
        paymentLink: { not: null },
        callDays: { has: dayOfWeek },
      },
      include: {
        tenant: true,
      },
    });

    let callsInitiated = 0;
    let callsSkipped = 0;

    for (const policy of policies) {
      // Check if current time is within call window
      if (currentTime < policy.callWindowStart || currentTime > policy.callWindowEnd) {
        continue;
      }

      // Check usage limit
      const canMakeCalls = await checkUsageBeforeCall(policy.tenantId);
      if (!canMakeCalls) {
        callsSkipped++;
        continue;
      }

      // Get invoices ready for follow-up
      const invoices = await db.invoice.findMany({
        where: {
          tenantId: policy.tenantId,
          status: { in: [InvoiceStatus.PENDING, InvoiceStatus.IN_PROGRESS] },
          callAttempts: { lt: policy.maxAttempts },
          OR: [
            { nextCallDate: null },
            { nextCallDate: { lte: new Date(today) } },
          ],
        },
        take: 5, // Limit concurrent calls per tenant
      });

      for (const invoice of invoices) {
        // Check if invoice should be called today based on cadence
        const dueDate = new Date(invoice.dueDate);
        const daysOverdue = Math.floor(
          (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Only call if days overdue matches a cadence day
        const shouldCall = policy.cadenceDays.some((day) => {
          if (invoice.callAttempts === 0) {
            return daysOverdue >= day;
          }
          return daysOverdue >= day;
        });

        if (!shouldCall && invoice.callAttempts === 0) {
          continue;
        }

        // Check usage again before each call
        const stillCanCall = await checkUsageBeforeCall(policy.tenantId);
        if (!stillCanCall) {
          callsSkipped++;
          break;
        }

        // Initiate call
        const vapiCallId = await initiateCall(invoice, policy, policy.tenant);

        if (vapiCallId) {
          // Create call log
          await db.callLog.create({
            data: {
              tenantId: policy.tenantId,
              invoiceId: invoice.id,
              phoneNumber: invoice.phoneNumber,
              startedAt: new Date(),
              vapiCallId,
            },
          });

          // Update invoice status
          await db.invoice.update({
            where: { id: invoice.id },
            data: {
              status: InvoiceStatus.IN_PROGRESS,
            },
          });

          callsInitiated++;
        } else {
          callsSkipped++;
        }
      }
    }

    // Reconcile pending calls that might have missed webhooks
    let callsReconciled = 0;
    const pendingCalls = await db.callLog.findMany({
      where: {
        outcome: CallOutcome.PENDING,
        startedAt: {
          lt: new Date(now.getTime() - 5 * 60 * 1000), // Started more than 5 mins ago
        },
        vapiCallId: { not: null },
      },
      take: 10,
    });

    for (const call of pendingCalls) {
      if (!call.vapiCallId) continue;
      
      try {
        const status = await getCallStatus(call.vapiCallId);
        if (status) {
          const outcome = mapVapiOutcome(status.status) as CallOutcome;
          
          await db.callLog.update({
            where: { id: call.id },
            data: {
              endedAt: new Date(),
              durationSeconds: status.duration,
              outcome,
            },
          });

          // Record usage
          if (status.duration > 0) {
            await recordUsage(call.tenantId, status.duration);
          }

          // Update invoice
          const invoice = await db.invoice.findUnique({
            where: { id: call.invoiceId },
          });
          
          if (invoice) {
            const policy = await db.policy.findUnique({
              where: { tenantId: call.tenantId },
            });
            
            const newAttempts = invoice.callAttempts + 1;
            let newStatus: InvoiceStatus = invoice.status;
            
            if (outcome === CallOutcome.ANSWERED) {
              newStatus = InvoiceStatus.COMPLETED;
            } else if (newAttempts >= (policy?.maxAttempts || 5)) {
              newStatus = InvoiceStatus.FAILED;
            }

            await db.invoice.update({
              where: { id: call.invoiceId },
              data: {
                callAttempts: newAttempts,
                lastCallOutcome: outcome,
                status: newStatus,
              },
            });
          }

          callsReconciled++;
        }
      } catch (error) {
        console.error('Failed to reconcile call:', call.id, error);
      }
    }

    return NextResponse.json({
      success: true,
      callsInitiated,
      callsSkipped,
      callsReconciled,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json(
      { error: 'Cron job failed' },
      { status: 500 }
    );
  }
}
