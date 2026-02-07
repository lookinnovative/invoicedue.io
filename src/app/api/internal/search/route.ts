import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/internal/permissions';
import { globalSearch } from '@/lib/internal/search';

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const admin = await verifyAdminAccess();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const results = await globalSearch({ query, limit });

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search failed:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
