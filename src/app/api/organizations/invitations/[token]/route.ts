import { NextRequest, NextResponse } from 'next/server';
import { getOrgPrisma } from '@/lib/auth/organization';
import { getSessionOr401, err } from '../../_lib';

interface Params {
  params: Promise<{ token: string }>;
}

async function loadInvitation(token: string) {
  const prisma = getOrgPrisma();
  return prisma.organizationInvitation.findUnique({
    where: { token },
    include: { organization: true }
  });
}

/** Validate an invite for the signed-in user. */
export async function GET(_request: NextRequest, { params }: Params) {
  const { token } = await params;
  const sessionOrError = await getSessionOr401();
  if (sessionOrError instanceof NextResponse) return sessionOrError;
  const session = sessionOrError;

  const invitation = await loadInvitation(token);
  if (!invitation || invitation.acceptedAt || invitation.expiresAt.getTime() < Date.now()) {
    return err('Invitation is invalid or expired', 404);
  }

  const prisma = getOrgPrisma();
  const alreadyMember = await prisma.organizationMembership.findUnique({
    where: {
      userId_organizationId: {
        userId: session.user.id,
        organizationId: invitation.organizationId
      }
    }
  });

  return NextResponse.json({
    invitation: {
      organizationId: invitation.organizationId,
      organizationName: invitation.organization.name,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt
    },
    emailMatches: invitation.email.toLowerCase() === (session.user.email ?? '').toLowerCase(),
    alreadyMember: Boolean(alreadyMember)
  });
}

/** Accept an invite — the invite email must match the signed-in user. */
export async function POST(_request: NextRequest, { params }: Params) {
  const { token } = await params;
  const sessionOrError = await getSessionOr401();
  if (sessionOrError instanceof NextResponse) return sessionOrError;
  const session = sessionOrError;

  const prisma = getOrgPrisma();
  const invitation = await loadInvitation(token);
  if (!invitation || invitation.acceptedAt || invitation.expiresAt.getTime() < Date.now()) {
    return err('Invitation is invalid or expired', 404);
  }
  if (invitation.email.toLowerCase() !== (session.user.email ?? '').toLowerCase()) {
    return err('This invitation was sent to a different email address', 403);
  }

  const existing = await prisma.organizationMembership.findUnique({
    where: {
      userId_organizationId: {
        userId: session.user.id,
        organizationId: invitation.organizationId
      }
    }
  });

  if (!existing) {
    await prisma.organizationMembership.create({
      data: {
        userId: session.user.id,
        organizationId: invitation.organizationId,
        role: invitation.role
      }
    });
  }
  await prisma.organizationInvitation.update({
    where: { id: invitation.id },
    data: { acceptedAt: new Date() }
  });

  const res = NextResponse.json({
    success: true,
    organizationId: invitation.organizationId
  });
  res.cookies.set('active-org-id', invitation.organizationId, {
    path: '/',
    sameSite: 'lax'
  });
  return res;
}
