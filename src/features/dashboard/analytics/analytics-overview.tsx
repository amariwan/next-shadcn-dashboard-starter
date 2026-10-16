'use client';

import * as React from 'react';
import { KPICard } from './kpi-card';
import { LineChartCard } from './line-chart-card';
import { BarChartCard } from './bar-chart-card';
import { AreaChartCard } from './area-chart-card';
import { PieChartCard } from './pie-chart-card';
import { ActivityFeedCard } from './activity-feed-card';
import { RecentEventsCard } from './recent-events-card';
import { DataSummaryCard } from './data-summary-card';
import { TimeRangePicker, type TimeRangeValue } from './time-range-picker';
import { Icons } from '@/components/icons';

export function AnalyticsOverview() {
  const [timeRange, setTimeRange] = React.useState<TimeRangeValue>('30d');

  return (
    <div className='space-y-6'>
      {/* Top Controls */}
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div>
          <h3 className='text-lg font-semibold tracking-tight'>Platform Analytics & Insights</h3>
          <p className='text-muted-foreground text-xs'>
            Aggregated metrics for selected period ({timeRange.toUpperCase()})
          </p>
        </div>
        <TimeRangePicker value={timeRange} onChange={setTimeRange} />
      </div>

      {/* KPI Cards Row */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <KPICard
          title='Gross Revenue'
          value='$128,430'
          change={18.4}
          trendDirection='up'
          description='Revenue across active orgs'
          footerText={`Calculated over past ${timeRange}`}
          icon={<Icons.dollarSign className='size-4' />}
          isDemo
        />
        <KPICard
          title='Conversion Rate'
          value='3.42%'
          change={-0.8}
          trendDirection='down'
          description='Visitor-to-signup conversion'
          footerText='Requires landing page A/B test'
          icon={<Icons.trendingDown className='size-4' />}
          isDemo
        />
        <KPICard
          title='Active Sessions'
          value='4,892'
          change={14.1}
          trendDirection='up'
          description='Concurrent workspace members'
          footerText='Peak concurrency at 14:00 UTC'
          icon={<Icons.users className='size-4' />}
          isDemo
        />
        <KPICard
          title='Audit Compliance'
          value='100%'
          change={0}
          trendDirection='neutral'
          description='Zero tampering detected'
          footerText='All events cryptographically signed'
          icon={<Icons.check className='size-4' />}
        />
      </div>

      {/* Main Charts Row */}
      <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
        <div className='col-span-1 lg:col-span-4'>
          <AreaChartCard />
        </div>
        <div className='col-span-1 lg:col-span-3'>
          <PieChartCard />
        </div>
      </div>

      {/* Secondary Charts Row */}
      <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
        <div className='col-span-1 lg:col-span-4'>
          <LineChartCard />
        </div>
        <div className='col-span-1 lg:col-span-3'>
          <BarChartCard />
        </div>
      </div>

      {/* Feeds & Summaries Row */}
      <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
        <ActivityFeedCard className='col-span-1' />
        <RecentEventsCard className='col-span-1' />
        <DataSummaryCard className='col-span-1' />
      </div>
    </div>
  );
}
