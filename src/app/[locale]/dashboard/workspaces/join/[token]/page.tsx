import PageContainer from '@/components/layout/page-container';
import { requireAuth } from '@/lib/auth/guard';
import { orgsEnabled } from '@/lib/orgs';
import { getQueryClient } from '@/lib/query-client';
import { invitePreviewOptions } from '@/features/organizations/api/queries';
import {
  JoinWorkspace,
  JoinWorkspaceSkeleton
} from '@/features/organizations/components/join-workspace';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard: Join workspace'
};

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function Page(props: PageProps) {
  if (!orgsEnabled) notFound();
  await requireAuth();
  const { token } = await props.params;

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(invitePreviewOptions(token));

  return (
    <PageContainer pageTitle='Join workspace' pageDescription='Accept a teammate invite.'>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<JoinWorkspaceSkeleton />}>
          <JoinWorkspace token={token} />
        </Suspense>
      </HydrationBoundary>
    </PageContainer>
  );
}
