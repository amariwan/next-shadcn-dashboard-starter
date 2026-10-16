import { signIn as nextSignIn, signOut as nextSignOut } from 'next-auth/react';

export { signIn, signOut } from 'next-auth/react';

async function getAuthConfig(dbUrl: string): Promise<any> {
  let adapter: any;

  if (dbUrl.startsWith('file:')) {
    const { PrismaLibSql } = await import('@prisma/adapter-libsql');
    adapter = new PrismaLibSql({ url: dbUrl }) as any;
  } else {
    throw new Error(`Unsupported database URL format: ${dbUrl}`);
  }

  const config: any = {
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    trustHost: true,
    session: { strategy: 'jwt' },
    adapter,
    providers: [
      (await import('next-auth/providers/credentials')).default({
        name: 'credentials',
        credentials: {
          email: { label: 'Email', type: 'email' },
          password: { label: 'Password', type: 'password' }
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const { PrismaClient } = await import('@prisma/client');
          const { PrismaLibSql } = await import('@prisma/adapter-libsql');
          const prisma = new PrismaClient({ adapter: new PrismaLibSql({ url: dbUrl }) as any });

          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string }
          });

          await prisma.$disconnect();

          if (!user || !user.password) {
            return null;
          }

          const bcrypt = await import('bcryptjs');
          const valid = await bcrypt.default.compare(credentials.password as string, user.password);
          if (!valid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            locale: user.locale ?? 'en'
          };
        }
      })
    ],
    callbacks: {
      jwt(params: { token: Record<string, any>; user: { role: string; id: string; locale?: string } }) {
        const { token, user } = params;
        if (user) {
          token.role = user.role;
          token.id = user.id;
          if (user.locale) {
            token.locale = user.locale;
          }
        }
        return token;
      },
      async session(params: {
        session: { user: Record<string, any> };
        token: Record<string, any>;
      }) {
        const { session, token } = params;
        if (session.user) {
          session.user.id = token.id;
          session.user.role = token.role;
          session.user.locale = token.locale ?? 'en';
          // Attach org/team context (self-hosted Orgs feature). Computed live
          // from memberships + the sticky `active-org-id` cookie so switching
          // orgs never needs a JWT rotation.
          try {
            const { getSessionOrganizations } = await import('@/lib/auth/organization');
            const userId = (token.id ?? session.user.id) as string | undefined;
            if (userId) {
              const orgs = await getSessionOrganizations(userId);
              session.user.organizations = orgs.organizations;
              session.user.activeOrgId = orgs.activeOrgId;
              session.user.activeOrgRole = orgs.activeOrgRole;
            } else {
              session.user.organizations = [];
              session.user.activeOrgId = null;
              session.user.activeOrgRole = null;
            }
          } catch {
            session.user.organizations = [];
            session.user.activeOrgId = null;
            session.user.activeOrgRole = null;
          }
        }
        return session;
      }
    },
    pages: {
      signIn: '/auth/sign-in'
    }
  };

  return config;
}

export async function auth() {
  const NextAuthMod = await import('next-auth');
  const NextAuthFn = (NextAuthMod as any).default || NextAuthMod;

  const dbUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db';
  const config = await getAuthConfig(dbUrl);
  const result = NextAuthFn(config);
  return result.auth();
}
