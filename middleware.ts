import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/admin', '/projects'];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login', '/register'];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const pathname = nextUrl.pathname;

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  );

  // Check if the current path is an auth route
  const isAuthRoute = authRoutes.some(route =>
    pathname.startsWith(route)
  );

  // Redirect to login if accessing protected route without authentication
  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL('/login', nextUrl);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to dashboard if accessing auth routes while already logged in
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl));
  }

  // Admin route protection
  if (pathname.startsWith('/admin') && isLoggedIn) {
    const userRole = req.auth?.user?.role;
    if (userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
