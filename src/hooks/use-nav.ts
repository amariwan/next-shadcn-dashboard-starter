'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { NavItem, NavGroup } from '@/types';
import { orgsEnabled } from '@/lib/orgs';
import { activeOrgQueryOptions } from '@/features/organizations/api/queries';

/**
 * Hook to filter navigation items based on simple RBAC.
 *
 * - `access.feature === 'orgs'` items only show when the optional
 *   Orgs/Teams feature is enabled (NEXT_PUBLIC_ORGS_ENABLED).
 * - `access.requireOrg` items only show when the user belongs to ≥1 org.
 * - `access.role` is UI-only; real enforcement is server-side.
 *
 * For actual security (API routes, server actions), always use server-side checks.
 * This is only for UI visibility.
 */
export function useFilteredNavItems(items: NavItem[]) {
  const { data: orgState } = useQuery({
    ...activeOrgQueryOptions(),
    enabled: orgsEnabled
  });
  const hasOrg = (orgState?.organizations.length ?? 0) > 0;

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // No access restrictions
      if (!item.access) {
        return true;
      }

      // Optional Orgs feature gate
      if (item.access.feature === 'orgs' && !orgsEnabled) {
        return false;
      }

      // Only show once the user belongs to an organization
      if (item.access.requireOrg && orgsEnabled && !hasOrg) {
        return false;
      }

      // Role checks are UI hints only — server guards enforce.
      return true;
    });
  }, [items, hasOrg]);

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
