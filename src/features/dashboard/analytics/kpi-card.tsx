import * as React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardFooter
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendIndicator } from './trend-indicator';
import { cn } from '@/lib/utils';

export interface KPICardProps {
  title: string;
  value: string | number;
  change?: number | string;
  trendDirection?: 'up' | 'down' | 'neutral';
  description?: string;
  footerText?: string;
  icon?: React.ReactNode;
  isDemo?: boolean;
  className?: string;
}

export function KPICard({
  title,
  value,
  change,
  trendDirection = 'up',
  description,
  footerText,
  icon,
  isDemo = false,
  className
}: KPICardProps) {
  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all hover:shadow-sm',
        className
      )}
    >
      <CardHeader className='pb-2'>
        <div className='flex items-center justify-between'>
          <CardDescription className='font-medium'>{title}</CardDescription>
          <div className='flex items-center gap-1.5'>
            {isDemo && (
              <Badge variant='outline' className='text-muted-foreground text-[10px] uppercase'>
                Demo
              </Badge>
            )}
            {icon && <div className='text-muted-foreground'>{icon}</div>}
          </div>
        </div>
        <CardTitle className='text-2xl font-bold tabular-nums md:text-3xl'>{value}</CardTitle>
        {change !== undefined && (
          <CardAction>
            <TrendIndicator value={change} direction={trendDirection} />
          </CardAction>
        )}
      </CardHeader>
      {(footerText || description) && (
        <CardFooter className='flex-col items-start gap-1 pt-1 text-xs'>
          {description && <div className='font-medium text-foreground'>{description}</div>}
          {footerText && <div className='text-muted-foreground'>{footerText}</div>}
        </CardFooter>
      )}
    </Card>
  );
}
