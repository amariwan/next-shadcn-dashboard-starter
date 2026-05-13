import type { Adapter } from '@auth/core/adapters'

export function getAdapter(): Adapter {
  const dbUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db'

  if (dbUrl.startsWith('file:')) {
    const { PrismaLibSql } = require('@prisma/adapter-libsql')
    const { createClient } = require('@libsql/client')
    const libsql = createClient({ url: dbUrl, native: true })
    return new PrismaLibSql(libsql)
  }

  throw new Error(`Unsupported database URL format: ${dbUrl}`)
}
