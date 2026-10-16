import { NextRequest, NextResponse } from 'next/server';
import { ACTIVE_ORG_COOKIE } from '@/lib/auth/organization';
import { getSessionOr401, err, toServiceErrorResponse } from '../../_lib';
import { acceptInvitationByToken } from '@/features/organizations/api/server-service';

interface Params {
  params: Promise<{ token: string }>;
}

/** Validate an invite for the signed-in user. */
export async function GET(_request: NextRequest, { params }: Params) {
  const { token } = await params;
  const sessionOrError = await getSessionOr401();
  if (sessionOrError instanceof NextResponse) return sessionOrError;
  const session = sessionOrError;

  try {
    // We need to peek at the invitation without accepting.
    // Reuse the service layer's acceptance logic is not appropriate here,
    // so we load it directly via Prisma for the read-only preview.
    const { getOrgPrisma } = await import('@/lib/auth/organization');
    const prisma = getOrgPrisma();
    const invitation = await prisma.organizationInvitation.findUnique({
      where: { token },
      include: { organization: true }
    });
    if (!invitation || invitation.acceptedAt || invitation.expiresAt.getTime() < Date.now()) {
      return err('Invitation is invalid or expired', 404);
    }

    const alreadyMember = await prisma.organizationMembership.findUnique({
      where: {
        userId_organizationId: {
          userId: session.user.id,
          organizationId: invitation.organizationId
        }
      }
    });

    return NextResponse.json({
      invitation: {
        organizationId: invitation.organizationId,
        organizationName: invitation.organization.name,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt.toISOString()
      },
      emailMatches: invitation.email.toLowerCase() === (session.user.email ?? '').toLowerCase(),
      alreadyMember: Boolean(alreadyMember)
    });
  } catch (error) {
    return toServiceErrorResponse(error);
  }
}

/** Accept an invite — the invite email must match the signed-in user. */
export async function POST(_request: NextRequest, { params }: Params) {
  const { token } = await params;
  const sessionOrError = await getSessionOr401();
  if (sessionOrError instanceof NextResponse) return sessionOrError;
  const session = sessionOrError;

  try {
    const organizationId = await acceptInvitationByToken({
      token,
      userId: session.user.id
    });

    const res = NextResponse.json({
      success: true,
      organizationId
    });
    res.cookies.set(ACTIVE_ORG_COOKIE, organizationId, {
      path: '/',
      sameSite: 'lax'
    });
    return res;
  } catch (error) {
    return toServiceErrorResponse(error);
  }
}
