import bcrypt from 'bcryptjs';
import type { Adapter } from '@auth/core/adapters';
import CredentialsProvider from 'next-auth/providers/credentials';
import NextAuth from 'next-auth';

async function getAuthConfig(): Promise<any> {
  const dbUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db';
  let adapter: Adapter;

  if (dbUrl.startsWith('file:')) {
    const { PrismaLibSql } = await import('@prisma/adapter-libsql');
    adapter = new PrismaLibSql({ url: dbUrl }) as any;
  } else {
    throw new Error(`Unsupported database URL format: ${dbUrl}`);
  }

  return {
    // Auth.js v5 requires AUTH_SECRET (falls back to NEXTAUTH_SECRET in some setups).
    // Set explicitly so MissingSecret never triggers even if env naming differs.
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    trustHost: true,
    session: { strategy: 'jwt' },
    adapter,
    providers: [
      CredentialsProvider({
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
          const prisma = new PrismaClient({
            adapter: new PrismaLibSql({ url: dbUrl }) as any
          });

          try {
            const user = await prisma.user.findUnique({
              where: { email: credentials.email as string }
            });

            if (!user || !user.password) {
              return null;
            }

            const valid = await bcrypt.compare(credentials.password as string, user.password);
            if (!valid) {
              return null;
            }

            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role
            };
          } finally {
            await prisma.$disconnect();
          }
        }
      })
    ],
    callbacks: {
      jwt(params: { token: Record<string, any>; user: { role: string; id: string } }) {
        const { token, user } = params;
        if (user) {
          token.role = user.role;
          token.id = user.id;
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
}

const NextAuthFn = (NextAuth as any).default || NextAuth;
const { handlers } = NextAuthFn(await getAuthConfig());

export const { GET, POST } = handlers;
