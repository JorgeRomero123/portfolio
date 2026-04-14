import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

const PRINT_DASHBOARD_USER = 'admin';
const PRINT_DASHBOARD_PASS = '1234';

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Add pathname to headers for layout detection
  const response = NextResponse.next();
  response.headers.set('x-pathname', pathname);

  // Basic auth on /print-dashboard
  if (pathname.startsWith('/print-dashboard')) {
    const header = req.headers.get('authorization');
    const expected =
      'Basic ' + Buffer.from(`${PRINT_DASHBOARD_USER}:${PRINT_DASHBOARD_PASS}`).toString('base64');
    if (header !== expected) {
      return new NextResponse('Auth required', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="Print Dashboard"' },
      });
    }
  }

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
