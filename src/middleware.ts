import { NextResponse, NextRequest } from 'next/server'

// Minimal auth config for middleware (Edge runtime — no DB adapter)
// The full config with adapter is in route.ts for server components
async function getMiddlewareAuthConfig(): Promise<any> {
  const CredentialsProvider = (
    await import('next-auth/providers/credentials')
  ).default

  return {
    providers: [
      CredentialsProvider({
        name: 'credentials',
        credentials: {
          email: { label: 'Email', type: 'email' },
          password: { label: 'Password', type: 'password' }
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) {
            return null
          }
          return {
            id: 'current-user',
            name: 'Current User',
            email: credentials.email as string,
            role: 'user' as const
          }
        }
      })
    ],
    callbacks: {
      session(params: { session: { user: Record<string, any> }; token: Record<string, any> }) {
        const { session, token } = params
        if (session.user) {
          session.user.id = token.id
          session.user.email = token.email
        }
        return session
      }
    },
    pages: {
      signIn: '/auth/sign-in'
    }
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = new URL(request.url)

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    // Read the auth cookie directly — if it exists, user is authenticated
    const sessionCookie = request.cookies.get('authjs.session-token')?.value
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/auth/sign-in', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/api/(.*)'
  ]
}
