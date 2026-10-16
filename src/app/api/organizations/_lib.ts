import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getOrgPrisma, type OrgRole } from '@/lib/auth/organization';

export function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function getSessionOr401() {
  const session = await auth();
  if (!session?.user?.id) {
    return { session: null, error: err('Unauthorized', 401) } as const;
  }
  return { session, error: null } as const;
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
 * Returns `{ membership, organization }` or an error Response to return directly.
 */
export async function getMembershipOr403(
  organizationId: string,
  userId: string,
  minimumRole: OrgRole = 'member'
) {
  const prisma = getOrgPrisma();
  const membership = await prisma.organizationMembership.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
    include: { organization: true }
  });

  if (!membership) {
    return { data: null, error: err('Organization not found', 404) } as const;
  }
  if (!roleAtLeast(membership.role, minimumRole)) {
    return { data: null, error: err('Forbidden', 403) } as const;
  }
  return { data: membership, error: null } as const;
}

export async function countOwners(organizationId: string): Promise<number> {
  const prisma = getOrgPrisma();
  return prisma.organizationMembership.count({
    where: { organizationId, role: 'owner' }
  });
}
