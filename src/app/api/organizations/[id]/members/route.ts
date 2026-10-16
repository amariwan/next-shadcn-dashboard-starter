import { NextRequest, NextResponse } from 'next/server';
import {
  getSessionOr401,
  getMembershipWithPermissionOr403,
  err,
  toServiceErrorResponse
} from '../../_lib';
import {
  listMembers,
  updateMemberRoleById,
  removeMemberById
} from '@/features/organizations/api/server-service';
import { updateMemberRoleSchema } from '@/features/organizations/schemas';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const sessionOrError = await getSessionOr401();
  if (sessionOrError instanceof NextResponse) return sessionOrError;
  const session = sessionOrError;

  const membershipOrError = await getMembershipWithPermissionOr403(
    id,
    session.user.id,
    'members.read'
  );
  if (membershipOrError instanceof NextResponse) return membershipOrError;

  try {
    const members = await listMembers(id);
    return NextResponse.json({
      members: members.map((m) => ({
        userId: m.user.id,
        name: m.user.name,
        email: m.user.email,
        image: m.user.image,
        role: m.role,
        joinedAt: m.createdAt.toISOString()
      }))
    });
  } catch (error) {
    return toServiceErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const sessionOrError = await getSessionOr401();
  if (sessionOrError instanceof NextResponse) return sessionOrError;
  const session = sessionOrError;

  const membershipOrError = await getMembershipWithPermissionOr403(
    id,
    session.user.id,
    'roles.manage'
  );
  if (membershipOrError instanceof NextResponse) return membershipOrError;

  const body = await request.json().catch(() => null);
  const parsed = updateMemberRoleSchema.safeParse(body);
  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? 'Invalid input');
  }

  try {
    const updated = await updateMemberRoleById({
      organizationId: id,
      targetUserId: parsed.data.userId,
      role: parsed.data.role,
      actorId: session.user.id
    });
    return NextResponse.json({
      member: { userId: updated.userId, role: updated.role }
    });
  } catch (error) {
    return toServiceErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const sessionOrError = await getSessionOr401();
  if (sessionOrError instanceof NextResponse) return sessionOrError;
  const session = sessionOrError;

  const { searchParams } = request.nextUrl;
  const targetUserId = searchParams.get('userId') ?? session.user.id;
  const leaving = targetUserId === session.user.id;

  const membershipOrError = await getMembershipWithPermissionOr403(
    id,
    session.user.id,
    leaving ? 'members.read' : 'members.manage'
  );
  if (membershipOrError instanceof NextResponse) return membershipOrError;

  try {
    await removeMemberById({
      organizationId: id,
      targetUserId,
      actorId: session.user.id
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return toServiceErrorResponse(error);
  }
}
