import { NextRequest, NextResponse } from 'next/server';
import {
  getSessionOr401,
  getMembershipWithPermissionOr403,
  err,
  toServiceErrorResponse
} from '../../_lib';
import {
  listInvitations,
  createInvitation as createInvitationService,
  revokeInvitationById
} from '@/features/organizations/api/server-service';
import { inviteMemberSchema } from '@/features/organizations/schemas';
import { canInviteRole } from '@/lib/auth/rbac';

interface Params {
  params: Promise<{ id: string }>;
}

function inviteUrl(request: NextRequest, token: string): string {
  const origin = request.nextUrl.origin;
  return `${origin}/dashboard/workspaces/join/${token}`;
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const sessionOrError = await getSessionOr401();
  if (sessionOrError instanceof NextResponse) return sessionOrError;
  const session = sessionOrError;

  const membershipOrError = await getMembershipWithPermissionOr403(
    id,
    session.user.id,
    'invitations.read'
  );
  if (membershipOrError instanceof NextResponse) return membershipOrError;

  try {
    const invitations = await listInvitations(id, session.user.id);
    return NextResponse.json({
      invitations: invitations.map((i) => ({
        id: i.id,
        email: i.email,
        role: i.role,
        expiresAt: i.expiresAt.toISOString(),
        invitedBy: i.invitedBy,
        createdAt: i.createdAt.toISOString()
      }))
    });
  } catch (error) {
    return toServiceErrorResponse(error);
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const sessionOrError = await getSessionOr401();
  if (sessionOrError instanceof NextResponse) return sessionOrError;
  const session = sessionOrError;

  const membershipOrError = await getMembershipWithPermissionOr403(
    id,
    session.user.id,
    'invitations.manage'
  );
  if (membershipOrError instanceof NextResponse) return membershipOrError;
  const actorMembership = membershipOrError;

  const body = await request.json().catch(() => null);
  const parsed = inviteMemberSchema.safeParse(body);
  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? 'Invalid input');
  }

  const { email, role } = parsed.data;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return err('A valid email is required');
  }

  // Privilege escalation check: only owners can invite another owner
  if (!canInviteRole(actorMembership.role, role)) {
    return err('Only owners can invite another owner', 403);
  }

  try {
    const invitation = await createInvitationService({
      organizationId: id,
      email,
      role,
      invitedById: session.user.id
    });

    return NextResponse.json(
      {
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          expiresAt: invitation.expiresAt.toISOString()
        },
        inviteUrl: inviteUrl(request, invitation.token)
      },
      { status: 201 }
    );
  } catch (error) {
    return toServiceErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const sessionOrError = await getSessionOr401();
  if (sessionOrError instanceof NextResponse) return sessionOrError;
  const session = sessionOrError;

  const membershipOrError = await getMembershipWithPermissionOr403(
    id,
    session.user.id,
    'invitations.manage'
  );
  if (membershipOrError instanceof NextResponse) return membershipOrError;

  const invitationId = request.nextUrl.searchParams.get('invitationId');
  if (!invitationId) return err('invitationId is required');

  try {
    await revokeInvitationById({
      organizationId: id,
      invitationId,
      actorId: session.user.id
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return toServiceErrorResponse(error);
  }
}
