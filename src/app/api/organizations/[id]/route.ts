import { NextRequest, NextResponse } from 'next/server';
import { ACTIVE_ORG_COOKIE, getOrgPrisma } from '@/lib/auth/organization';
import { getSessionOr401, getMembershipOr403, err } from '../_lib';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const { session, error } = await getSessionOr401();
  if (!session) return error;

  const { data: membership, error: forbidden } = await getMembershipOr403(id, session.user.id);
  if (!membership) return forbidden;

  const prisma = getOrgPrisma();
  const memberCount = await prisma.organizationMembership.count({
    where: { organizationId: id }
  });

  return NextResponse.json({
    organization: {
      id: membership.organization.id,
      name: membership.organization.name,
      slug: membership.organization.slug,
      image: membership.organization.image,
      role: membership.role,
      memberCount
    }
  });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const { session, error } = await getSessionOr401();
  if (!session) return error;

  const { data: membership, error: forbidden } = await getMembershipOr403(
    id,
    session.user.id,
    'admin'
  );
  if (!membership) return forbidden;

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (!name || name.length > 60) {
    return err('Name is required (max 60 characters)');
  }

  const prisma = getOrgPrisma();
  const organization = await prisma.organization.update({
    where: { id },
    data: { name }
  });

  return NextResponse.json({ organization });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const { session, error } = await getSessionOr401();
  if (!session) return error;

  const { data: membership, error: forbidden } = await getMembershipOr403(
    id,
    session.user.id,
    'owner'
  );
  if (!membership) return forbidden;

  const prisma = getOrgPrisma();
  await prisma.organization.delete({ where: { id } });

  const res = NextResponse.json({ success: true });
  res.cookies.delete(ACTIVE_ORG_COOKIE);
  return res;
}
