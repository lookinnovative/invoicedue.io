import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = session.user.id;

    // Delete all call logs first (foreign key constraint)
    await db.callLog.deleteMany({
      where: { tenantId },
    });

    // Delete all invoices for this tenant
    const result = await db.invoice.deleteMany({
      where: { tenantId },
    });

    return NextResponse.json({ 
      success: true, 
      deleted: result.count,
      message: `Deleted ${result.count} invoices`
    });
  } catch (error) {
    console.error('Failed to delete invoices:', error);
    return NextResponse.json(
      { error: 'Failed to delete invoices' },
      { status: 500 }
    );
  }
}
