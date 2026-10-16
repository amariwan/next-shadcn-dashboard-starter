'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type TimeRangeValue = '24h' | '7d' | '30d' | '90d' | '1y';

export interface TimeRangePickerProps {
  value?: TimeRangeValue;
  onChange?: (value: TimeRangeValue) => void;
  className?: string;
}

const RANGES: Array<{ label: string; value: TimeRangeValue }> = [
  { label: '24h', value: '24h' },
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' },
  { label: '1Y', value: '1y' }
];

export function TimeRangePicker({
  value = '30d',
  onChange,
  className
}: TimeRangePickerProps) {
  const [selected, setSelected] = React.useState<TimeRangeValue>(value);

  const handleSelect = (val: TimeRangeValue) => {
    setSelected(val);
    onChange?.(val);
  };

  return (
    <div
      role='group'
      aria-label='Select analytics time range'
      className={cn(
        'bg-muted/70 inline-flex items-center rounded-lg p-0.5 text-xs font-medium',
        className
      )}
    >
      {RANGES.map((range) => {
        const isCurrent = (value ?? selected) === range.value;
        return (
          <Button
            key={range.value}
            type='button'
            variant='ghost'
            size='sm'
            onClick={() => handleSelect(range.value)}
            className={cn(
              'h-7 px-2.5 text-xs transition-all',
              isCurrent
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {range.label}
          </Button>
        );
      })}
    </div>
  );
}
