import { queryOptions } from '@tanstack/react-query';
import {
  getOrganizations,
  getOrganization,
  getMembers,
  getInvitations,
  previewInvitation,
  getActiveOrg
} from './service';

export const organizationKeys = {
  all: ['organizations'] as const,
  list: () => [...organizationKeys.all, 'list'] as const,
  detail: (id: string) => [...organizationKeys.all, 'detail', id] as const,
  members: (id: string) => [...organizationKeys.detail(id), 'members'] as const,
  invitations: (id: string) => [...organizationKeys.detail(id), 'invitations'] as const,
  invitePreview: (token: string) => [...organizationKeys.all, 'invite', token] as const,
  active: () => [...organizationKeys.all, 'active'] as const
};

export const organizationsQueryOptions = () =>
  queryOptions({ queryKey: organizationKeys.list(), queryFn: getOrganizations });

export const organizationDetailOptions = (id: string) =>
  queryOptions({
    queryKey: organizationKeys.detail(id),
    queryFn: () => getOrganization(id)
  });

export const organizationMembersOptions = (id: string) =>
  queryOptions({
    queryKey: organizationKeys.members(id),
    queryFn: () => getMembers(id)
  });

export const organizationInvitationsOptions = (id: string) =>
  queryOptions({
    queryKey: organizationKeys.invitations(id),
    queryFn: () => getInvitations(id)
  });

export const invitePreviewOptions = (token: string) =>
  queryOptions({
    queryKey: organizationKeys.invitePreview(token),
    queryFn: () => previewInvitation(token),
    retry: false
  });

export const activeOrgQueryOptions = () =>
  queryOptions({ queryKey: organizationKeys.active(), queryFn: getActiveOrg });
