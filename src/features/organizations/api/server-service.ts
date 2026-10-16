// ============================================================
// Organization Server Service — Data Access Layer (Server only)
// ============================================================
// Used by Route Handlers. This is the ONLY place Prisma is called
// directly for organizations. Swap this file to connect to an
// external backend if needed.
// ============================================================

import { randomBytes } from 'crypto';
import { getOrgPrisma, type OrgRole } from '@/lib/auth/organization';
import type {
  Organization,
  OrganizationMembership,
  OrganizationInvitation,
  User
} from '@prisma/client';

export interface OrganizationWithMemberships extends Organization {
  _count: { memberships: number };
}

export interface MembershipWithUser extends OrganizationMembership {
  user: Pick<User, 'id' | 'name' | 'email' | 'image'>;
}

export interface InvitationWithInviter extends OrganizationInvitation {
  invitedBy: Pick<User, 'id' | 'name' | 'email'>;
}

/** List all organizations a user belongs to. */
export async function listOrganizations(userId: string) {
  const prisma = getOrgPrisma();
  const memberships = await prisma.organizationMembership.findMany({
    where: { userId },
    include: {
      organization: { include: { _count: { select: { memberships: true } } } }
    },
    orderBy: { createdAt: 'asc' }
  });

  return memberships.map((m) => ({
    id: m.organization.id,
    name: m.organization.name,
    slug: m.organization.slug,
    image: m.organization.image,
    role: m.role as OrgRole,
    memberCount: m.organization._count.memberships,
    joinedAt: m.createdAt.toISOString()
  }));
}

/** Create an organization and make the user owner. */
export async function createOrganization({ userId, name }: { userId: string; name: string }) {
  const prisma = getOrgPrisma();
  return prisma.organization.create({
    data: {
      name,
      slug: slugify(name),
      createdById: userId,
      memberships: { create: { userId, role: 'owner' } }
    }
  });
}

/** Get a single organization with membership count. */
export async function getOrganizationById(id: string) {
  const prisma = getOrgPrisma();
  return prisma.organization.findUnique({
    where: { id },
    include: { _count: { select: { memberships: true } } }
  });
}

/** Rename an organization. */
export async function renameOrganizationById({
  id,
  name,
  actorId
}: {
  id: string;
  name: string;
  actorId: string;
}) {
  const prisma = getOrgPrisma();
  // Verify actor is admin or owner
  const membership = await prisma.organizationMembership.findUnique({
    where: { userId_organizationId: { userId: actorId, organizationId: id } }
  });
  if (!membership || !isAdminOrOwner(membership.role)) {
    throw new Error('Forbidden');
  }

  return prisma.organization.update({ where: { id }, data: { name } });
}

/** Delete an organization (owner only). */
export async function deleteOrganizationById({ id, actorId }: { id: string; actorId: string }) {
  const prisma = getOrgPrisma();
  const membership = await prisma.organizationMembership.findUnique({
    where: { userId_organizationId: { userId: actorId, organizationId: id } }
  });
  if (!membership || membership.role !== 'owner') {
    throw new Error('Forbidden');
  }

  // Prevent deleting if owner is the only owner
  const owners = await prisma.organizationMembership.count({
    where: { organizationId: id, role: 'owner' }
  });
  if (owners <= 1) {
    throw new Error('Organization must keep at least one owner');
  }

  return prisma.organization.delete({ where: { id } });
}

/** List members of an organization. */
export async function listMembers(organizationId: string) {
  const prisma = getOrgPrisma();
  return prisma.organizationMembership.findMany({
    where: { organizationId },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } }
    },
    orderBy: { createdAt: 'asc' }
  });
}

/** Update a member's role. */
export async function updateMemberRoleById({
  organizationId,
  targetUserId,
  role,
  actorId
}: {
  organizationId: string;
  targetUserId: string;
  role: OrgRole;
  actorId: string;
}) {
  const prisma = getOrgPrisma();
  const actor = await prisma.organizationMembership.findUnique({
    where: { userId_organizationId: { userId: actorId, organizationId } }
  });
  if (!actor || !isAdminOrOwner(actor.role)) {
    throw new Error('Forbidden');
  }

  const target = await prisma.organizationMembership.findUnique({
    where: { userId_organizationId: { userId: targetUserId, organizationId } }
  });
  if (!target) throw new Error('Member not found');

  if (target.role === 'owner' && actor.role !== 'owner') {
    throw new Error('Only owners can change an owner');
  }
  if (target.role === 'owner' && role !== 'owner') {
    const owners = await prisma.organizationMembership.count({
      where: { organizationId, role: 'owner' }
    });
    if (owners <= 1) throw new Error('Organization must keep at least one owner');
  }
  if (role === 'owner' && actor.role !== 'owner') {
    throw new Error('Only owners can promote to owner');
  }

  return prisma.organizationMembership.update({
    where: { id: target.id },
    data: { role }
  });
}

/** Remove a member from an organization. */
export async function removeMemberById({
  organizationId,
  targetUserId,
  actorId
}: {
  organizationId: string;
  targetUserId: string;
  actorId: string;
}) {
  const prisma = getOrgPrisma();
  const actor = await prisma.organizationMembership.findUnique({
    where: { userId_organizationId: { userId: actorId, organizationId } }
  });
  if (!actor || !isAdminOrOwner(actor.role)) {
    throw new Error('Forbidden');
  }

  const target = await prisma.organizationMembership.findUnique({
    where: { userId_organizationId: { userId: targetUserId, organizationId } }
  });
  if (!target) throw new Error('Member not found');

  if (target.role === 'owner' && actor.role !== 'owner') {
    throw new Error('Only owners can remove an owner');
  }
  if (target.role === 'owner') {
    const owners = await prisma.organizationMembership.count({
      where: { organizationId, role: 'owner' }
    });
    if (owners <= 1) throw new Error('Organization must keep at least one owner');
  }

  return prisma.organizationMembership.delete({ where: { id: target.id } });
}

/** List pending invitations. */
export async function listInvitations(organizationId: string) {
  const prisma = getOrgPrisma();
  return prisma.organizationInvitation.findMany({
    where: { organizationId, acceptedAt: null },
    include: { invitedBy: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' }
  });
}

/** Create an invitation. */
export async function createInvitation({
  organizationId,
  email,
  role,
  invitedById
}: {
  organizationId: string;
  email: string;
  role: OrgRole;
  invitedById: string;
}) {
  const prisma = getOrgPrisma();
  const token = randomBytes(32).toString('hex');
  const now = new Date();
  return prisma.organizationInvitation.create({
    data: {
      email: email.toLowerCase(),
      role,
      token: token,
      organizationId,
      invitedById,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });
}

/** Revoke an invitation. */
export async function revokeInvitationById({
  organizationId,
  invitationId,
  actorId
}: {
  organizationId: string;
  invitationId: string;
  actorId: string;
}) {
  const prisma = getOrgPrisma();
  const actor = await prisma.organizationMembership.findUnique({
    where: { userId_organizationId: { userId: actorId, organizationId } }
  });
  if (!actor || !isAdminOrOwner(actor.role)) {
    throw new Error('Forbidden');
  }

  const invitation = await prisma.organizationInvitation.findFirst({
    where: { id: invitationId, organizationId }
  });
  if (!invitation) throw new Error('Invitation not found');

  return prisma.organizationInvitation.delete({ where: { id: invitation.id } });
}

/** Accept an invitation (join organization). */
export async function acceptInvitationByToken({
  token,
  userId
}: {
  token: string;
  userId: string;
}) {
  const prisma = getOrgPrisma();
  const invitation = await prisma.organizationInvitation.findUnique({
    where: { token },
    include: { organization: true }
  });
  if (!invitation || invitation.acceptedAt || invitation.expiresAt.getTime() < Date.now()) {
    throw new Error('Invitation is invalid or expired');
  }

  const existing = await prisma.organizationMembership.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId: invitation.organizationId
      }
    }
  });

  if (!existing) {
    await prisma.organizationMembership.create({
      data: {
        userId,
        organizationId: invitation.organizationId,
        role: invitation.role
      }
    });
  }
  await prisma.organizationInvitation.update({
    where: { id: invitation.id },
    data: { acceptedAt: new Date() }
  });

  return invitation.organizationId;
}

/** Switch active org cookie value (handled by caller). */
export function slugify(name: string): string {
  const base =
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'workspace';
  const suffix = randomBytes(4).toString('hex');
  return `${base}-${suffix}`;
}

function isAdminOrOwner(role: string): boolean {
  return role === 'owner' || role === 'admin';
}
