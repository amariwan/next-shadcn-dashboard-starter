'use client';

import * as React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardAction
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';
import { TrendIndicator } from './trend-indicator';

export interface AreaChartDataPoint {
  label: string;
  [key: string]: string | number;
}

export interface AreaChartCardProps {
  title?: string;
  description?: string;
  data?: AreaChartDataPoint[];
  areas?: Array<{
    key: string;
    label: string;
    color: string;
  }>;
  trendValue?: number | string;
  trendDirection?: 'up' | 'down' | 'neutral';
  isDemo?: boolean;
  className?: string;
}

const DEFAULT_DATA: AreaChartDataPoint[] = [
  { label: 'Jan', visitors: 1200, pageviews: 2400 },
  { label: 'Feb', visitors: 1900, pageviews: 3100 },
  { label: 'Mar', visitors: 2400, pageviews: 4200 },
  { label: 'Apr', visitors: 2800, pageviews: 4800 },
  { label: 'May', visitors: 3500, pageviews: 6100 },
  { label: 'Jun', visitors: 4200, pageviews: 7400 }
];

export function AreaChartCard({
  title = 'Audience Growth & Pageviews',
  description = 'Total unique visitors and views',
  data = DEFAULT_DATA,
  areas = [
    { key: 'visitors', label: 'Visitors', color: 'var(--chart-1)' },
    { key: 'pageviews', label: 'Pageviews', color: 'var(--chart-2)' }
  ],
  trendValue = 24.8,
  trendDirection = 'up',
  isDemo = true,
  className
}: AreaChartCardProps) {
  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {};
    for (const a of areas) {
      config[a.key] = { label: a.label, color: a.color };
    }
    return config;
  }, [areas]);

  return (
    <Card className={className}>
      <CardHeader className='pb-2'>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='text-base font-semibold'>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {isDemo && (
            <Badge variant='outline' className='text-muted-foreground text-[10px] uppercase'>
              Demo Data
            </Badge>
          )}
        </div>
        {trendValue !== undefined && (
          <CardAction>
            <TrendIndicator value={trendValue} direction={trendDirection} />
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className='aspect-auto h-[240px] w-full'>
          <AreaChart accessibilityLayer data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              {areas.map((a) => (
                <linearGradient key={a.key} id={`fill-${a.key}`} x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='5%' stopColor={a.color} stopOpacity={0.8} />
                  <stop offset='95%' stopColor={a.color} stopOpacity={0.1} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} strokeDasharray='3 3' className='stroke-muted' />
            <XAxis
              dataKey='label'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              className='text-xs'
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} className='text-xs' />
            <ChartTooltip content={<ChartTooltipContent />} />
            {areas.map((a) => (
              <Area
                key={a.key}
                type='monotone'
                dataKey={a.key}
                stroke={a.color}
                fill={`url(#fill-${a.key})`}
                fillOpacity={0.4}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
