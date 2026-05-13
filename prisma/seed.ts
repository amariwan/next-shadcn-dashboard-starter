import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import bcrypt from 'bcryptjs'

import { resolve } from 'path'

const DB_URL = process.env.DATABASE_URL || `file:${resolve(process.cwd(), 'prisma', 'dev.db')}`
const adapter = new PrismaLibSql({ url: DB_URL }) as any
const prisma = new PrismaClient({ adapter })

async function main() {
  const email = 'admin@example.com'
  const password = 'admin123'
  const hashedPassword = await bcrypt.hash(password, 12)

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: 'Admin User',
      password: hashedPassword,
      role: 'admin'
    }
  })

  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      name: 'Regular User',
      password: hashedPassword,
      role: 'user'
    }
  })

  console.log('Seed complete!')
  console.log(`Admin: ${admin.email} / ${password}`)
  console.log(`User: ${user.email} / ${password}`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => await prisma.$disconnect())
