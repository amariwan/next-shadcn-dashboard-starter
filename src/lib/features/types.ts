import type { OrgPermission } from '@/lib/auth/rbac';
import type { NavItem } from '@/types';
import type { z } from 'zod';

export type FeatureCategory =
  | 'core'
  | 'analytics'
  | 'collaboration'
  | 'management'
  | 'demo';

export interface FeatureContext {
  orgsEnabled?: boolean;
  activeRole?: string | null;
  permissions?: readonly OrgPermission[];
  systemRole?: string | null;
}

export interface DashboardFeature<TConfig = Record<string, unknown>> {
  id: string;
  name: string;
  description: string;
  category: FeatureCategory;
  enabled: boolean;
  navItem?: NavItem;
  requiredPermissions?: OrgPermission[];
  requiredRole?: string;
  dependencies?: string[];
  configSchema?: z.ZodType<TConfig>;
  defaultConfig?: TConfig;
}
