import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { resolve } from 'path';

export const ACTIVE_ORG_COOKIE = 'active-org-id';

export type OrgRole = 'owner' | 'admin' | 'member';

export interface SessionOrganization {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  role: OrgRole;
}

function getDbUrl(): string {
  const raw = process.env.DATABASE_URL || 'file:./prisma/dev.db';
  if (raw.startsWith('file:./') || raw.startsWith('file:../')) {
    return `file:${resolve(process.cwd(), raw.slice('file:'.length))}`;
  }
  return raw;
}

const globalForOrgPrisma = globalThis as unknown as {
  orgPrisma?: PrismaClient;
};

export function getOrgPrisma(): PrismaClient {
  if (!globalForOrgPrisma.orgPrisma) {
    const adapter = new PrismaLibSql({ url: getDbUrl() }) as any;
    globalForOrgPrisma.orgPrisma = new PrismaClient({ adapter });
  }
  return globalForOrgPrisma.orgPrisma;
}

async function readActiveOrgCookie(): Promise<string | null> {
  try {
    const store = await cookies();
    return store.get(ACTIVE_ORG_COOKIE)?.value ?? null;
  } catch {
    // Not in a request scope where cookies() is available.
    // Callers fall back to the first membership.
    return null;
  }
}

/**
 * Load all organizations the user belongs to, plus resolve the active one.
 * The active org is sticky via the `active-org-id` cookie and always
 * validated against current memberships.
 */
export async function getSessionOrganizations(userId: string): Promise<{
  organizations: SessionOrganization[];
  activeOrgId: string | null;
  activeOrgRole: OrgRole | null;
}> {
  const prisma = getOrgPrisma();
  const memberships = await prisma.organizationMembership.findMany({
    where: { userId },
    include: { organization: true },
    orderBy: { createdAt: 'asc' }
  });

  const organizations: SessionOrganization[] = memberships.map((m) => ({
    id: m.organization.id,
    name: m.organization.name,
    slug: m.organization.slug,
    image: m.organization.image,
    role: m.role as OrgRole
  }));

  if (organizations.length === 0) {
    return { organizations, activeOrgId: null, activeOrgRole: null };
  }

  const cookieOrgId = await readActiveOrgCookie();
  const active = organizations.find((o) => o.id === cookieOrgId) ?? organizations[0];

  return {
    organizations,
    activeOrgId: active.id,
    activeOrgRole: active.role
  };
}

export function slugify(name: string): string {
  const base =
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'workspace';
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}

export function canManageMembers(role: OrgRole | null | undefined): boolean {
  return role === 'owner' || role === 'admin';
}

export function isOwner(role: OrgRole | null | undefined): boolean {
  return role === 'owner';
}
