// =============================================================================
// INTERNAL ADMIN - PERMISSIONS
// =============================================================================
//
// Access control for the internal admin dashboard.
// v0: Simple email whitelist + isAdmin flag on Tenant
//
// =============================================================================

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export interface AdminUser {
  id: string;
  email: string;
  companyName: string;
  isAdmin: boolean;
}

// Admin emails whitelist - Add founder email(s) here
// These users will have admin access even if isAdmin flag is false
const ADMIN_EMAIL_WHITELIST: string[] = [
  // Add your email here during setup
  // 'founder@invoicedue.io',
];

/**
 * Verify if the current session has admin access
 * Returns the admin user if authorized, null otherwise
 */
export async function verifyAdminAccess(): Promise<AdminUser | null> {
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

    // Check if user is admin via flag or whitelist
    const isAdminByFlag = tenant.isAdmin;
    const isAdminByWhitelist = ADMIN_EMAIL_WHITELIST.includes(tenant.email.toLowerCase());

    if (!isAdminByFlag && !isAdminByWhitelist) {
      return null;
    }

    return {
      id: tenant.id,
      email: tenant.email,
      companyName: tenant.companyName,
      isAdmin: true,
    };
  } catch (error) {
    console.error('Admin access verification failed:', error);
    return null;
  }
}

/**
 * Check if a specific user ID has admin access
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const tenant = await db.tenant.findUnique({
      where: { id: userId },
      select: {
        email: true,
        isAdmin: true,
      },
    });

    if (!tenant) {
      return false;
    }

    return tenant.isAdmin || ADMIN_EMAIL_WHITELIST.includes(tenant.email.toLowerCase());
  } catch (error) {
    console.error('Admin check failed:', error);
    return false;
  }
}

/**
 * Grant admin access to a user by email
 * For initial setup, run this via Prisma Studio or a script
 */
export async function grantAdminAccess(email: string): Promise<boolean> {
  try {
    await db.tenant.update({
      where: { email: email.toLowerCase() },
      data: { isAdmin: true },
    });
    return true;
  } catch (error) {
    console.error('Failed to grant admin access:', error);
    return false;
  }
}
