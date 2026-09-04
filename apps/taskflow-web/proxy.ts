import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getCurrentSession } from '@/lib/auth';

const PROTECTED_ROUTES = [
  '/portfolio',
  '/forex-dashboard',
  '/property',
  '/advisory',
  '/trainings',
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route requires session verification
  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const session = await getCurrentSession(request);

  // Redirect to login if unauthenticated
  if (!session) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Example: Subscription access check via REST Backend call
  if (pathname.startsWith('/forex-dashboard')) {
    try {
      const accessCheck = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_REST_URL}/api/subscriptions/verify-forex`,
        {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        }
      );

      const result = await accessCheck.json();
      if (!result.success || !result.response.hasAccess) {
        return NextResponse.redirect(new URL('/pricing', request.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/500', request.url));
    }
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|studio).*)'],
};
