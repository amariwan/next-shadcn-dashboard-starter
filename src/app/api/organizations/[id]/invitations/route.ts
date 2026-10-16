import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getOrgPrisma } from '@/lib/auth/organization';
import { getSessionOr401, getMembershipOr403, isValidOrgRole, err } from '../../_lib';

interface Params {
  params: Promise<{ id: string }>;
}

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const sessionOrError = await getSessionOr401();
  if (sessionOrError instanceof NextResponse) return sessionOrError;
  const session = sessionOrError;

  const membershipOrError = await getMembershipOr403(id, session.user.id, 'admin');
  if (membershipOrError instanceof NextResponse) return membershipOrError;
  const membership = membershipOrError;

  const prisma = getOrgPrisma();
  const invitations = await prisma.organizationInvitation.findMany({
    where: { organizationId: id, acceptedAt: null },
    include: { invitedBy: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json({
    invitations: invitations.map((i) => ({
      id: i.id,
      email: i.email,
      role: i.role,
      expiresAt: i.expiresAt,
      invitedBy: i.invitedBy,
      createdAt: i.createdAt
    }))
  });
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const sessionOrError = await getSessionOr401();
  if (sessionOrError instanceof NextResponse) return sessionOrError;
  const session = sessionOrError;

  const membershipOrError = await getMembershipOr403(id, session.user.id, 'admin');
  if (membershipOrError instanceof NextResponse) return membershipOrError;
  const membership = membershipOrError;

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const role = isValidOrgRole(body?.role) ? body.role : 'member';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return err('A valid email is required');
  }
  // Only owners can invite owners.
  if (role === 'owner' && membership.role !== 'owner') {
    return err('Only owners can invite another owner', 403);
  }

  const prisma = getOrgPrisma();
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const alreadyMember = await prisma.organizationMembership.findUnique({
      where: {
        userId_organizationId: { userId: existingUser.id, organizationId: id }
      }
    });
    if (alreadyMember) return err('User is already a member', 409);
  }

  const now = new Date();
  const existing = await prisma.organizationInvitation.findFirst({
    where: {
      organizationId: id,
      email,
      acceptedAt: null,
      expiresAt: { gt: now }
    }
  });
  if (existing) {
    return NextResponse.json({
      invitation: {
        id: existing.id,
        email: existing.email,
        role: existing.role,
        expiresAt: existing.expiresAt
      },
      inviteUrl: inviteUrl(request, existing.token),
      reused: true
    });
  }

  const invitation = await prisma.organizationInvitation.create({
    data: {
      email,
      role,
      token: randomBytes(32).toString('hex'),
      organizationId: id,
      invitedById: session.user.id,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS)
    }
  });

  return NextResponse.json(
    {
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt
      },
      inviteUrl: inviteUrl(request, invitation.token)
    },
    { status: 201 }
  );
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const sessionOrError = await getSessionOr401();
  if (sessionOrError instanceof NextResponse) return sessionOrError;
  const session = sessionOrError;

  const membershipOrError = await getMembershipOr403(id, session.user.id, 'admin');
  if (membershipOrError instanceof NextResponse) return membershipOrError;
  const membership = membershipOrError;

  const invitationId = request.nextUrl.searchParams.get('invitationId');
  if (!invitationId) return err('invitationId is required');

  const prisma = getOrgPrisma();
  const invitation = await prisma.organizationInvitation.findFirst({
    where: { id: invitationId, organizationId: id }
  });
  if (!invitation) return err('Invitation not found', 404);

  await prisma.organizationInvitation.delete({ where: { id: invitation.id } });
  return NextResponse.json({ success: true });
}

function inviteUrl(request: NextRequest, token: string): string {
  const origin = request.nextUrl.origin;
  return `${origin}/dashboard/workspaces/join/${token}`;
}
