import { describe, expect, it, beforeEach } from 'bun:test';
import { getOrgPrisma } from '@/lib/auth/organization';
import {
  getDashboardLayout,
  saveDashboardLayout,
  resetDashboardLayout
} from './service';
import type { WidgetLayoutItem } from '../widgets/types';

describe('Dashboard Layout Persistence & Tenant Isolation', () => {
  const prisma = getOrgPrisma();

  let user1: { id: string; email: string };
  let user2: { id: string; email: string };
  let orgAlpha: { id: string; name: string };
  let orgBeta: { id: string; name: string };

  beforeEach(async () => {
    // Clean up test data
    await prisma.dashboardLayout.deleteMany({
      where: {
        dashboardId: { startsWith: 'test-dash' }
      }
    });

    await prisma.user.deleteMany({
      where: {
        email: { contains: 'test-layout-' }
      }
    });

    user1 = await prisma.user.create({
      data: {
        email: `test-layout-user1-${Date.now()}@example.com`,
        password: 'password',
        name: 'Layout User 1'
      }
    });

    user2 = await prisma.user.create({
      data: {
        email: `test-layout-user2-${Date.now()}@example.com`,
        password: 'password',
        name: 'Layout User 2'
      }
    });

    orgAlpha = await prisma.organization.create({
      data: {
        name: 'Layout Org Alpha',
        slug: `layout-org-alpha-${Date.now()}`,
        createdById: user1.id
      }
    });

    orgBeta = await prisma.organization.create({
      data: {
        name: 'Layout Org Beta',
        slug: `layout-org-beta-${Date.now()}`,
        createdById: user1.id
      }
    });
  });

  it('returns default layout when no customized layout is stored', async () => {
    const res = await getDashboardLayout({
      userId: user1.id,
      organizationId: orgAlpha.id,
      dashboardId: 'test-dash-overview'
    });

    expect(res.isDefault).toBe(true);
    expect(res.layout.items.length).toBeGreaterThan(0);
  });

  it('saves and retrieves customized layout for a specific user and organization', async () => {
    const customItems: WidgetLayoutItem[] = [
      { id: 'kpi-revenue', size: 'medium' },
      { id: 'chart-bar', size: 'large' }
    ];

    const saved = await saveDashboardLayout({
      userId: user1.id,
      organizationId: orgAlpha.id,
      dashboardId: 'test-dash-overview',
      items: customItems
    });

    expect(saved.items.length).toBe(2);
    expect(saved.items[0].size).toBe('medium');
    expect(saved.items[1].size).toBe('large');

    // Retrieve saved layout
    const retrieved = await getDashboardLayout({
      userId: user1.id,
      organizationId: orgAlpha.id,
      dashboardId: 'test-dash-overview'
    });

    expect(retrieved.isDefault).toBe(false);
    expect(retrieved.layout.items.length).toBe(2);
    expect(retrieved.layout.items[0].id).toBe('kpi-revenue');
  });

  it('strictly isolates dashboard layouts between organizations (Tenant Isolation)', async () => {
    const alphaItems: WidgetLayoutItem[] = [
      { id: 'kpi-growth', size: 'small' }
    ];

    await saveDashboardLayout({
      userId: user1.id,
      organizationId: orgAlpha.id,
      dashboardId: 'test-dash-overview',
      items: alphaItems
    });

    // User 1 checking layout in Org Beta must NOT see Org Alpha's custom layout
    const betaLayout = await getDashboardLayout({
      userId: user1.id,
      organizationId: orgBeta.id,
      dashboardId: 'test-dash-overview'
    });

    expect(betaLayout.isDefault).toBe(true);
    expect(betaLayout.layout.items.length).not.toBe(1);
  });

  it('strictly isolates dashboard layouts between users in the same organization (User Isolation)', async () => {
    const user1Items: WidgetLayoutItem[] = [
      { id: 'chart-line', size: 'large' }
    ];

    await saveDashboardLayout({
      userId: user1.id,
      organizationId: orgAlpha.id,
      dashboardId: 'test-dash-overview',
      items: user1Items
    });

    // User 2 checking layout in Org Alpha must NOT see User 1's custom layout
    const user2Layout = await getDashboardLayout({
      userId: user2.id,
      organizationId: orgAlpha.id,
      dashboardId: 'test-dash-overview'
    });

    expect(user2Layout.isDefault).toBe(true);
    expect(user2Layout.layout.items.length).not.toBe(1);
  });

  it('resets custom layout back to standard default layout', async () => {
    await saveDashboardLayout({
      userId: user1.id,
      organizationId: orgAlpha.id,
      dashboardId: 'test-dash-overview',
      items: [{ id: 'kpi-accounts', size: 'small' }]
    });

    const resetLayout = await resetDashboardLayout({
      userId: user1.id,
      organizationId: orgAlpha.id,
      dashboardId: 'test-dash-overview'
    });

    expect(resetLayout.items.length).toBeGreaterThan(1);

    const check = await getDashboardLayout({
      userId: user1.id,
      organizationId: orgAlpha.id,
      dashboardId: 'test-dash-overview'
    });

    expect(check.isDefault).toBe(true);
  });

  it('validates layout item schema and rejects invalid widget size', async () => {
    const invalidItems = [
      { id: 'kpi-revenue', size: 'gigantic-size' as unknown }
    ];

    expect(
      saveDashboardLayout({
        userId: user1.id,
        organizationId: orgAlpha.id,
        dashboardId: 'test-dash-overview',
        items: invalidItems as WidgetLayoutItem[]
      })
    ).rejects.toThrow();
  });
});
