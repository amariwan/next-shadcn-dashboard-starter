import type { DashboardFeature, FeatureContext } from './types';
import type { OrgPermission } from '@/lib/auth/rbac';
import { z } from 'zod';

class FeatureRegistry {
  private features = new Map<string, DashboardFeature>();

  constructor() {
    this.registerDefaults();
  }

  public register<TConfig = Record<string, unknown>>(
    feature: DashboardFeature<TConfig>
  ): void {
    this.features.set(feature.id, feature as unknown as DashboardFeature);
  }

  public get(id: string): DashboardFeature | undefined {
    return this.features.get(id);
  }

  public getAll(): DashboardFeature[] {
    return Array.from(this.features.values());
  }

  public setEnabled(id: string, enabled: boolean): boolean {
    const feature = this.features.get(id);
    if (!feature) return false;
    feature.enabled = enabled;
    return true;
  }

  /**
   * Check if a feature is enabled and all required dependencies and permissions are met.
   */
  public isEnabled(id: string, context?: FeatureContext): boolean {
    const feature = this.features.get(id);
    if (!feature || !feature.enabled) {
      return false;
    }

    // Check optional feature dependencies
    if (feature.dependencies && feature.dependencies.length > 0) {
      for (const depId of feature.dependencies) {
        if (!this.isEnabled(depId, context)) {
          return false;
        }
      }
    }

    // Check organization feature flag (e.g. workspaces)
    if (feature.id === 'workspaces' && context?.orgsEnabled === false) {
      return false;
    }

    // Check permissions if context is provided
    if (context && feature.requiredPermissions && feature.requiredPermissions.length > 0) {
      const userPermissions = context.permissions ?? [];
      const isSystemAdmin = context.systemRole === 'admin';
      const hasAll = feature.requiredPermissions.every((p) =>
        userPermissions.includes(p as OrgPermission)
      );
      if (!hasAll && !isSystemAdmin) {
        return false;
      }
    }

    // Check role if specified
    if (context && feature.requiredRole) {
      const activeRole = context.activeRole ?? null;
      const systemRole = context.systemRole ?? null;
      const matches =
        activeRole === feature.requiredRole ||
        (feature.requiredRole === 'admin' && activeRole === 'owner') ||
        systemRole === feature.requiredRole ||
        systemRole === 'admin';
      if (!matches) {
        return false;
      }
    }

    return true;
  }

  /**
   * Returns all features currently enabled for the given context.
   */
  public getEnabledFeatures(context?: FeatureContext): DashboardFeature[] {
    return this.getAll().filter((f) => this.isEnabled(f.id, context));
  }

  /**
   * Resets the registry back to default feature declarations.
   */
  public resetToDefaults(): void {
    this.features.clear();
    this.registerDefaults();
  }

  private registerDefaults(): void {
    // 1. Overview & Widgets
    this.register({
      id: 'overview',
      name: 'Overview Dashboard',
      description: 'Customizable dashboard overview with responsive widgets and metrics.',
      category: 'core',
      enabled: true,
      navItem: {
        title: 'Dashboard',
        url: '/dashboard/overview',
        icon: 'dashboard',
        shortcut: ['d', 'd'],
        isActive: false,
        items: []
      },
      configSchema: z.object({
        defaultView: z.enum(['overview', 'analytics']).default('overview')
      })
    });

    // 2. Workspaces & Multitenancy
    this.register({
      id: 'workspaces',
      name: 'Workspaces & Organizations',
      description: 'Multi-tenant organization workspaces, roles, and member management.',
      category: 'collaboration',
      enabled: true,
      navItem: {
        title: 'Workspaces',
        url: '/dashboard/workspaces',
        icon: 'building',
        shortcut: ['w', 'w'],
        isActive: false,
        items: [],
        access: { feature: 'orgs' }
      }
    });

    // 3. Audit Log
    this.register({
      id: 'audit-log',
      name: 'Audit Log',
      description: 'Immutable security log and activity history across tenant workspaces.',
      category: 'management',
      enabled: true,
      dependencies: ['workspaces'],
      requiredPermissions: ['audit.read'],
      navItem: {
        title: 'Audit Log',
        url: '/dashboard/audit-log',
        icon: 'clock',
        shortcut: ['a', 'l'],
        isActive: false,
        items: [],
        access: { feature: 'orgs', requireOrg: true, permission: 'audit.read' }
      }
    });

    // 4. Kanban Tasks
    this.register({
      id: 'kanban',
      name: 'Kanban Board',
      description: 'Task board with drag-and-drop workflow columns.',
      category: 'collaboration',
      enabled: true,
      navItem: {
        title: 'Kanban',
        url: '/dashboard/kanban',
        icon: 'kanban',
        shortcut: ['k', 'k'],
        isActive: false,
        items: []
      }
    });

    // 5. Users Management
    this.register({
      id: 'users',
      name: 'User Management',
      description: 'User accounts, directory, and profile management.',
      category: 'management',
      enabled: true,
      navItem: {
        title: 'Users',
        url: '/dashboard/users',
        icon: 'teams',
        shortcut: ['u', 'u'],
        isActive: false,
        items: []
      }
    });

    // 6. Products
    this.register({
      id: 'products',
      name: 'Products & Inventory',
      description: 'Product catalog, pricing, and status management.',
      category: 'management',
      enabled: true,
      navItem: {
        title: 'Product',
        url: '/dashboard/product',
        icon: 'product',
        shortcut: ['p', 'p'],
        isActive: false,
        items: []
      }
    });

    // 7. Chat
    this.register({
      id: 'chat',
      name: 'Team Chat',
      description: 'Real-time team chat and messaging.',
      category: 'collaboration',
      enabled: true,
      navItem: {
        title: 'Chat',
        url: '/dashboard/chat',
        icon: 'chat',
        shortcut: ['c', 'c'],
        isActive: false,
        items: []
      }
    });

    // 8. Notifications
    this.register({
      id: 'notifications',
      name: 'Notifications',
      description: 'In-app notifications and alerts.',
      category: 'collaboration',
      enabled: true,
      navItem: {
        title: 'Notifications',
        url: '/dashboard/notifications',
        icon: 'notification',
        shortcut: ['n', 'n'],
        isActive: false,
        items: []
      }
    });

    // 9. Profile
    this.register({
      id: 'profile',
      name: 'User Profile',
      description: 'Personal profile settings and account preferences.',
      category: 'core',
      enabled: true,
      navItem: {
        title: 'Profile',
        url: '/dashboard/profile',
        icon: 'profile',
        isActive: false,
        items: []
      }
    });
  }
}

export const featureRegistry = new FeatureRegistry();
