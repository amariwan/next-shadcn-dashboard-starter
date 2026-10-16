import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { getOrgPrisma } from '@/lib/auth/organization';
import { compare } from 'bcryptjs';

const forgotSchema = z.object({
  email: z.string().email('A valid email is required')
});

const resetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function POST(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const action = searchParams.get('action');

  if (action === 'forgot-password') {
    return handleForgotPassword(request);
  }
  if (action === 'reset-password') {
    return handleResetPassword(request);
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

async function handleForgotPassword(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = forgotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    );
  }

  const prisma = getOrgPrisma();
  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() }
  });

  // Always return success to prevent email enumeration
  if (!user) {
    return NextResponse.json({ success: true });
  }

  // Delete any existing reset tokens for this user
  await prisma.verificationToken.deleteMany({
    where: { identifier: user.email, token: { contains: 'reset-' } }
  });

  const token = `reset-${randomBytes(32).toString('hex')}`;
  await prisma.verificationToken.create({
    data: {
      identifier: user.email,
      token,
      expires: new Date(Date.now() + RESET_TTL_MS)
    }
  });

  const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password/${token}`;

  // In development, log the reset URL. In production, send via email provider.
  console.log(`[Password Reset] ${user.email}: ${resetUrl}`);

  return NextResponse.json({ success: true, resetUrl });
}

async function handleResetPassword(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = resetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    );
  }

  const prisma = getOrgPrisma();
  const token = await prisma.verificationToken.findUnique({
    where: { token: parsed.data.token }
  });

  if (!token || token.expires.getTime() < Date.now()) {
    return NextResponse.json({ error: 'Reset token is invalid or expired' }, { status: 404 });
  }

  const user = await prisma.user.findUnique({
    where: { email: token.identifier }
  });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const hashed = await compare(parsed.data.password, user.password);
  if (hashed) {
    return NextResponse.json(
      { error: 'New password must be different from current password' },
      { status: 400 }
    );
  }

  const bcrypt = await import('bcryptjs');
  const newHash = await bcrypt.default.hash(parsed.data.password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { password: newHash }
    }),
    prisma.verificationToken.delete({
      where: { token: parsed.data.token }
    })
  ]);

  return NextResponse.json({ success: true });
}
