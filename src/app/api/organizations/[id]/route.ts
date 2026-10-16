import { NextRequest, NextResponse } from 'next/server';
import { ACTIVE_ORG_COOKIE } from '@/lib/auth/organization';
import { getSessionOr401, err, toServiceErrorResponse } from '../_lib';
import {
  getOrganizationById,
  renameOrganizationById,
  deleteOrganizationById
} from '@/features/organizations/api/server-service';
import { renameOrganizationSchema } from '@/features/organizations/schemas';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const sessionOrError = await getSessionOr401();
  if (sessionOrError instanceof NextResponse) return sessionOrError;
  const session = sessionOrError;

  try {
    const organization = await getOrganizationById(id);
    if (!organization) {
      return err('Organization not found', 404);
    }

    // Verify membership
    const { getMembershipOr403 } = await import('../_lib');
    const membershipOrError = await getMembershipOr403(id, session.user.id);
    if (membershipOrError instanceof NextResponse) return membershipOrError;
    const membership = membershipOrError;

    return NextResponse.json({
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        image: organization.image,
        role: membership.role,
        memberCount: organization._count.memberships
      }
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

  const body = await request.json().catch(() => null);
  const parsed = renameOrganizationSchema.safeParse(body);
  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? 'Invalid input');
  }

  try {
    const organization = await renameOrganizationById({
      id,
      name: parsed.data.name.trim(),
      actorId: session.user.id
    });
    return NextResponse.json({ organization });
  } catch (error) {
    return toServiceErrorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const sessionOrError = await getSessionOr401();
  if (sessionOrError instanceof NextResponse) return sessionOrError;
  const session = sessionOrError;

  try {
    await deleteOrganizationById({ id, actorId: session.user.id });
    const res = NextResponse.json({ success: true });
    res.cookies.delete(ACTIVE_ORG_COOKIE);
    return res;
  } catch (error) {
    return toServiceErrorResponse(error);
  }
}
