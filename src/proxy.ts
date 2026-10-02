import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/lib/session-cookie';

// Optimistic check only: every admin page and Server Action verifies the session itself.
export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname !== '/admin/login' && !request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
