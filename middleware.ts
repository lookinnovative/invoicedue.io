import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/invoices',
  '/policy',
  '/history',
  '/settings',
];

// Internal admin routes - require authentication + isAdmin (admin check happens in layout)
const internalRoutes = ['/internal'];

// Client admin routes - require authentication (any authenticated tenant)
const clientAdminRoutes = ['/client'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this is a protected customer route
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Check if this is an internal admin route
  const isInternalRoute = internalRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Check if this is a client admin route
  const isClientAdminRoute = clientAdminRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // If not a protected, internal, or client admin route, allow through
  if (!isProtectedRoute && !isInternalRoute && !isClientAdminRoute) {
    return NextResponse.next();
  }

  // Check for session token
  const sessionToken =
    request.cookies.get('__Secure-next-auth.session-token')?.value ||
    request.cookies.get('next-auth.session-token')?.value;

  // If no session token, redirect to login
  if (!sessionToken) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // For internal routes, the admin check happens in the layout
  // (we can't verify isAdmin flag in middleware without a DB call)
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/invoices/:path*',
    '/policy/:path*',
    '/history/:path*',
    '/settings/:path*',
    '/internal/:path*',
    '/client/:path*',
  ],
};
