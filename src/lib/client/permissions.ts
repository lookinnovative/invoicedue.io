import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export interface ClientUser {
  id: string;
  email: string;
  companyName: string;
  isAdmin: boolean;
}

/**
 * Verify that the current user has client admin access.
 * All authenticated tenants have access to their own client admin.
 * Returns the user object if access is granted, null otherwise.
 */
export async function verifyClientAccess(): Promise<ClientUser | null> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return null;
    }

    const tenant = await db.tenant.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        companyName: true,
        isAdmin: true,
      },
    });

    if (!tenant) {
      return null;
    }

    return {
      id: tenant.id,
      email: tenant.email,
      companyName: tenant.companyName,
      isAdmin: tenant.isAdmin,
    };
  } catch (error) {
    console.error('Client access verification failed:', error);
    return null;
  }
}

/**
 * Get the tenant ID for the current session.
 * This is the scoping key for all client-facing data access.
 */
export async function getClientTenantId(): Promise<string | null> {
  const user = await verifyClientAccess();
  return user?.id ?? null;
}
