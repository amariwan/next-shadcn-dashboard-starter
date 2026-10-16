import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from '@/i18n/routing';
import { hasLocale } from 'next-intl';

const handleI18nRouting = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Never localize API routes or monitoring tunnel
  if (pathname.startsWith('/api') || pathname.startsWith('/monitoring')) {
    return NextResponse.next();
  }

  // 2. Identify if the requested route is a protected dashboard route
  const segments = pathname.split('/').filter(Boolean);
  const isFirstSegmentLocale = segments[0] ? hasLocale(routing.locales, segments[0]) : false;
  const pathWithoutLocale = isFirstSegmentLocale
    ? '/' + segments.slice(1).join('/')
    : pathname;

  const isDashboardRoute = pathWithoutLocale.startsWith('/dashboard');

  if (isDashboardRoute) {
    // Read the auth cookie directly — works with plain and secure cookie names
    const sessionCookie =
      request.cookies.get('authjs.session-token')?.value ||
      request.cookies.get('__Secure-authjs.session-token')?.value;

    if (!sessionCookie) {
      const activeLocale = isFirstSegmentLocale
        ? segments[0]
        : request.cookies.get('NEXT_LOCALE')?.value || routing.defaultLocale;

      const isDefaultLocale = activeLocale === routing.defaultLocale;
      const signInPath =
        isDefaultLocale && routing.localePrefix === 'as-needed'
          ? '/auth/sign-in'
          : `/${activeLocale}/auth/sign-in`;

      const signInUrl = new URL(signInPath, request.url);
      signInUrl.searchParams.set(
        'callbackUrl',
        request.nextUrl.pathname + request.nextUrl.search
      );
      return NextResponse.redirect(signInUrl);
    }
  }

  // 3. Delegate internationalized routing, redirects, and rewrites to next-intl
  return handleI18nRouting(request);
}

export const config = {
  matcher: [
    // Match all pathnames except for:
    // - /api routes
    // - /_next (Next.js internals)
    // - /_vercel (Vercel internals)
    // - /monitoring (Sentry tunnel)
    // - all static files with file extensions
    '/((?!api|_next|_vercel|monitoring|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)'
  ]
};
