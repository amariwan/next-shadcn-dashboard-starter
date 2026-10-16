import PageContainer from '@/components/layout/page-container';
import { requireOrgRole } from '@/lib/auth/guard';
import { orgsEnabled } from '@/lib/orgs';
import { getQueryClient } from '@/lib/query-client';
import {
  organizationDetailOptions,
  organizationInvitationsOptions,
  organizationMembersOptions
} from '@/features/organizations/api/queries';
import {
  WorkspaceDetail,
  WorkspaceDetailSkeleton
} from '@/features/organizations/components/workspace-detail';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard: Workspace'
};

type PageProps = {
  params: Promise<{ orgId: string }>;
};

export default async function Page(props: PageProps) {
  if (!orgsEnabled) notFound();
  const { orgId } = await props.params;
  const { membership } = await requireOrgRole(orgId);

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(organizationDetailOptions(orgId));
  void queryClient.prefetchQuery(organizationMembersOptions(orgId));
  // The invitations endpoint requires admin — only prefetch for managers
  // so plain members don't get a 403 prefetch.
  if (membership.role === 'owner' || membership.role === 'admin') {
    void queryClient.prefetchQuery(organizationInvitationsOptions(orgId));
  }

  return (
    <PageContainer pageTitle='Workspace' pageDescription='Members, invites and settings.'>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<WorkspaceDetailSkeleton />}>
          <WorkspaceDetail orgId={orgId} />
        </Suspense>
      </HydrationBoundary>
    </PageContainer>
  );
}
