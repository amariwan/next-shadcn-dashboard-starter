'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { widgetRegistry } from './registry';
import type { WidgetDefinition } from './types';

export function WidgetCatalogDialog({
  activeWidgetIds,
  onAddWidget
}: {
  activeWidgetIds: string[];
  onAddWidget: (definition: WidgetDefinition) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const allWidgets = React.useMemo(() => widgetRegistry.getAll(), []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='outline' size='sm' className='gap-1.5'>
          <Icons.add className='size-4' />
          <span>Add Widget</span>
        </Button>
      </DialogTrigger>
      <DialogContent className='max-h-[85vh] max-w-2xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Widget Catalog</DialogTitle>
          <DialogDescription>
            Choose widgets to add to your custom dashboard view.
          </DialogDescription>
        </DialogHeader>

        <div className='grid grid-cols-1 gap-3 pt-2 md:grid-cols-2'>
          {allWidgets.map((widget) => {
            const isAdded = activeWidgetIds.includes(widget.id);

            return (
              <Card
                key={widget.id}
                className='flex flex-col justify-between transition-colors'
              >
                <CardHeader className='p-4 pb-2'>
                  <div className='flex items-start justify-between gap-2'>
                    <CardTitle className='text-sm font-semibold'>{widget.title}</CardTitle>
                    <Badge variant='outline' className='text-[10px] capitalize'>
                      {widget.category}
                    </Badge>
                  </div>
                  <CardDescription className='line-clamp-2 text-xs'>
                    {widget.description}
                  </CardDescription>
                </CardHeader>
                <div className='p-4 pt-2'>
                  <Button
                    size='sm'
                    variant={isAdded ? 'secondary' : 'default'}
                    className='w-full text-xs'
                    disabled={isAdded}
                    onClick={() => {
                      onAddWidget(widget);
                      setOpen(false);
                    }}
                  >
                    {isAdded ? (
                      <>
                        <Icons.check className='mr-1.5 size-3.5' /> Added
                      </>
                    ) : (
                      <>
                        <Icons.add className='mr-1.5 size-3.5' /> Add to Dashboard
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
