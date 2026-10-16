import PageContainer from '@/components/layout/page-container';
import { requireAuth } from '@/lib/auth/guard';
import { getQueryClient } from '@/lib/query-client';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { auditLogsQueryOptions } from '@/features/organizations/api/queries';
import { AuditLogTable } from '@/features/organizations/components/audit-log-table';
import { AuditLogTableSkeleton } from '@/features/organizations/components/audit-log-table';
import { Suspense } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export const metadata = {
  title: 'Dashboard: Audit Log'
};

export default async function Page({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'auditLog' });

  await requireAuth();

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(auditLogsQueryOptions());

  return (
    <PageContainer
      pageTitle={t('title')}
      pageDescription={t('description')}
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<AuditLogTableSkeleton />}>
          <AuditLogTable />
        </Suspense>
      </HydrationBoundary>
    </PageContainer>
  );
}
