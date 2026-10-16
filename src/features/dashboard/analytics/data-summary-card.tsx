import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export interface SummaryMetric {
  label: string;
  value: string | number;
  progress: number; // 0-100
  target?: string;
}

const DEFAULT_METRICS: SummaryMetric[] = [
  { label: 'Cloud Storage Quota', value: '74.2 GB', progress: 74, target: '100 GB' },
  { label: 'Monthly Active API Calls', value: '892,120', progress: 89, target: '1,000,000' },
  { label: 'Database Compute Usage', value: '42.5%', progress: 42, target: 'Max 80%' },
  { label: 'Security Compliance Score', value: '98 / 100', progress: 98, target: '100' }
];

export function DataSummaryCard({
  title = 'System & Resource Utilization',
  description = 'Current infrastructure metrics',
  metrics = DEFAULT_METRICS,
  isDemo = true,
  className
}: {
  title?: string;
  description?: string;
  metrics?: SummaryMetric[];
  isDemo?: boolean;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className='pb-3'>
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
      <CardContent className='space-y-4'>
        {metrics.map((m) => (
          <div key={m.label} className='space-y-1.5 text-xs'>
            <div className='flex items-center justify-between'>
              <span className='text-muted-foreground'>{m.label}</span>
              <span className='font-semibold text-foreground'>{m.value}</span>
            </div>
            <Progress value={m.progress} className='h-2' />
            {m.target && (
              <div className='text-muted-foreground flex justify-end text-[10px]'>
                Target: {m.target}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
