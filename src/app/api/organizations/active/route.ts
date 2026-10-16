import { NextRequest, NextResponse } from 'next/server';
import { ACTIVE_ORG_COOKIE } from '@/lib/auth/organization';
import { getSessionOr401, err } from '../_lib';

/** Read the currently active organization (resolved from session). */
export async function GET() {
  const { session, error } = await getSessionOr401();
  if (!session) return error;

  return NextResponse.json({
    activeOrgId: session.user.activeOrgId,
    activeOrgRole: session.user.activeOrgRole,
    organizations: session.user.organizations ?? []
  });
}

/** Switch the active organization (must be a member). Sets a sticky cookie. */
export async function POST(request: NextRequest) {
  const { session, error } = await getSessionOr401();
  if (!session) return error;

  const body = await request.json().catch(() => null);
  const orgId = body?.orgId;
  if (typeof orgId !== 'string' || !orgId) {
    return err('orgId is required');
  }

  const member = (session.user.organizations ?? []).find((o) => o.id === orgId);
  if (!member) return err('Organization not found', 404);

  const res = NextResponse.json({ success: true, activeOrgId: orgId });
  res.cookies.set(ACTIVE_ORG_COOKIE, orgId, {
    path: '/',
    sameSite: 'lax'
  });
  return res;
}
