import { NextRequest, NextResponse } from 'next/server';
import { ACTIVE_ORG_COOKIE, getOrgPrisma, type OrgRole } from '@/lib/auth/organization';
import { getOrgPermissions } from '@/lib/auth/rbac';
import { getSessionOr401, err } from '../_lib';

/** Read the currently active organization (resolved from session). */
export async function GET() {
  const sessionOrError = await getSessionOr401();
  if (sessionOrError instanceof NextResponse) return sessionOrError;
  const session = sessionOrError;

  const permissions = getOrgPermissions(session.user.activeOrgRole);

  return NextResponse.json({
    activeOrgId: session.user.activeOrgId,
    activeOrgRole: session.user.activeOrgRole,
    permissions,
    organizations: session.user.organizations ?? []
  });
}

/** Switch the active organization (must be a member). Sets a sticky cookie.
 * Verifies membership directly in the database (never trusts unverified client state).
 * The session callback reads this cookie on subsequent requests to update activeOrgId/role.
 */
export async function POST(request: NextRequest) {
  const sessionOrError = await getSessionOr401();
  if (sessionOrError instanceof NextResponse) return sessionOrError;
  const session = sessionOrError;

  const body = await request.json().catch(() => null);
  const orgId = body?.orgId;
  if (typeof orgId !== 'string' || !orgId) {
    return err('orgId is required');
  }

  // Database check: verify active membership
  const prisma = getOrgPrisma();
  const membership = await prisma.organizationMembership.findUnique({
    where: { userId_organizationId: { userId: session.user.id, organizationId: orgId } }
  });
  if (!membership) return err('Organization not found', 404);

  const permissions = getOrgPermissions(membership.role as OrgRole);
  const res = NextResponse.json({
    success: true,
    activeOrgId: orgId,
    activeOrgRole: membership.role,
    permissions
  });
  res.cookies.set(ACTIVE_ORG_COOKIE, orgId, {
    path: '/',
    sameSite: 'lax'
  });
  return res;
}
