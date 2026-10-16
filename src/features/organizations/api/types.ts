import type { OrgRole } from '@/lib/auth/organization';
import type { OrgPermission } from '@/lib/auth/rbac';

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
  permissions?: OrgPermission[];
  organizations: Array<{
    id: string;
    name: string;
    slug: string;
    image: string | null;
    role: OrgRole;
  }>;
}

export interface AuditLogItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  organizationId: string | null;
  organizationName: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  search?: string;
  action?: string;
  entityType?: string;
  organizationId?: string;
  userId?: string;
  cursor?: string;
}

export interface AuditLogsResponse {
  logs: AuditLogItem[];
  total: number;
  page: number;
  pageCount: number;
  hasMore: boolean;
}

