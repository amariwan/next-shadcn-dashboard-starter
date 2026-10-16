'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
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

export interface BarChartDataPoint {
  label: string;
  [key: string]: string | number;
}

export interface BarChartCardProps {
  title?: string;
  description?: string;
  data?: BarChartDataPoint[];
  bars?: Array<{
    key: string;
    label: string;
    color: string;
  }>;
  trendValue?: number | string;
  trendDirection?: 'up' | 'down' | 'neutral';
  isDemo?: boolean;
  className?: string;
}

const DEFAULT_DATA: BarChartDataPoint[] = [
  { label: 'Jan', desktop: 186, mobile: 80 },
  { label: 'Feb', desktop: 305, mobile: 200 },
  { label: 'Mar', desktop: 237, mobile: 120 },
  { label: 'Apr', desktop: 173, mobile: 190 },
  { label: 'May', desktop: 209, mobile: 130 },
  { label: 'Jun', desktop: 284, mobile: 160 }
];

export function BarChartCard({
  title = 'Traffic Distribution',
  description = 'Desktop vs Mobile visitors',
  data = DEFAULT_DATA,
  bars = [
    { key: 'desktop', label: 'Desktop', color: 'var(--chart-1)' },
    { key: 'mobile', label: 'Mobile', color: 'var(--chart-2)' }
  ],
  trendValue = 12.4,
  trendDirection = 'up',
  isDemo = true,
  className
}: BarChartCardProps) {
  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {};
    for (const b of bars) {
      config[b.key] = { label: b.label, color: b.color };
    }
    return config;
  }, [bars]);

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
          <BarChart accessibilityLayer data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
            {bars.map((b) => (
              <Bar
                key={b.key}
                dataKey={b.key}
                fill={b.color}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
