'use server';

import { hash } from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { resolve } from 'path';

function getDbUrl(): string {
  const raw = process.env.DATABASE_URL || 'file:./prisma/dev.db';
  if (raw.startsWith('file:./') || raw.startsWith('file:../')) {
    return `file:${resolve(process.cwd(), raw.slice('file:'.length))}`;
  }
  return raw;
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    const adapter = new PrismaLibSql({ url: getDbUrl() }) as any;
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
  return globalForPrisma.prisma;
}

export async function signUp(email: string, password: string, name: string) {
  const prisma = getPrisma();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: 'Email already in use' };
  }

  const hashed = await hash(password, 12);
  const user = await prisma.user.create({
    data: { email, password: hashed, name }
  });

  // Every account starts inside a personal workspace (optional Orgs feature).
  // Failures here must not break sign-up — the workspaces page offers creation.
  try {
    const guard = await import('@/lib/auth/guard');
    if (typeof guard.createPersonalOrganization === 'function') {
      await guard.createPersonalOrganization(user.id, name);
    }
  } catch {
    // ignore — user can create a workspace later
  }

  return { success: true, userId: user.id };
}
