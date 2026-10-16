import { queryOptions } from '@tanstack/react-query';
import type { DashboardLayoutData, WidgetLayoutItem } from '../widgets/types';
import type { GetLayoutResponse } from './types';
import type { DashboardMetrics } from './metrics-service';

export const dashboardLayoutKeys = {
  all: ['dashboard-layout'] as const,
  layout: (orgId?: string | null, dashboardId = 'overview') =>
    [...dashboardLayoutKeys.all, orgId ?? 'personal', dashboardId] as const
};

export const dashboardMetricsKeys = {
  all: ['dashboard-metrics'] as const,
  metrics: (orgId?: string | null) =>
    [...dashboardMetricsKeys.all, orgId ?? 'personal'] as const
};

export async function fetchDashboardMetrics(
  organizationId?: string | null
): Promise<DashboardMetrics> {
  const params = new URLSearchParams();
  if (organizationId) params.set('organizationId', organizationId);

  const res = await fetch(`/api/dashboard/metrics?${params.toString()}`);
  if (!res.ok) {
    throw new Error('Failed to load dashboard metrics');
  }
  const data = await res.json();
  return data.metrics;
}

export const dashboardMetricsQueryOptions = (organizationId?: string | null) =>
  queryOptions({
    queryKey: dashboardMetricsKeys.metrics(organizationId),
    queryFn: () => fetchDashboardMetrics(organizationId),
    staleTime: 1000 * 30 // 30 seconds cache
  });

export async function fetchDashboardLayout(
  organizationId?: string | null,
  dashboardId = 'overview'
): Promise<GetLayoutResponse> {
  const params = new URLSearchParams();
  if (organizationId) params.set('organizationId', organizationId);
  if (dashboardId) params.set('dashboardId', dashboardId);

  const res = await fetch(`/api/dashboard/layout?${params.toString()}`);
  if (!res.ok) {
    throw new Error('Failed to load dashboard layout');
  }
  return res.json();
}

export async function saveDashboardLayoutApi({
  items,
  organizationId,
  dashboardId = 'overview'
}: {
  items: WidgetLayoutItem[];
  organizationId?: string | null;
  dashboardId?: string;
}): Promise<DashboardLayoutData> {
  const res = await fetch('/api/dashboard/layout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, organizationId, dashboardId })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to save dashboard layout');
  }
  const data = await res.json();
  return data.layout;
}

export async function resetDashboardLayoutApi({
  organizationId,
  dashboardId = 'overview'
}: {
  organizationId?: string | null;
  dashboardId?: string;
}): Promise<DashboardLayoutData> {
  const params = new URLSearchParams();
  if (organizationId) params.set('organizationId', organizationId);
  if (dashboardId) params.set('dashboardId', dashboardId);

  const res = await fetch(`/api/dashboard/layout?${params.toString()}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    throw new Error('Failed to reset dashboard layout');
  }
  const data = await res.json();
  return data.layout;
}

export const dashboardLayoutQueryOptions = (
  organizationId?: string | null,
  dashboardId = 'overview'
) =>
  queryOptions({
    queryKey: dashboardLayoutKeys.layout(organizationId, dashboardId),
    queryFn: () => fetchDashboardLayout(organizationId, dashboardId),
    staleTime: 1000 * 60 * 5 // 5 minutes cache
  });
