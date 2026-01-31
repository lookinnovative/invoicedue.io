import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    // In MVP, we just log the request
    // Real implementation would send an email
    console.log('Password reset requested for:', email);
    
    // Always return success (don't reveal if email exists)
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
