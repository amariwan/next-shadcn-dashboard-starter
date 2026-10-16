import type { OrgRole } from '@/lib/auth/organization';

export interface OrganizationSummary {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  role: OrgRole;
  memberCount: number;
  joinedAt: string;
}

export interface OrganizationsResponse {
  organizations: OrganizationSummary[];
}

export interface OrganizationDetail {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  role: OrgRole;
  memberCount: number;
}

export interface OrganizationMember {
  userId: string;
  name: string | null;
  email: string;
  image: string | null;
  role: OrgRole;
  joinedAt: string;
}

export interface OrganizationInvitation {
  id: string;
  email: string;
  role: OrgRole;
  expiresAt: string;
  invitedBy: { name: string | null; email: string };
  createdAt: string;
}

export interface InvitePreview {
  invitation: {
    organizationId: string;
    organizationName: string;
    email: string;
    role: OrgRole;
    expiresAt: string;
  };
  emailMatches: boolean;
  alreadyMember: boolean;
}

export interface ActiveOrgState {
  activeOrgId: string | null;
  activeOrgRole: OrgRole | null;
  organizations: Array<{
    id: string;
    name: string;
    slug: string;
    image: string | null;
    role: OrgRole;
  }>;
}
