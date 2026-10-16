import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import type { Organization, OrganizationMembership } from '@prisma/client';
import { auth } from '@/lib/auth';
import { getOrgPrisma, type OrgRole } from '@/lib/auth/organization';

export function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export type MembershipWithOrg = OrganizationMembership & {
  organization: Organization;
};

/** Returns the session, or an error Response to return directly. */
export async function getSessionOr401(): Promise<Session | NextResponse> {
  const session = (await auth()) as Session | null;
  if (!session?.user?.id) {
    return err('Unauthorized', 401);
  }
  return session;
}

const RANK: Record<OrgRole, number> = { member: 0, admin: 1, owner: 2 };

export function roleAtLeast(role: string, minimum: OrgRole): boolean {
  return (RANK[role as OrgRole] ?? -1) >= RANK[minimum];
}

export function isValidOrgRole(role: unknown): role is OrgRole {
  return role === 'owner' || role === 'admin' || role === 'member';
}

/**
 * Load membership + organization, enforcing a minimum role.
 * Returns the membership, or an error Response to return directly.
 */
export async function getMembershipOr403(
  organizationId: string,
  userId: string,
  minimumRole: OrgRole = 'member'
): Promise<MembershipWithOrg | NextResponse> {
  const prisma = getOrgPrisma();
  const membership = await prisma.organizationMembership.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
    include: { organization: true }
  });

  if (!membership) {
    return err('Organization not found', 404);
  }
  if (!roleAtLeast(membership.role, minimumRole)) {
    return err('Forbidden', 403);
  }
  return membership;
}

export async function countOwners(organizationId: string): Promise<number> {
  const prisma = getOrgPrisma();
  return prisma.organizationMembership.count({
    where: { organizationId, role: 'owner' }
  });
}
