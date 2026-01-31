import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { db } from '@/lib/db';
import { z } from 'zod';

const signupSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyName, email, password } = signupSchema.parse(body);

    const existingTenant = await db.tenant.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingTenant) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    const passwordHash = await hash(password, 12);

    const tenant = await db.tenant.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        companyName,
      },
    });

    // Create default policy
    await db.policy.create({
      data: {
        tenantId: tenant.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
