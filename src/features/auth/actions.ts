'use server';

import { hash } from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { randomBytes } from 'crypto';
import path from 'path';

function getDbUrl(): string {
  const raw = process.env.DATABASE_URL || 'file:./prisma/dev.db';
  // Keep the resolved path statically scoped (Turbopack build requirement).
  if (raw === 'file:./prisma/dev.db' || raw === 'file:prisma/dev.db') {
    return `file:${path.join(process.cwd(), 'prisma', 'dev.db')}`;
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

  // Send email verification (dev: logs link to console).
  try {
    await requestEmailVerification({ userId: user.id, email: user.email });
  } catch {
    // ignore — user can verify later
  }

  return { success: true, userId: user.id };
}

export async function requestEmailVerification({
  userId,
  email
}: {
  userId: string;
  email: string;
}) {
  const prisma = getPrisma();
  // Delete any existing verification tokens for this email
  await prisma.verificationToken.deleteMany({
    where: { identifier: `verify-${email}`, token: { contains: 'verify-' } }
  });

  const token = `verify-${randomBytes(32).toString('hex')}`;
  await prisma.verificationToken.create({
    data: {
      identifier: `verify-${email}`,
      token,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    }
  });

  const verifyUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/verify-email/${token}`;
  console.log(`[Email Verification] ${email}: ${verifyUrl}`);

  return { success: true, verifyUrl };
}
