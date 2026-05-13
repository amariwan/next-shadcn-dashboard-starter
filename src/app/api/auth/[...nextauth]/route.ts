import bcrypt from 'bcryptjs'
import type { Adapter } from '@auth/core/adapters'
import CredentialsProvider from 'next-auth/providers/credentials'
import NextAuth from 'next-auth'

async function getAuthConfig(): Promise<any> {
  const dbUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db'
  let adapter: Adapter

  if (dbUrl.startsWith('file:')) {
    const { PrismaLibSql } = await import('@prisma/adapter-libsql')
    adapter = new PrismaLibSql({ url: dbUrl }) as any
  } else {
    throw new Error(`Unsupported database URL format: ${dbUrl}`)
  }

  return {
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
            return null
          }

          const { default: { PrismaClient } } = await import('@prisma/client')
          const { PrismaLibSql } = await import('@prisma/adapter-libsql')
          const prisma = new PrismaClient({ adapter: new PrismaLibSql({ url: dbUrl }) as any })

          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string }
          })

          await prisma.$disconnect()

          if (!user || !user.password) {
            return null
          }

          const valid = await bcrypt.compare(credentials.password as string, user.password)
          if (!valid) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        }
      })
    ],
    callbacks: {
      jwt(params: { token: Record<string, any>; user: { role: string; id: string } }) {
        const { token, user } = params
        if (user) {
          token.role = user.role
          token.id = user.id
        }
        return token
      },
      session(params: { session: { user: Record<string, any> }; token: Record<string, any> }) {
        const { session, token } = params
        if (session.user) {
          session.user.id = token.id
          session.user.role = token.role
        }
        return session
      }
    },
    pages: {
      signIn: '/auth/sign-in'
    }
  }
}

const NextAuthFn = (NextAuth as any).default || NextAuth
const { handlers } = NextAuthFn(getAuthConfig)

export const { GET, POST } = handlers
