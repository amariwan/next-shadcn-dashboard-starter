import { NextRequest, NextResponse } from 'next/server';
import { getOrgPrisma } from '@/lib/auth/organization';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  const prisma = getOrgPrisma();
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token }
  });

  if (
    !verificationToken ||
    !verificationToken.identifier.startsWith('verify-') ||
    verificationToken.expires.getTime() < Date.now()
  ) {
    return NextResponse.json(
      { error: 'Verification link is invalid or expired' },
      { status: 404 }
    );
  }

  const email = verificationToken.identifier.replace('verify-', '');
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (user.emailVerified) {
    return NextResponse.json({ success: true, alreadyVerified: true });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() }
    }),
    prisma.verificationToken.delete({ where: { token } })
  ]);

  return NextResponse.json({ success: true });
}
