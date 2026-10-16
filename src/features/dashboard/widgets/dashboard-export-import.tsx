'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { widgetRegistry } from './registry';
import { dashboardLayoutDataSchema } from '../schemas';
import type { DashboardLayoutData, WidgetLayoutItem } from './types';
import { toast } from 'sonner';

export interface DashboardExportImportProps {
  currentItems: WidgetLayoutItem[];
  onImportLayout: (items: WidgetLayoutItem[]) => void;
}

export function DashboardExportImport({
  currentItems,
  onImportLayout
}: DashboardExportImportProps) {
  const [importOpen, setImportOpen] = React.useState(false);
  const [jsonInput, setJsonInput] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const handleExport = () => {
    const payload: DashboardLayoutData = {
      items: currentItems,
      updatedAt: new Date().toISOString()
    };
    const jsonString = JSON.stringify(payload, null, 2);

    try {
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard-layout-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      void navigator.clipboard.writeText(jsonString);
      toast.success('Layout exported & copied to clipboard');
    } catch {
      toast.error('Failed to export layout');
    }
  };

  const handleApplyImport = () => {
    setError(null);
    if (!jsonInput.trim()) {
      setError('Please paste a valid JSON layout string');
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      const validated = dashboardLayoutDataSchema.safeParse(parsed);
      if (!validated.success) {
        setError(validated.error.issues[0]?.message ?? 'Invalid layout structure');
        return;
      }

      // Check that at least some widgets exist in registry
      const validWidgets = validated.data.items.filter((item) =>
        widgetRegistry.get(item.id)
      );

      if (validWidgets.length === 0) {
        setError('No recognized widgets found in this layout configuration');
        return;
      }

      onImportLayout(validWidgets);
      setImportOpen(false);
      setJsonInput('');
      toast.success(`Imported ${validWidgets.length} widgets into dashboard`);
    } catch (err: unknown) {
      setError((err as Error).message || 'Invalid JSON format');
    }
  };

  return (
    <div className='flex items-center gap-1.5'>
      <Button
        variant='outline'
        size='sm'
        onClick={handleExport}
        className='gap-1.5 text-xs'
        title='Download layout JSON'
      >
        <Icons.upload className='size-3.5 rotate-180' />
        <span>Export</span>
      </Button>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogTrigger asChild>
          <Button variant='outline' size='sm' className='gap-1.5 text-xs'>
            <Icons.upload className='size-3.5' />
            <span>Import</span>
          </Button>
        </DialogTrigger>
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle>Import Dashboard Layout</DialogTitle>
            <DialogDescription>
              Paste a previously exported layout JSON configuration below.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-3 py-2'>
            <Label htmlFor='layout-json'>Layout JSON Configuration</Label>
            <Textarea
              id='layout-json'
              rows={8}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='{"items": [{"id": "kpi-revenue", "size": "small"}]}'
              className='font-mono text-xs'
            />
            {error && <p className='text-destructive text-xs'>{error}</p>}
          </div>

          <DialogFooter className='gap-2 sm:gap-0'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => {
                setImportOpen(false);
                setError(null);
                setJsonInput('');
              }}
            >
              Cancel
            </Button>
            <Button size='sm' onClick={handleApplyImport}>
              Apply Layout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
