'use server'

import { hash } from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const DB_URL = process.env.DATABASE_URL || 'file:./prisma/dev.db'
const adapter = new PrismaLibSql({ url: DB_URL }) as any
const prisma = new PrismaClient({ adapter })

export async function signUp(email: string, password: string, name: string) {
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { error: 'Email already in use' }
  }

  const hashed = await hash(password, 12)
  const user = await prisma.user.create({
    data: { email, password: hashed, name }
  })

  await prisma.$disconnect()

  return { success: true, userId: user.id }
}
