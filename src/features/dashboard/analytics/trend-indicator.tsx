import * as React from 'react';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface TrendIndicatorProps {
  value: number | string;
  direction?: 'up' | 'down' | 'neutral';
  label?: string;
  className?: string;
}

export function TrendIndicator({
  value,
  direction = 'up',
  label,
  className
}: TrendIndicatorProps) {
  const isPositive = direction === 'up';
  const isNegative = direction === 'down';

  return (
    <Badge
      variant='outline'
      className={cn(
        'gap-1 font-medium transition-colors',
        isPositive && 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
        isNegative && 'border-rose-500/30 text-rose-600 dark:text-rose-400',
        !isPositive && !isNegative && 'text-muted-foreground',
        className
      )}
    >
      {isPositive && <Icons.trendingUp className='size-3.5' />}
      {isNegative && <Icons.trendingDown className='size-3.5' />}
      {!isPositive && !isNegative && <span className='size-1.5 rounded-full bg-current' />}
      <span>{typeof value === 'number' ? `${value > 0 ? '+' : ''}${value}%` : value}</span>
      {label && <span className='text-muted-foreground ml-0.5 text-[10px]'>{label}</span>}
    </Badge>
  );
}
