'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import type { NavItem, NavGroup } from '@/types';
import { orgsEnabled } from '@/lib/orgs';
import { activeOrgQueryOptions } from '@/features/organizations/api/queries';
import { featureRegistry } from '@/lib/features/registry';
import {
  getOrgPermissions,
  hasSystemPermission,
  type OrgPermission,
  type SystemRole
} from '@/lib/auth/rbac';

const URL_TO_FEATURE_MAP: Record<string, string> = {
  '/dashboard/overview': 'overview',
  '/dashboard/workspaces': 'workspaces',
  '/dashboard/audit-log': 'audit-log',
  '/dashboard/kanban': 'kanban',
  '/dashboard/users': 'users',
  '/dashboard/product': 'products',
  '/dashboard/chat': 'chat',
  '/dashboard/notifications': 'notifications',
  '/dashboard/profile': 'profile'
};

/**
 * Hook to filter navigation items based on central RBAC.
 *
 * - `access.feature === 'orgs'` items only show when the optional
 *   Orgs/Teams feature is enabled (NEXT_PUBLIC_ORGS_ENABLED).
 * - `access.requireOrg` items only show when the user belongs to ≥1 org.
 * - `access.permission` items filter based on active org permissions
 *   (or system admin privileges).
 * - `access.role` items filter based on active org role or system role.
 *
 * When the user switches workspaces, the active organization's role and
 * permissions update via TanStack Query and navigation updates synchronously.
 */
export function useFilteredNavItems(items: NavItem[]) {
  const { data: session } = useSession();
  const { data: orgState } = useQuery({
    ...activeOrgQueryOptions(),
    enabled: orgsEnabled
  });

  const hasOrg = (orgState?.organizations.length ?? 0) > 0;
  const activeOrgRole = orgState?.activeOrgRole ?? null;
  const effectivePermissions = useMemo(() => {
    return orgState?.permissions ?? getOrgPermissions(activeOrgRole);
  }, [orgState?.permissions, activeOrgRole]);

  const systemRole = (session?.user?.role as SystemRole | undefined) ?? null;

  const filteredItems = useMemo(() => {
    const filterItem = (item: NavItem): NavItem | null => {
      // Check feature registry by URL mapping or access.feature
      const mappedFeatureId =
        URL_TO_FEATURE_MAP[item.url] ??
        (item.access?.feature && item.access.feature !== 'orgs' ? item.access.feature : undefined);
      if (
        mappedFeatureId &&
        !featureRegistry.isEnabled(mappedFeatureId, {
          orgsEnabled,
          activeRole: activeOrgRole,
          permissions: effectivePermissions,
          systemRole
        })
      ) {
        return null;
      }

      if (item.access) {
        // Optional Orgs feature gate
        if (item.access.feature === 'orgs' && !orgsEnabled) {
          return null;
        }

        // Only show once the user belongs to an organization
        if (item.access.requireOrg && orgsEnabled && !hasOrg) {
          return null;
        }

        // Granular permission check
        if (item.access.permission) {
          const perm = item.access.permission as OrgPermission;
          const hasPerm = effectivePermissions.includes(perm);
          const isSystemAdmin = hasSystemPermission(systemRole, 'system.admin');
          if (!hasPerm && !isSystemAdmin) {
            return null;
          }
        }

        // Role check (matches organization role or system role)
        if (item.access.role) {
          const requiredRole = item.access.role;
          const matchesOrgRole =
            activeOrgRole === requiredRole ||
            (requiredRole === 'admin' && activeOrgRole === 'owner') ||
            (requiredRole === 'member' &&
              (activeOrgRole === 'admin' || activeOrgRole === 'owner'));
          const matchesSystemRole = systemRole === requiredRole;

          if (!matchesOrgRole && !matchesSystemRole) {
            return null;
          }
        }
      }

      // Recursively filter sub-items if present
      if (item.items && item.items.length > 0) {
        const filteredChildren = item.items
          .map(filterItem)
          .filter((child): child is NavItem => child !== null);

        // If parent has placeholder url and all sub-items got filtered out, omit parent
        if (filteredChildren.length === 0 && (item.url === '#' || item.url === '')) {
          return null;
        }

        return { ...item, items: filteredChildren };
      }

      return item;
    };

    return items.map(filterItem).filter((item): item is NavItem => item !== null);
  }, [items, hasOrg, activeOrgRole, effectivePermissions, systemRole]);

  return filteredItems;
}

/**
 * Hook to filter navigation groups based on simple RBAC
 */
export function useFilteredNavGroups(groups: NavGroup[]) {
  const allItems = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const filteredItems = useFilteredNavItems(allItems);

  return useMemo(() => {
    const filteredSet = new Set(filteredItems.map((item) => item.title));
    return groups
      .map((group) => ({
        ...group,
        items: filteredItems.filter((item) =>
          group.items.some((gi) => gi.title === item.title && filteredSet.has(gi.title))
        )
      }))
      .filter((group) => group.items.length > 0);
  }, [groups, filteredItems]);
}
