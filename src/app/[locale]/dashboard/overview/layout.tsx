import PageContainer from '@/components/layout/page-container';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardGrid } from '@/features/dashboard/widgets';
import { AnalyticsOverview } from '@/features/dashboard/analytics/analytics-overview';
import { useTranslations } from 'next-intl';
import React from 'react';

export default function OverViewLayout({
  sales,
  pie_stats,
  bar_stats,
  area_stats
}: {
  sales: React.ReactNode;
  pie_stats: React.ReactNode;
  bar_stats: React.ReactNode;
  area_stats: React.ReactNode;
}) {
  const tAuth = useTranslations('auth');
  const tNav = useTranslations('nav');

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-2xl font-bold tracking-tight'>
            {tAuth('signInTitle')} 👋
          </h2>
        </div>

        <Tabs defaultValue='overview' className='space-y-4'>
          <TabsList>
            <TabsTrigger value='overview'>{tNav('overview')}</TabsTrigger>
            <TabsTrigger value='analytics'>Analytics</TabsTrigger>
            <TabsTrigger value='classic'>Classic View</TabsTrigger>
          </TabsList>

          {/* Modular Customizable Widget Engine */}
          <TabsContent value='overview' className='space-y-4'>
            <DashboardGrid />
          </TabsContent>

          {/* Deep Analytics Tab */}
          <TabsContent value='analytics' className='space-y-4'>
            <AnalyticsOverview />
          </TabsContent>

          {/* Classic Parallel Routes View (100% Backward Compatible) */}
          <TabsContent value='classic' className='space-y-4'>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7'>
              <div className='col-span-1 md:col-span-2 lg:col-span-4'>{bar_stats}</div>
              <div className='col-span-1 md:col-span-2 lg:col-span-3'>{sales}</div>
              <div className='col-span-1 md:col-span-2 lg:col-span-4'>{area_stats}</div>
              <div className='col-span-1 md:col-span-2 lg:col-span-3 min-h-0'>{pie_stats}</div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
