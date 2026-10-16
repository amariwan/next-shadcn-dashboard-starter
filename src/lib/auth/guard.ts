import { auth } from '.';
import { getOrgPrisma, slugify, type OrgRole } from './organization';
import { redirect } from 'next/navigation';

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/sign-in');
  }
  return session;
}

export async function requireRole(role: 'admin' | 'user') {
  const session = await auth();
  if (!session?.user || session.user.role !== role) {
    redirect('/auth/sign-in');
  }
  return session;
}

/**
 * Require the user to belong to at least one organization.
 * Users without one are sent to Workspaces to create (or accept an invite for) one.
 */
export async function requireOrg() {
  const session = await requireAuth();
  if (!session.user.organizations || session.user.organizations.length === 0) {
    redirect('/dashboard/workspaces');
  }
  return session;
}

/**
 * Require membership in a specific organization, optionally with a minimum role.
 * Role hierarchy: owner > admin > member.
 */
export async function requireOrgRole(organizationId: string, minimumRole: OrgRole = 'member') {
  const session = await requireAuth();
  const prisma = getOrgPrisma();

  const membership = await prisma.organizationMembership.findUnique({
    where: {
      userId_organizationId: { userId: session.user.id!, organizationId }
    },
    include: { organization: true }
  });

  if (!membership) {
    redirect('/dashboard/workspaces');
  }

  const rank: Record<OrgRole, number> = { member: 0, admin: 1, owner: 2 };
  if (rank[membership.role as OrgRole] < rank[minimumRole]) {
    redirect(`/dashboard/workspaces/${organizationId}`);
  }

  return { session, membership, organization: membership.organization };
}

/**
 * Create a personal organization for a brand-new user and make them owner.
 * Called on sign-up so every account starts inside one workspace.
 */
export async function createPersonalOrganization(userId: string, displayName: string | null) {
  const prisma = getOrgPrisma();
  const base = (displayName?.split(' ')[0] || 'Personal').slice(0, 40);
  const organization = await prisma.organization.create({
    data: {
      name: `${base}'s Workspace`,
      slug: slugify(`${base}-workspace`),
      createdById: userId,
      memberships: {
        create: { userId, role: 'owner' }
      }
    }
  });
  return organization;
}
