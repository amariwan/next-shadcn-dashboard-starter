// ============================================================
// Organization Server Service — Data Access Layer (Server only)
// ============================================================
// Used by Route Handlers. This is the ONLY place Prisma is called
// directly for organizations. Swap this file to connect to an
// external backend if needed.
// ============================================================

import { randomBytes } from 'crypto';
import { getOrgPrisma, type OrgRole } from '@/lib/auth/organization';
import {
  hasOrgPermission,
  canAssignRole,
  canRemoveMember,
  canInviteRole
} from '@/lib/auth/rbac';
import { logAuditAction, logSecurityEvent } from './audit-service';
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

/** Create an organization and make the user owner (atomic with audit log). */
export async function createOrganization({ userId, name }: { userId: string; name: string }) {
  const prisma = getOrgPrisma();

  return prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        name,
        slug: slugify(name),
        createdById: userId,
        memberships: { create: { userId, role: 'owner' } }
      }
    });

    await logAuditAction(
      {
        userId,
        action: 'org:create',
        entityType: 'organization',
        entityId: org.id,
        organizationId: org.id,
        metadata: { name: org.name, slug: org.slug }
      },
      tx
    );

    return org;
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

/** Rename an organization (atomic with audit log). */
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

  // Authorize before entering transaction to avoid SQLite lock contention
  const membership = await prisma.organizationMembership.findUnique({
    where: { userId_organizationId: { userId: actorId, organizationId: id } },
    include: { organization: true }
  });

  if (!membership || !hasOrgPermission(membership.role as OrgRole, 'organization.update')) {
    await logSecurityEvent({
      userId: actorId,
      action: 'security:unauthorized_attempt',
      entityId: id,
      organizationId: id,
      reason: 'Attempted to rename organization without organization.update permission'
    }).catch(() => null);
    throw new Error('Forbidden');
  }

  return prisma.$transaction(async (tx) => {
    const previousName = membership.organization.name;
    const updated = await tx.organization.update({ where: { id }, data: { name } });

    await logAuditAction(
      {
        userId: actorId,
        action: 'org:rename',
        entityType: 'organization',
        entityId: id,
        organizationId: id,
        metadata: { previousName, newName: name }
      },
      tx
    );

    return updated;
  });
}

/** Delete an organization (owner only, atomic with audit log). */
export async function deleteOrganizationById({ id, actorId }: { id: string; actorId: string }) {
  const prisma = getOrgPrisma();

  const membership = await prisma.organizationMembership.findUnique({
    where: { userId_organizationId: { userId: actorId, organizationId: id } },
    include: { organization: true }
  });

  if (!membership || !hasOrgPermission(membership.role as OrgRole, 'organization.delete')) {
    await logSecurityEvent({
      userId: actorId,
      action: 'security:unauthorized_attempt',
      entityId: id,
      organizationId: id,
      reason: 'Attempted to delete organization without organization.delete permission'
    }).catch(() => null);
    throw new Error('Forbidden');
  }

  return prisma.$transaction(async (tx) => {
    await logAuditAction(
      {
        userId: actorId,
        action: 'org:delete',
        entityType: 'organization',
        entityId: id,
        organizationId: id,
        metadata: { name: membership.organization.name }
      },
      tx
    );

    return tx.organization.delete({ where: { id } });
  });
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

/** Update a member's role (atomic transaction with privilege escalation & last owner protection). */
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

  if (!actor || !hasOrgPermission(actor.role as OrgRole, 'roles.manage')) {
    await logSecurityEvent({
      userId: actorId,
      action: 'security:unauthorized_attempt',
      entityId: targetUserId,
      organizationId,
      reason: 'Attempted to update member role without roles.manage permission'
    }).catch(() => null);
    throw new Error('Forbidden');
  }

  const target = await prisma.organizationMembership.findUnique({
    where: { userId_organizationId: { userId: targetUserId, organizationId } }
  });
  if (!target) throw new Error('Member not found');

  // Privilege escalation check
  if (!canAssignRole(actor.role as OrgRole, target.role as OrgRole, role)) {
    await logSecurityEvent({
      userId: actorId,
      action: 'security:privilege_escalation',
      entityId: targetUserId,
      organizationId,
      reason: `Invalid role assignment from ${target.role} to ${role} by ${actor.role}`
    }).catch(() => null);
    throw new Error('Forbidden: Cannot perform this role change');
  }

  return prisma.$transaction(async (tx) => {
    // Last owner protection re-checked inside transaction
    if (target.role === 'owner' && role !== 'owner') {
      const owners = await tx.organizationMembership.count({
        where: { organizationId, role: 'owner' }
      });
      if (owners <= 1) {
        throw new Error('Organization must keep at least one owner');
      }
    }

    const previousRole = target.role;
    const updated = await tx.organizationMembership.update({
      where: { id: target.id },
      data: { role }
    });

    await logAuditAction(
      {
        userId: actorId,
        action: 'member:role_change',
        entityType: 'membership',
        entityId: updated.id,
        organizationId,
        metadata: { targetUserId, previousRole, newRole: role }
      },
      tx
    );

    return updated;
  });
}

/** Remove a member from an organization (atomic transaction with last owner protection). */
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
  const isSelf = targetUserId === actorId;

  const actor = await prisma.organizationMembership.findUnique({
    where: { userId_organizationId: { userId: actorId, organizationId } }
  });
  if (!actor) {
    throw new Error('Forbidden');
  }

  if (!isSelf && !hasOrgPermission(actor.role as OrgRole, 'members.manage')) {
    await logSecurityEvent({
      userId: actorId,
      action: 'security:unauthorized_attempt',
      entityId: targetUserId,
      organizationId,
      reason: 'Attempted to remove member without members.manage permission'
    }).catch(() => null);
    throw new Error('Forbidden');
  }

  const target = await prisma.organizationMembership.findUnique({
    where: { userId_organizationId: { userId: targetUserId, organizationId } }
  });
  if (!target) throw new Error('Member not found');

  if (!canRemoveMember(actor.role as OrgRole, target.role as OrgRole, isSelf)) {
    await logSecurityEvent({
      userId: actorId,
      action: 'security:privilege_escalation',
      entityId: targetUserId,
      organizationId,
      reason: `Actor with role ${actor.role} attempted to remove owner ${targetUserId}`
    }).catch(() => null);
    throw new Error('Forbidden: Cannot remove an owner');
  }

  return prisma.$transaction(async (tx) => {
    // Last owner protection re-checked inside transaction
    if (target.role === 'owner') {
      const owners = await tx.organizationMembership.count({
        where: { organizationId, role: 'owner' }
      });
      if (owners <= 1) {
        throw new Error('Organization must keep at least one owner');
      }
    }

    await logAuditAction(
      {
        userId: actorId,
        action: 'member:remove',
        entityType: 'membership',
        entityId: target.id,
        organizationId,
        metadata: { targetUserId, role: target.role }
      },
      tx
    );

    await tx.organizationMembership.delete({ where: { id: target.id } });
    return target;
  });
}

/** List pending invitations. */
export async function listInvitations(organizationId: string, actorId?: string) {
  const prisma = getOrgPrisma();
  if (actorId) {
    const actor = await prisma.organizationMembership.findUnique({
      where: { userId_organizationId: { userId: actorId, organizationId } }
    });
    if (!actor || !hasOrgPermission(actor.role as OrgRole, 'invitations.read')) {
      await logSecurityEvent({
        userId: actorId,
        action: 'security:unauthorized_attempt',
        entityId: organizationId,
        organizationId,
        reason: 'Attempted to list invitations without invitations.read permission'
      }).catch(() => null);
      throw new Error('Forbidden');
    }
  }
  return prisma.organizationInvitation.findMany({
    where: { organizationId, acceptedAt: null },
    include: { invitedBy: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' }
  });
}

/** Create an invitation (atomic with audit log and privilege escalation check). */
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

  const actor = await prisma.organizationMembership.findUnique({
    where: { userId_organizationId: { userId: invitedById, organizationId } }
  });
  if (!actor || !hasOrgPermission(actor.role as OrgRole, 'invitations.manage')) {
    await logSecurityEvent({
      userId: invitedById,
      action: 'security:unauthorized_attempt',
      entityId: email,
      organizationId,
      reason: 'Attempted to create invitation without invitations.manage permission'
    }).catch(() => null);
    throw new Error('Forbidden');
  }
  if (!canInviteRole(actor.role as OrgRole, role)) {
    await logSecurityEvent({
      userId: invitedById,
      action: 'security:privilege_escalation',
      entityId: email,
      organizationId,
      reason: `Actor with role ${actor.role} attempted to invite with role ${role}`
    }).catch(() => null);
    throw new Error('Forbidden: Only owners can invite another owner');
  }

  return prisma.$transaction(async (tx) => {
    const token = randomBytes(32).toString('hex');
    const invite = await tx.organizationInvitation.create({
      data: {
        email: email.toLowerCase(),
        role,
        token: token,
        organizationId,
        invitedById,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    await logAuditAction(
      {
        userId: invitedById,
        action: 'invite:create',
        entityType: 'invitation',
        entityId: invite.id,
        organizationId,
        metadata: { email: invite.email, role: invite.role }
      },
      tx
    );

    return invite;
  });
}

/** Revoke an invitation (atomic with audit log). */
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
  if (!actor || !hasOrgPermission(actor.role as OrgRole, 'invitations.manage')) {
    await logSecurityEvent({
      userId: actorId,
      action: 'security:unauthorized_attempt',
      entityId: invitationId,
      organizationId,
      reason: 'Attempted to revoke invitation without invitations.manage permission'
    }).catch(() => null);
    throw new Error('Forbidden');
  }

  const invitation = await prisma.organizationInvitation.findFirst({
    where: { id: invitationId, organizationId }
  });
  if (!invitation) throw new Error('Invitation not found');

  return prisma.$transaction(async (tx) => {
    await logAuditAction(
      {
        userId: actorId,
        action: 'invite:revoke',
        entityType: 'invitation',
        entityId: invitation.id,
        organizationId,
        metadata: { email: invitation.email, role: invitation.role }
      },
      tx
    );

    return tx.organizationInvitation.delete({ where: { id: invitation.id } });
  });
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

  return prisma.$transaction(async (tx) => {
    const invitation = await tx.organizationInvitation.findUnique({
      where: { token },
      include: { organization: true }
    });
    if (!invitation || invitation.acceptedAt || invitation.expiresAt.getTime() < Date.now()) {
      throw new Error('Invitation is invalid or expired');
    }

    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
      throw new Error('Invitation was sent to a different email address');
    }

    const existing = await tx.organizationMembership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: invitation.organizationId
        }
      }
    });
    if (existing) {
      await tx.organizationInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() }
      });
      return invitation.organizationId;
    }

    await tx.organizationMembership.create({
      data: {
        userId,
        organizationId: invitation.organizationId,
        role: invitation.role
      }
    });

    await tx.organizationInvitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() }
    });

    await logAuditAction(
      {
        userId,
        action: 'invite:accept',
        entityType: 'invitation',
        entityId: invitation.id,
        organizationId: invitation.organizationId,
        metadata: { role: invitation.role }
      },
      tx
    );

    return invitation.organizationId;
  });
}

function slugify(text: string): string {
  const base = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'workspace';
  const suffix = randomBytes(4).toString('hex');
  return `${base}-${suffix}`;
}
