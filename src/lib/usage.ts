import { db } from './db';
import { generatePeriodDates } from './utils';
import { Decimal } from '@prisma/client/runtime/library';

export interface UsageStatus {
  minutesUsed: number;
  minutesAllocated: number;
  percentUsed: number;
  warningLevel: 'none' | 'soft' | 'critical' | 'hard';
  canMakeCalls: boolean;
}

export async function getOrCreateUsageRecord(tenantId: string) {
  const { start, end } = generatePeriodDates();

  let record = await db.usageRecord.findUnique({
    where: {
      tenantId_periodStart: {
        tenantId,
        periodStart: start,
      },
    },
  });

  if (!record) {
    record = await db.usageRecord.create({
      data: {
        tenantId,
        periodStart: start,
        periodEnd: end,
        minutesAllocated: 100, // Default allocation for MVP
        minutesUsed: new Decimal(0),
      },
    });
  }

  return record;
}

export async function getUsageStatus(tenantId: string): Promise<UsageStatus> {
  const record = await getOrCreateUsageRecord(tenantId);
  
  const minutesUsed = Number(record.minutesUsed);
  const minutesAllocated = record.minutesAllocated;
  const percentUsed = minutesAllocated > 0 
    ? (minutesUsed / minutesAllocated) * 100 
    : 0;

  let warningLevel: UsageStatus['warningLevel'] = 'none';
  if (percentUsed >= 100) {
    warningLevel = 'hard';
  } else if (percentUsed >= 95) {
    warningLevel = 'critical';
  } else if (percentUsed >= 80) {
    warningLevel = 'soft';
  }

  return {
    minutesUsed,
    minutesAllocated,
    percentUsed: Math.min(percentUsed, 100),
    warningLevel,
    canMakeCalls: percentUsed < 100,
  };
}

export async function recordUsage(
  tenantId: string,
  durationSeconds: number
): Promise<void> {
  const record = await getOrCreateUsageRecord(tenantId);
  const minutesToAdd = durationSeconds / 60;

  await db.usageRecord.update({
    where: { id: record.id },
    data: {
      minutesUsed: {
        increment: minutesToAdd,
      },
    },
  });
}

export async function checkUsageBeforeCall(tenantId: string): Promise<boolean> {
  const status = await getUsageStatus(tenantId);
  return status.canMakeCalls;
}
