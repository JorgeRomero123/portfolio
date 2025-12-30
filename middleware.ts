import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Add pathname to headers for layout detection
  const response = NextResponse.next();
  response.headers.set('x-pathname', pathname);

  // Protect /admin routes (except login page)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!req.auth) {
      const loginUrl = new URL('/admin/login', req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
