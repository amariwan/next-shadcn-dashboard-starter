import { NextRequest, NextResponse } from 'next/server';
import { ACTIVE_ORG_COOKIE } from '@/lib/auth/organization';
import { getSessionOr401, err } from '../_lib';

/** Read the currently active organization (resolved from session). */
export async function GET() {
  const sessionOrError = await getSessionOr401();
  if (sessionOrError instanceof NextResponse) return sessionOrError;
  const session = sessionOrError;

  return NextResponse.json({
    activeOrgId: session.user.activeOrgId,
    activeOrgRole: session.user.activeOrgRole,
    organizations: session.user.organizations ?? []
  });
}

/** Switch the active organization (must be a member). Sets a sticky cookie.
 * The session callback reads this cookie on the next request to update activeOrgId/role.
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

  const member = (session.user.organizations ?? []).find((o: { id: string }) => o.id === orgId);
  if (!member) return err('Organization not found', 404);

  const res = NextResponse.json({ success: true, activeOrgId: orgId });
  res.cookies.set(ACTIVE_ORG_COOKIE, orgId, {
    path: '/',
    sameSite: 'lax'
  });
  return res;
}
