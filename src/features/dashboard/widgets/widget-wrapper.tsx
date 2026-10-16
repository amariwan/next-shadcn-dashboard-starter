'use client';

import * as React from 'react';
import type { WidgetSize, WidgetDefinition } from './types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class WidgetErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className='border-destructive/30 flex h-full min-h-[160px] flex-col justify-center text-center'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-destructive text-sm font-semibold'>
              {this.props.fallbackTitle ?? 'Widget failed to render'}
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-2'>
            <p className='text-muted-foreground text-xs'>
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <Button
              variant='outline'
              size='sm'
              className='text-xs'
              onClick={() => this.setState({ hasError: false })}
            >
              <Icons.refresh className='mr-1.5 size-3.5' /> Retry
            </Button>
          </CardContent>
        </Card>
      );
    }
    return this.props.children;
  }
}

export interface SortableWidgetWrapperProps {
  id: string;
  size: WidgetSize;
  definition: WidgetDefinition;
  children: React.ReactNode;
  onResize?: (size: WidgetSize) => void;
  onRemove?: () => void;
  onConfigure?: () => void;
  isCustomizing?: boolean;
}

const SIZE_COLUMN_CLASSES: Record<WidgetSize, string> = {
  small: 'col-span-1',
  medium: 'col-span-1 md:col-span-2',
  large: 'col-span-1 md:col-span-2 lg:col-span-3',
  full: 'col-span-1 md:col-span-2 lg:col-span-4'
};

export function SortableWidgetWrapper({
  id,
  size,
  definition,
  children,
  onResize,
  onRemove,
  onConfigure,
  isCustomizing = false
}: SortableWidgetWrapperProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.6 : 1
  };

  const colClass = SIZE_COLUMN_CLASSES[size] ?? 'col-span-1';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('group relative flex flex-col', colClass)}
    >
      {/* Widget Header Controls */}
      {isCustomizing && (
        <div className='bg-background/90 border-border/80 absolute -top-3 right-3 z-30 flex items-center gap-1 rounded-md border px-1.5 py-0.5 shadow-xs backdrop-blur-sm'>
          <button
            type='button'
            className='hover:bg-muted text-muted-foreground hover:text-foreground cursor-grab p-1'
            title='Drag to reorder'
            {...attributes}
            {...listeners}
          >
            <Icons.kanban className='size-3.5' />
          </button>

          {onConfigure && (
            <button
              type='button'
              className='hover:bg-muted text-muted-foreground hover:text-foreground p-1'
              title='Configure widget settings'
              onClick={onConfigure}
            >
              <Icons.settings className='size-3.5' />
            </button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type='button'
                className='hover:bg-muted text-muted-foreground hover:text-foreground p-1'
                title='Change size'
              >
                <Icons.adjustments className='size-3.5' />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-36 text-xs'>
              <DropdownMenuLabel className='text-[10px] text-muted-foreground'>
                Widget Width
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {definition.supportedSizes.map((s) => (
                <DropdownMenuItem
                  key={s}
                  onClick={() => onResize?.(s)}
                  className={cn(size === s && 'bg-accent font-medium')}
                >
                  <span className='capitalize'>{s}</span>
                  {size === s && <Icons.check className='ml-auto size-3.5' />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            type='button'
            className='hover:bg-destructive/10 text-muted-foreground hover:text-destructive p-1'
            title='Remove widget'
            onClick={onRemove}
          >
            <Icons.close className='size-3.5' />
          </button>
        </div>
      )}

      {/* Widget Render with Error Boundary */}
      <WidgetErrorBoundary fallbackTitle={`Error in ${definition.title}`}>
        {children}
      </WidgetErrorBoundary>
    </div>
  );
}
