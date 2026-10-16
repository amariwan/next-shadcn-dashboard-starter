import { getOrgPrisma } from '@/lib/auth/organization';
import { widgetRegistry } from '../widgets/registry';
import type { DashboardLayoutData, WidgetLayoutItem } from '../widgets/types';
import { z } from 'zod';
import {
  widgetLayoutItemSchema,
  dashboardLayoutDataSchema
} from '../schemas';

export { widgetLayoutItemSchema, dashboardLayoutDataSchema };

/**
 * Load dashboard layout for a user, scoped by organization and dashboard ID.
 * Returns default layout if no customized layout is stored.
 */
export async function getDashboardLayout({
  userId,
  organizationId = null,
  dashboardId = 'overview'
}: {
  userId: string;
  organizationId?: string | null;
  dashboardId?: string;
}): Promise<{ layout: DashboardLayoutData; isDefault: boolean }> {
  const prisma = getOrgPrisma();

  const stored = await prisma.dashboardLayout.findFirst({
    where: {
      userId,
      organizationId: organizationId ?? null,
      dashboardId
    }
  });

  if (!stored) {
    return {
      layout: widgetRegistry.getDefaultLayout(),
      isDefault: true
    };
  }

  try {
    const parsed = JSON.parse(stored.layout);
    const valid = dashboardLayoutDataSchema.safeParse(parsed);
    if (valid.success) {
      return {
        layout: valid.data,
        isDefault: false
      };
    }
  } catch {
    // Fall back to default layout if parsing fails
  }

  return {
    layout: widgetRegistry.getDefaultLayout(),
    isDefault: true
  };
}

/**
 * Save customized dashboard layout scoped by userId, organizationId, and dashboardId.
 */
export async function saveDashboardLayout({
  userId,
  organizationId = null,
  dashboardId = 'overview',
  items
}: {
  userId: string;
  organizationId?: string | null;
  dashboardId?: string;
  items: WidgetLayoutItem[];
}): Promise<DashboardLayoutData> {
  const prisma = getOrgPrisma();

  const validatedItems = z.array(widgetLayoutItemSchema).parse(items);
  const layoutData: DashboardLayoutData = {
    items: validatedItems,
    updatedAt: new Date().toISOString()
  };

  const layoutString = JSON.stringify(layoutData);

  // Find existing record
  const existing = await prisma.dashboardLayout.findFirst({
    where: {
      userId,
      organizationId: organizationId ?? null,
      dashboardId
    }
  });

  if (existing) {
    await prisma.dashboardLayout.update({
      where: { id: existing.id },
      data: {
        layout: layoutString
      }
    });
  } else {
    await prisma.dashboardLayout.create({
      data: {
        userId,
        organizationId: organizationId ?? null,
        dashboardId,
        layout: layoutString
      }
    });
  }

  return layoutData;
}

/**
 * Reset dashboard layout back to defaults for a specific user and organization.
 */
export async function resetDashboardLayout({
  userId,
  organizationId = null,
  dashboardId = 'overview'
}: {
  userId: string;
  organizationId?: string | null;
  dashboardId?: string;
}): Promise<DashboardLayoutData> {
  const prisma = getOrgPrisma();

  await prisma.dashboardLayout.deleteMany({
    where: {
      userId,
      organizationId: organizationId ?? null,
      dashboardId
    }
  });

  return widgetRegistry.getDefaultLayout();
}
