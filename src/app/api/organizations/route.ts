import { NextRequest, NextResponse } from 'next/server';
import { ACTIVE_ORG_COOKIE, getOrgPrisma, slugify } from '@/lib/auth/organization';
import { getSessionOr401, err } from './_lib';

export async function GET() {
  const sessionOrError = await getSessionOr401();
  if (sessionOrError instanceof NextResponse) return sessionOrError;
  const session = sessionOrError;

  const prisma = getOrgPrisma();
  const memberships = await prisma.organizationMembership.findMany({
    where: { userId: session.user.id },
    include: {
      organization: { include: { _count: { select: { memberships: true } } } }
    },
    orderBy: { createdAt: 'asc' }
  });

  return NextResponse.json({
    organizations: memberships.map((m) => ({
      id: m.organization.id,
      name: m.organization.name,
      slug: m.organization.slug,
      image: m.organization.image,
      role: m.role,
      memberCount: m.organization._count.memberships,
      joinedAt: m.createdAt
    }))
  });
}

export async function POST(request: NextRequest) {
  const sessionOrError = await getSessionOr401();
  if (sessionOrError instanceof NextResponse) return sessionOrError;
  const session = sessionOrError;

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  if (!name || name.length > 60) {
    return err('Name is required (max 60 characters)');
  }

  const prisma = getOrgPrisma();
  const organization = await prisma.organization.create({
    data: {
      name,
      slug: slugify(name),
      createdById: session.user.id,
      memberships: { create: { userId: session.user.id, role: 'owner' } }
    }
  });

  const res = NextResponse.json({ organization }, { status: 201 });
  res.cookies.set(ACTIVE_ORG_COOKIE, organization.id, {
    path: '/',
    sameSite: 'lax'
  });
  return res;
}
