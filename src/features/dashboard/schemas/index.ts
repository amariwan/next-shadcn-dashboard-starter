import { z } from 'zod';

export const widgetLayoutItemSchema = z.object({
  id: z.string().min(1),
  size: z.enum(['small', 'medium', 'large', 'full']),
  config: z.record(z.string(), z.unknown()).optional()
});

export const dashboardLayoutDataSchema = z.object({
  items: z.array(widgetLayoutItemSchema),
  updatedAt: z.string().optional()
});

export type WidgetLayoutItemInput = z.infer<typeof widgetLayoutItemSchema>;
export type DashboardLayoutDataInput = z.infer<typeof dashboardLayoutDataSchema>;
