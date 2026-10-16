'use client';

import * as React from 'react';
import { Cell, Pie, PieChart } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';

export interface PieChartSegment {
  name: string;
  value: number;
  color: string;
}

export interface PieChartCardProps {
  title?: string;
  description?: string;
  data?: PieChartSegment[];
  isDemo?: boolean;
  className?: string;
}

const DEFAULT_DATA: PieChartSegment[] = [
  { name: 'Desktop', value: 45, color: 'var(--chart-1)' },
  { name: 'Mobile', value: 35, color: 'var(--chart-2)' },
  { name: 'Tablet', value: 15, color: 'var(--chart-3)' },
  { name: 'Other', value: 5, color: 'var(--chart-4)' }
];

export function PieChartCard({
  title = 'Traffic by Device',
  description = 'Visitor distribution by device type',
  data = DEFAULT_DATA,
  isDemo = true,
  className
}: PieChartCardProps) {
  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {};
    for (const segment of data) {
      config[segment.name.toLowerCase()] = {
        label: segment.name,
        color: segment.color
      };
    }
    return config;
  }, [data]);

  const total = React.useMemo(
    () => data.reduce((acc, curr) => acc + curr.value, 0),
    [data]
  );

  return (
    <Card className={className}>
      <CardHeader className='pb-0'>
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
      </CardHeader>
      <CardContent className='flex-1 pb-0'>
        <ChartContainer
          config={chartConfig}
          className='mx-auto aspect-square max-h-[220px]'
        >
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={data}
              dataKey='value'
              nameKey='name'
              innerRadius={50}
              strokeWidth={5}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className='flex-col gap-2 pt-2 text-xs'>
        <div className='grid w-full grid-cols-2 gap-2'>
          {data.map((entry) => {
            const percentage = Math.round((entry.value / total) * 100);
            return (
              <div key={entry.name} className='flex items-center justify-between text-muted-foreground'>
                <div className='flex items-center gap-1.5'>
                  <span className='size-2.5 rounded-xs' style={{ backgroundColor: entry.color }} />
                  <span className='truncate'>{entry.name}</span>
                </div>
                <span className='font-medium text-foreground'>{percentage}%</span>
              </div>
            );
          })}
        </div>
      </CardFooter>
    </Card>
  );
}
