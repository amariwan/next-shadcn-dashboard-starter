'use client';

import * as React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  arrayMove
} from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { widgetRegistry } from './registry';
import { SortableWidgetWrapper } from './widget-wrapper';
import { WidgetCatalogDialog } from './widget-catalog-dialog';
import { WidgetConfigDialog } from './widget-config-dialog';
import { DashboardExportImport } from './dashboard-export-import';
import type { WidgetLayoutItem, WidgetSize, WidgetDefinition } from './types';
import {
  dashboardLayoutQueryOptions,
  dashboardLayoutKeys,
  saveDashboardLayoutApi,
  resetDashboardLayoutApi
} from '../api/queries';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export interface DashboardGridProps {
  organizationId?: string | null;
  dashboardId?: string;
  className?: string;
}

export function DashboardGrid({
  organizationId,
  dashboardId = 'overview',
  className
}: DashboardGridProps) {
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const queryClient = useQueryClient();
  const [isCustomizing, setIsCustomizing] = React.useState(false);
  const [configTarget, setConfigTarget] = React.useState<{
    item: WidgetLayoutItem;
    definition: WidgetDefinition;
  } | null>(null);

  const { data: layoutData, isLoading } = useQuery(
    dashboardLayoutQueryOptions(organizationId, dashboardId)
  );

  const [localItems, setLocalItems] = React.useState<WidgetLayoutItem[] | null>(null);
  const items = localItems ?? layoutData?.layout.items ?? widgetRegistry.getDefaultLayout().items;

  const saveMutation = useMutation({
    mutationFn: (newItems: WidgetLayoutItem[]) =>
      saveDashboardLayoutApi({
        items: newItems,
        organizationId,
        dashboardId
      }),
    onSuccess: (updatedLayout) => {
      setLocalItems(updatedLayout.items);
      queryClient.setQueryData(
        dashboardLayoutKeys.layout(organizationId, dashboardId),
        { layout: updatedLayout, isDefault: false }
      );
      toast.success('Dashboard layout saved');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to save layout');
    }
  });

  const resetMutation = useMutation({
    mutationFn: () => resetDashboardLayoutApi({ organizationId, dashboardId }),
    onSuccess: (defaultLayout) => {
      setLocalItems(null);
      queryClient.setQueryData(
        dashboardLayoutKeys.layout(organizationId, dashboardId),
        { layout: defaultLayout, isDefault: true }
      );
      toast.success(t('layoutReset'));
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to reset layout');
    }
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    setLocalItems(reordered);
    saveMutation.mutate(reordered);
  };

  const handleResize = (widgetId: string, nextSize: WidgetSize) => {
    const updated = items.map((item) =>
      item.id === widgetId ? { ...item, size: nextSize } : item
    );
    setLocalItems(updated);
    saveMutation.mutate(updated);
  };

  const handleRemove = (widgetId: string) => {
    const updated = items.filter((item) => item.id !== widgetId);
    setLocalItems(updated);
    saveMutation.mutate(updated);
    toast.success('Widget removed');
  };

  const handleAddWidget = (definition: WidgetDefinition) => {
    if (items.some((item) => item.id === definition.id)) {
      return;
    }
    const updated = [
      ...items,
      { id: definition.id, size: definition.defaultSize }
    ];
    setLocalItems(updated);
    saveMutation.mutate(updated);
    toast.success(`${definition.title} added`);
  };

  const handleSaveConfig = (widgetId: string, config: Record<string, unknown>) => {
    const updated = items.map((item) =>
      item.id === widgetId ? { ...item, config } : item
    );
    setLocalItems(updated);
    saveMutation.mutate(updated);
    toast.success('Widget settings updated');
  };

  const handleImportLayout = (importedItems: WidgetLayoutItem[]) => {
    setLocalItems(importedItems);
    saveMutation.mutate(importedItems);
  };

  if (isLoading) {
    return (
      <div className={cn('grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4', className)}>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className='h-[160px] animate-pulse bg-muted/40' />
        ))}
      </div>
    );
  }

  const activeWidgetIds = items.map((i) => i.id);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Top Toolbar */}
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div className='flex items-center gap-2'>
          <Button
            variant={isCustomizing ? 'secondary' : 'outline'}
            size='sm'
            onClick={() => setIsCustomizing((prev) => !prev)}
            className='gap-1.5'
          >
            <Icons.settings className='size-3.5' />
            <span>{isCustomizing ? tCommon('actions.close') : t('customizeLayout')}</span>
          </Button>

          {isCustomizing && (
            <>
              <WidgetCatalogDialog
                activeWidgetIds={activeWidgetIds}
                onAddWidget={handleAddWidget}
              />
              <Button
                variant='ghost'
                size='sm'
                onClick={() => resetMutation.mutate()}
                isLoading={resetMutation.isPending}
                className='text-xs text-muted-foreground hover:text-foreground'
              >
                {t('resetLayout')}
              </Button>
            </>
          )}
        </div>

        {/* Export / Import Buttons */}
        <DashboardExportImport
          currentItems={items}
          onImportLayout={handleImportLayout}
        />
      </div>

      {/* Empty State */}
      {items.length === 0 ? (
        <Card className='flex flex-col items-center justify-center p-12 text-center'>
          <CardHeader className='pb-4'>
            <div className='mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-muted'>
              <Icons.kanban className='size-6 text-muted-foreground' />
            </div>
            <CardTitle>No widgets on your dashboard</CardTitle>
            <CardDescription>
              Customize your view by adding widgets from the catalog or reset to standard layout.
            </CardDescription>
          </CardHeader>
          <CardContent className='flex gap-3'>
            <WidgetCatalogDialog
              activeWidgetIds={[]}
              onAddWidget={handleAddWidget}
            />
            <Button
              variant='outline'
              onClick={() => resetMutation.mutate()}
              isLoading={resetMutation.isPending}
            >
              Reset to Default Layout
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Sortable Grid Layout */
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
              {items.map((item) => {
                const definition = widgetRegistry.get(item.id);
                if (!definition) return null;

                const Component = definition.component;

                return (
                  <SortableWidgetWrapper
                    key={item.id}
                    id={item.id}
                    size={item.size}
                    definition={definition}
                    onResize={(nextSize) => handleResize(item.id, nextSize)}
                    onRemove={() => handleRemove(item.id)}
                    onConfigure={() => setConfigTarget({ item, definition })}
                    isCustomizing={isCustomizing}
                  >
                    <Component
                      id={item.id}
                      size={item.size}
                      config={item.config}
                    />
                  </SortableWidgetWrapper>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Widget Settings Modal */}
      {configTarget && (
        <WidgetConfigDialog
          open={!!configTarget}
          onOpenChange={(open) => !open && setConfigTarget(null)}
          widgetItem={configTarget.item}
          definition={configTarget.definition}
          onSaveConfig={handleSaveConfig}
        />
      )}
    </div>
  );
}
