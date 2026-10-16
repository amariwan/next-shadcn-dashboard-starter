import type * as React from 'react';
import type { OrgPermission } from '@/lib/auth/rbac';

export type WidgetSize = 'small' | 'medium' | 'large' | 'full';

export type WidgetCategory = 'kpi' | 'chart' | 'feed' | 'summary' | 'custom';

export interface WidgetComponentProps {
  id: string;
  size: WidgetSize;
  config?: Record<string, unknown>;
}

export interface WidgetDefinition {
  id: string;
  title: string;
  description: string;
  category: WidgetCategory;
  defaultSize: WidgetSize;
  supportedSizes: WidgetSize[];
  requiredPermissions?: OrgPermission[];
  component: React.ComponentType<WidgetComponentProps>;
}

export interface WidgetLayoutItem {
  id: string;
  size: WidgetSize;
  config?: Record<string, unknown>;
}

export interface DashboardLayoutData {
  items: WidgetLayoutItem[];
  updatedAt?: string;
}
