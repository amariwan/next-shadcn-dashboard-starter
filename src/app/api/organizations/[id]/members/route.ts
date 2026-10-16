import { NextRequest, NextResponse } from 'next/server';
import { getOrgPrisma } from '@/lib/auth/organization';
import { getSessionOr401, getMembershipOr403, countOwners, isValidOrgRole, err } from '../../_lib';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const sessionOrError = await getSessionOr401();
  if (sessionOrError instanceof NextResponse) return sessionOrError;
  const session = sessionOrError;

  const membershipOrError = await getMembershipOr403(id, session.user.id);
  if (membershipOrError instanceof NextResponse) return membershipOrError;
  const membership = membershipOrError;

  const prisma = getOrgPrisma();
  const members = await prisma.organizationMembership.findMany({
    where: { organizationId: id },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } }
    },
    orderBy: { createdAt: 'asc' }
  });

  return NextResponse.json({
    members: members.map((m) => ({
      userId: m.user.id,
      name: m.user.name,
      email: m.user.email,
      image: m.user.image,
      role: m.role,
      joinedAt: m.createdAt
    }))
  });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const sessionOrError = await getSessionOr401();
  if (sessionOrError instanceof NextResponse) return sessionOrError;
  const session = sessionOrError;

  const membershipOrError = await getMembershipOr403(id, session.user.id, 'admin');
  if (membershipOrError instanceof NextResponse) return membershipOrError;
  const membership = membershipOrError;

  const body = await request.json().catch(() => null);
  const targetUserId = body?.userId;
  const nextRole = body?.role;
  if (typeof targetUserId !== 'string' || !isValidOrgRole(nextRole)) {
    return err('userId and a valid role (owner, admin, member) are required');
  }

  const prisma = getOrgPrisma();
  const target = await prisma.organizationMembership.findUnique({
    where: { userId_organizationId: { userId: targetUserId, organizationId: id } }
  });
  if (!target) return err('Member not found', 404);

  const actorIsOwner = membership.role === 'owner';
  // Admins cannot touch owners; only owners manage owners.
  if (target.role === 'owner' && !actorIsOwner) {
    return err('Only owners can change an owner', 403);
  }
  // Never leave the org without an owner.
  if (target.role === 'owner' && nextRole !== 'owner') {
    const owners = await countOwners(id);
    if (owners <= 1) return err('An organization must keep at least one owner');
  }
  // Only owners can promote to owner.
  if (nextRole === 'owner' && !actorIsOwner) {
    return err('Only owners can promote to owner', 403);
  }

  const updated = await prisma.organizationMembership.update({
    where: { id: target.id },
    data: { role: nextRole }
  });

  return NextResponse.json({
    member: { userId: updated.userId, role: updated.role }
  });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const sessionOrError = await getSessionOr401();
  if (sessionOrError instanceof NextResponse) return sessionOrError;
  const session = sessionOrError;

  const { searchParams } = request.nextUrl;
  const targetUserId = searchParams.get('userId') ?? session.user.id;
  const leaving = targetUserId === session.user.id;

  const membershipOrError = await getMembershipOr403(
    id,
    session.user.id,
    leaving ? 'member' : 'admin'
  );
  if (membershipOrError instanceof NextResponse) return membershipOrError;
  const membership = membershipOrError;

  const prisma = getOrgPrisma();
  const target = await prisma.organizationMembership.findUnique({
    where: { userId_organizationId: { userId: targetUserId, organizationId: id } }
  });
  if (!target) return err('Member not found', 404);

  // Non-owners cannot remove owners.
  if (target.role === 'owner' && membership.role !== 'owner') {
    return err('Only owners can remove an owner', 403);
  }
  // The last owner cannot leave or be removed.
  if (target.role === 'owner') {
    const owners = await countOwners(id);
    if (owners <= 1) {
      return err(
        leaving
          ? 'Transfer ownership or delete the organization first'
          : 'An organization must keep at least one owner'
      );
    }
  }

  await prisma.organizationMembership.delete({ where: { id: target.id } });
  return NextResponse.json({ success: true });
}
