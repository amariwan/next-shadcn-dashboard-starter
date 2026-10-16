// ============================================================
// Organization Service — Data Access Layer
// ============================================================
// Self-hosted Orgs/Teams backed by Route Handlers + Prisma/SQLite.
// Swap these functions to point at an external backend if needed.
// ============================================================

import { apiClient } from '@/lib/api-client';
import type {
  OrganizationsResponse,
  OrganizationDetail,
  OrganizationMember,
  OrganizationInvitation,
  InvitePreview,
  ActiveOrgState
} from './types';

export async function getOrganizations(): Promise<OrganizationsResponse> {
  return apiClient<OrganizationsResponse>('/organizations');
}

export async function createOrganization(name: string) {
  return apiClient<{ organization: OrganizationDetail }>('/organizations', {
    method: 'POST',
    body: JSON.stringify({ name })
  });
}

export async function getOrganization(id: string) {
  return apiClient<{ organization: OrganizationDetail }>(`/organizations/${id}`);
}

export async function renameOrganization(id: string, name: string) {
  return apiClient<{ organization: OrganizationDetail }>(`/organizations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name })
  });
}

export async function deleteOrganization(id: string) {
  return apiClient<{ success: boolean }>(`/organizations/${id}`, {
    method: 'DELETE'
  });
}

export async function getMembers(id: string) {
  return apiClient<{ members: OrganizationMember[] }>(`/organizations/${id}/members`);
}

export async function updateMemberRole(id: string, userId: string, role: string) {
  return apiClient<{ member: { userId: string; role: string } }>(`/organizations/${id}/members`, {
    method: 'PATCH',
    body: JSON.stringify({ userId, role })
  });
}

export async function removeMember(id: string, userId?: string) {
  const suffix = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  return apiClient<{ success: boolean }>(`/organizations/${id}/members${suffix}`, {
    method: 'DELETE'
  });
}

export async function getInvitations(id: string) {
  return apiClient<{ invitations: OrganizationInvitation[] }>(`/organizations/${id}/invitations`);
}

export async function inviteMember(id: string, email: string, role: string) {
  return apiClient<{
    invitation: OrganizationInvitation;
    inviteUrl: string;
    reused?: boolean;
  }>(`/organizations/${id}/invitations`, {
    method: 'POST',
    body: JSON.stringify({ email, role })
  });
}

export async function revokeInvitation(id: string, invitationId: string) {
  return apiClient<{ success: boolean }>(
    `/organizations/${id}/invitations?invitationId=${encodeURIComponent(invitationId)}`,
    { method: 'DELETE' }
  );
}

export async function previewInvitation(token: string): Promise<InvitePreview> {
  return apiClient<InvitePreview>(`/organizations/invitations/${token}`);
}

export async function acceptInvitation(token: string) {
  return apiClient<{ success: boolean; organizationId: string }>(
    `/organizations/invitations/${token}`,
    { method: 'POST' }
  );
}

export async function getActiveOrg(): Promise<ActiveOrgState> {
  return apiClient<ActiveOrgState>('/organizations/active');
}

export async function switchActiveOrg(orgId: string) {
  return apiClient<{ success: boolean; activeOrgId: string }>('/organizations/active', {
    method: 'POST',
    body: JSON.stringify({ orgId })
  });
}
