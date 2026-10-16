'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import type { WidgetDefinition, WidgetLayoutItem } from './types';

export interface WidgetConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  widgetItem: WidgetLayoutItem;
  definition: WidgetDefinition;
  onSaveConfig: (widgetId: string, config: Record<string, unknown>) => void;
}

function WidgetConfigForm({
  widgetItem,
  definition,
  onSave,
  onCancel
}: {
  widgetItem: WidgetLayoutItem;
  definition: WidgetDefinition;
  onSave: (config: Record<string, unknown>) => void;
  onCancel: () => void;
}) {
  const [customTitle, setCustomTitle] = React.useState<string>(
    (widgetItem.config?.customTitle as string) || definition.title
  );
  const [targetGoal, setTargetGoal] = React.useState<string>(
    (widgetItem.config?.targetGoal as string) || ''
  );
  const [timeRange, setTimeRange] = React.useState<string>(
    (widgetItem.config?.timeRange as string) || '30d'
  );
  const [accentColor, setAccentColor] = React.useState<string>(
    (widgetItem.config?.accentColor as string) || 'default'
  );

  const handleSave = () => {
    onSave({
      ...widgetItem.config,
      customTitle: customTitle.trim() || definition.title,
      targetGoal: targetGoal.trim() || undefined,
      timeRange,
      accentColor
    });
  };

  return (
    <>
      <div className='space-y-4 py-2 text-sm'>
        <div className='space-y-1.5'>
          <Label htmlFor='widget-title'>Display Title</Label>
          <Input
            id='widget-title'
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder={definition.title}
          />
        </div>

        <div className='space-y-1.5'>
          <Label htmlFor='widget-goal'>Target Goal (Optional)</Label>
          <Input
            id='widget-goal'
            value={targetGoal}
            onChange={(e) => setTargetGoal(e.target.value)}
            placeholder='e.g. $50,000 or 1,000 users'
          />
        </div>

        <div className='grid grid-cols-2 gap-3'>
          <div className='space-y-1.5'>
            <Label>Time Period</Label>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='24h'>Last 24 Hours</SelectItem>
                <SelectItem value='7d'>Last 7 Days</SelectItem>
                <SelectItem value='30d'>Last 30 Days</SelectItem>
                <SelectItem value='90d'>Last 90 Days</SelectItem>
                <SelectItem value='1y'>Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-1.5'>
            <Label>Color Accent</Label>
            <Select value={accentColor} onValueChange={setAccentColor}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='default'>Default Theme</SelectItem>
                <SelectItem value='emerald'>Emerald</SelectItem>
                <SelectItem value='blue'>Blue</SelectItem>
                <SelectItem value='violet'>Violet</SelectItem>
                <SelectItem value='rose'>Rose</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <DialogFooter className='gap-2 sm:gap-0'>
        <Button variant='outline' size='sm' onClick={onCancel}>
          Cancel
        </Button>
        <Button size='sm' onClick={handleSave}>
          Save Changes
        </Button>
      </DialogFooter>
    </>
  );
}

export function WidgetConfigDialog({
  open,
  onOpenChange,
  widgetItem,
  definition,
  onSaveConfig
}: WidgetConfigDialogProps) {
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>Configure {definition.title}</DialogTitle>
          <DialogDescription>
            Customize display settings, target values, and time periods for this widget.
          </DialogDescription>
        </DialogHeader>

        <WidgetConfigForm
          key={widgetItem.id}
          widgetItem={widgetItem}
          definition={definition}
          onSave={(config) => {
            onSaveConfig(widgetItem.id, config);
            onOpenChange(false);
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
