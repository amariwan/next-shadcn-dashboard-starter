import type { DashboardLayoutData, WidgetLayoutItem } from '../widgets/types';

export interface GetLayoutResponse {
  layout: DashboardLayoutData;
  isDefault: boolean;
}

export interface SaveLayoutInput {
  items: WidgetLayoutItem[];
  dashboardId?: string;
}

export interface SaveLayoutResponse {
  success: boolean;
  layout: DashboardLayoutData;
}
