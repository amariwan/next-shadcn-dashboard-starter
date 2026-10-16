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
import { getTranslations, setRequestLocale } from 'next-intl/server';

export const metadata = {
  title: 'Dashboard: Workspaces'
};

export default async function Page({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'workspaces' });

  if (!orgsEnabled) notFound();
  await requireAuth();

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(organizationsQueryOptions());

  return (
    <PageContainer
      pageTitle={t('title')}
      pageDescription={t('description')}
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<WorkspaceListSkeleton />}>
          <WorkspaceList />
        </Suspense>
      </HydrationBoundary>
    </PageContainer>
  );
}
