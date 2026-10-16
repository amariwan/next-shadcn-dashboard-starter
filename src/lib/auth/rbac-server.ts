import { getOrgPrisma } from '@/lib/auth/organization';
import { hasOrgPermission, type OrgPermission, type OrgRole, type MembershipWithOrg } from './rbac';

/**
 * Server-side authority check: Load membership directly from the database and verify permissions.
 * Never trusts client-provided or cached session roles.
 */
export async function verifyOrgAccess(
  organizationId: string,
  userId: string,
  permission: OrgPermission
): Promise<MembershipWithOrg> {
  const prisma = getOrgPrisma();
  const membership = await prisma.organizationMembership.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
    include: { organization: true }
  });

  if (!membership) {
    throw new Error('Organization not found');
  }

  if (!hasOrgPermission(membership.role as OrgRole, permission)) {
    throw new Error('Forbidden');
  }

  return membership as MembershipWithOrg;
}
