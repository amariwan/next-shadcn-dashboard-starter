import * as React from 'react';
import type { WidgetDefinition, DashboardLayoutData } from './types';
import {
  KPICard,
  BarChartCard,
  AreaChartCard,
  LineChartCard,
  PieChartCard,
  ActivityFeedCard,
  DataSummaryCard,
  RecentEventsCard
} from '../analytics';
import { Icons } from '@/components/icons';

class WidgetRegistry {
  private widgets = new Map<string, WidgetDefinition>();

  constructor() {
    this.registerDefaults();
  }

  public register(definition: WidgetDefinition): void {
    this.widgets.set(definition.id, definition);
  }

  public get(id: string): WidgetDefinition | undefined {
    return this.widgets.get(id);
  }

  public getAll(): WidgetDefinition[] {
    return Array.from(this.widgets.values());
  }

  public getDefaultLayout(): DashboardLayoutData {
    return {
      items: [
        { id: 'kpi-revenue', size: 'small' },
        { id: 'kpi-customers', size: 'small' },
        { id: 'kpi-accounts', size: 'small' },
        { id: 'kpi-growth', size: 'small' },
        { id: 'chart-bar', size: 'medium' },
        { id: 'chart-area', size: 'medium' },
        { id: 'chart-line', size: 'medium' },
        { id: 'chart-pie', size: 'medium' },
        { id: 'feed-activity', size: 'medium' },
        { id: 'summary-resources', size: 'medium' }
      ]
    };
  }

  private registerDefaults(): void {
    // 1. KPI Revenue
    this.register({
      id: 'kpi-revenue',
      title: 'Total Revenue',
      description: 'Monthly gross recurring revenue and trend',
      category: 'kpi',
      defaultSize: 'small',
      supportedSizes: ['small', 'medium'],
      component: () => (
        <KPICard
          title='Total Revenue'
          value='$45,231.89'
          change={20.1}
          trendDirection='up'
          description='+20.1% from last month'
          footerText='Reconciled across active subscriptions'
          icon={<Icons.dollarSign className='size-4' />}
          isDemo
        />
      )
    });

    // 2. KPI Customers
    this.register({
      id: 'kpi-customers',
      title: 'New Customers',
      description: 'Newly acquired user accounts this billing cycle',
      category: 'kpi',
      defaultSize: 'small',
      supportedSizes: ['small', 'medium'],
      component: () => (
        <KPICard
          title='New Customers'
          value='+2,350'
          change={-4.5}
          trendDirection='down'
          description='-4.5% from previous period'
          footerText='Requires conversion optimization'
          icon={<Icons.userPen className='size-4' />}
          isDemo
        />
      )
    });

    // 3. KPI Active Accounts
    this.register({
      id: 'kpi-accounts',
      title: 'Active Accounts',
      description: 'Daily active verified accounts',
      category: 'kpi',
      defaultSize: 'small',
      supportedSizes: ['small', 'medium'],
      component: () => (
        <KPICard
          title='Active Accounts'
          value='12,234'
          change={12.5}
          trendDirection='up'
          description='High retention and engagement'
          footerText='Exceeding Q4 platform target'
          icon={<Icons.users className='size-4' />}
          isDemo
        />
      )
    });

    // 4. KPI Growth Rate
    this.register({
      id: 'kpi-growth',
      title: 'Platform Growth Rate',
      description: 'Net week-over-week compounding growth',
      category: 'kpi',
      defaultSize: 'small',
      supportedSizes: ['small', 'medium'],
      component: () => (
        <KPICard
          title='Growth Rate'
          value='7.4%'
          change={2.1}
          trendDirection='up'
          description='Positive acceleration'
          footerText='Across web and mobile surfaces'
          icon={<Icons.trendingUp className='size-4' />}
          isDemo
        />
      )
    });

    // 5. Bar Chart
    this.register({
      id: 'chart-bar',
      title: 'Traffic & Visits Overview',
      description: 'Comparative traffic distribution',
      category: 'chart',
      defaultSize: 'medium',
      supportedSizes: ['medium', 'large', 'full'],
      component: () => <BarChartCard />
    });

    // 6. Area Chart
    this.register({
      id: 'chart-area',
      title: 'Visitor Trends & Pageviews',
      description: 'Time-series audience trajectory',
      category: 'chart',
      defaultSize: 'medium',
      supportedSizes: ['medium', 'large', 'full'],
      component: () => <AreaChartCard />
    });

    // 7. Line Chart
    this.register({
      id: 'chart-line',
      title: 'Performance & Retention',
      description: 'Cohort performance retention trends',
      category: 'chart',
      defaultSize: 'medium',
      supportedSizes: ['medium', 'large', 'full'],
      component: () => <LineChartCard />
    });

    // 8. Pie Chart
    this.register({
      id: 'chart-pie',
      title: 'Device Breakdown',
      description: 'Client device and viewport breakdown',
      category: 'chart',
      defaultSize: 'medium',
      supportedSizes: ['medium', 'large'],
      component: () => <PieChartCard />
    });

    // 9. Activity Feed
    this.register({
      id: 'feed-activity',
      title: 'Audit Activity Feed',
      description: 'Real-time workspace activity audit feed',
      category: 'feed',
      defaultSize: 'medium',
      supportedSizes: ['medium', 'large', 'full'],
      component: () => <ActivityFeedCard />
    });

    // 10. Data Summary
    this.register({
      id: 'summary-resources',
      title: 'System & Resource Usage',
      description: 'Cloud quotas, database compute and compliance',
      category: 'summary',
      defaultSize: 'medium',
      supportedSizes: ['medium', 'large', 'full'],
      component: () => <DataSummaryCard />
    });

    // 11. Recent Events
    this.register({
      id: 'events-system',
      title: 'System Operations Timeline',
      description: 'Automated CI/CD and platform pipelines',
      category: 'feed',
      defaultSize: 'medium',
      supportedSizes: ['medium', 'large', 'full'],
      component: () => <RecentEventsCard />
    });
  }
}

export const widgetRegistry = new WidgetRegistry();
