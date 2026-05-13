'use client';

import { useMemo } from 'react';
import type { NavItem, NavGroup } from '@/types';

/**
 * Hook to filter navigation items based on simple RBAC
 *
 * For actual security (API routes, server actions), always use server-side checks.
 * This is only for UI visibility.
 */
export function useFilteredNavItems(items: NavItem[]) {
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // No access restrictions
      if (!item.access) {
        return true;
      }

      // For requireOrg checks, always show (no org system anymore)
      if (item.access.requireOrg) {
        return true;
      }

      // Check role
      if (item.access.role) {
        return true;
      }

      // Plan/feature checks removed (no longer supported)
      return true;
    });
  }, [items]);

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
