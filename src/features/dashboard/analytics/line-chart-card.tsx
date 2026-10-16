'use client';

import * as React from 'react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
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

export interface LineChartDataPoint {
  label: string;
  [key: string]: string | number;
}

export interface LineChartCardProps {
  title?: string;
  description?: string;
  data?: LineChartDataPoint[];
  metrics?: Array<{
    key: string;
    label: string;
    color: string;
  }>;
  trendValue?: number | string;
  trendDirection?: 'up' | 'down' | 'neutral';
  isDemo?: boolean;
  className?: string;
}

const DEFAULT_DATA: LineChartDataPoint[] = [
  { label: 'Jan', active: 180, retention: 92 },
  { label: 'Feb', active: 220, retention: 94 },
  { label: 'Mar', active: 310, retention: 91 },
  { label: 'Apr', active: 290, retention: 95 },
  { label: 'May', active: 380, retention: 97 },
  { label: 'Jun', active: 450, retention: 96 }
];

export function LineChartCard({
  title = 'Performance & Retention Trends',
  description = 'Active users and retention rate over time',
  data = DEFAULT_DATA,
  metrics = [
    { key: 'active', label: 'Active Users', color: 'var(--chart-1)' },
    { key: 'retention', label: 'Retention Rate %', color: 'var(--chart-2)' }
  ],
  trendValue = 18.2,
  trendDirection = 'up',
  isDemo = true,
  className
}: LineChartCardProps) {
  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {};
    for (const m of metrics) {
      config[m.key] = { label: m.label, color: m.color };
    }
    return config;
  }, [metrics]);

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
            <TrendIndicator value={trendValue} direction={trendDirection} label='vs prev period' />
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className='aspect-auto h-[240px] w-full'>
          <LineChart accessibilityLayer data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
            {metrics.map((m) => (
              <Line
                key={m.key}
                type='monotone'
                dataKey={m.key}
                stroke={m.color}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
