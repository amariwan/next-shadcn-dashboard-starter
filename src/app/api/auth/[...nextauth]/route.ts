import bcrypt from 'bcryptjs';
import type { Adapter } from '@auth/core/adapters';
import CredentialsProvider from 'next-auth/providers/credentials';
import NextAuth from 'next-auth';

import path from 'path';

async function getAuthConfig(): Promise<any> {
  const rawDbUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db';

  // Normalize relative SQLite file paths to absolute paths so the libsql
  // adapter resolves them consistently regardless of the working directory.
  let dbUrl = rawDbUrl;
  if (dbUrl.startsWith('file:')) {
    const filePath = dbUrl.slice('file:'.length);
    if (filePath && !path.isAbsolute(filePath)) {
      dbUrl = `file:${path.resolve(/*turbopackIgnore: true*/ process.cwd(), filePath)}`;
    }
  }

  // libsql (SQLite/Turso) URLs are all served by the Prisma libsql adapter,
  // including local `file:` paths, remote `libsql:` endpoints and HTTP(S)
  // endpoints exposed by Turso/libSQL.
  const isLibSqlUrl =
    dbUrl.startsWith('file:') ||
    dbUrl.startsWith('libsql:') ||
    dbUrl.startsWith('https:') ||
    dbUrl.startsWith('http:');

  let adapter: Adapter;

  if (isLibSqlUrl) {
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
