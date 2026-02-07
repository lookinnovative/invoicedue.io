import { NextResponse } from 'next/server';
import { verifyClientAccess } from '@/lib/client/permissions';

export async function GET() {
  try {
    const user = await verifyClientAccess();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Client verify failed:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}
