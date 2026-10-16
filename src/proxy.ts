import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname } = new URL(request.url);

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    // Read the auth cookie directly — if it exists, user is authenticated.
    // Works with both secure (__Secure-authjs.session-token) and plain cookie names.
    const sessionCookie =
      request.cookies.get('authjs.session-token')?.value ||
      request.cookies.get('__Secure-authjs.session-token')?.value;
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/auth/sign-in', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/api/(.*)'
  ]
};
