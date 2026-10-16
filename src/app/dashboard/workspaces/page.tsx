import PageContainer from '@/components/layout/page-container';
import { requireAuth } from '@/lib/auth/guard';
import { orgsEnabled } from '@/lib/orgs';
import { getQueryClient } from '@/lib/query-client';
import { organizationsQueryOptions } from '@/features/organizations/api/queries';
import {
  WorkspaceList,
  WorkspaceListSkeleton
} from '@/features/organizations/components/workspace-list';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard: Workspaces'
};

export default async function Page() {
  if (!orgsEnabled) notFound();
  await requireAuth();

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(organizationsQueryOptions());

  return (
    <PageContainer
      pageTitle='Workspaces'
      pageDescription='Create and manage team workspaces (optional Orgs feature.)'
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<WorkspaceListSkeleton />}>
          <WorkspaceList />
        </Suspense>
      </HydrationBoundary>
    </PageContainer>
  );
}
