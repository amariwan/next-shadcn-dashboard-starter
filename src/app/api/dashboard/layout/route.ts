import { NextRequest, NextResponse } from 'next/server';
import { getSessionOr401, err, toServiceErrorResponse } from '@/app/api/organizations/_lib';
import {
  getDashboardLayout,
  saveDashboardLayout,
  resetDashboardLayout
} from '@/features/dashboard/api/service';
import { widgetLayoutItemSchema } from '@/features/dashboard/schemas';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  const sessionOrError = await getSessionOr401();
  if (sessionOrError instanceof NextResponse) return sessionOrError;
  const session = sessionOrError;

  const { searchParams } = request.nextUrl;
  const orgId = searchParams.get('organizationId') || session.user.activeOrgId || null;
  const dashboardId = searchParams.get('dashboardId') || 'overview';

  try {
    const result = await getDashboardLayout({
      userId: session.user.id,
      organizationId: orgId,
      dashboardId
    });

    return NextResponse.json(result);
  } catch (error) {
    return toServiceErrorResponse(error);
  }
}

const saveBodySchema = z.object({
  items: z.array(widgetLayoutItemSchema),
  organizationId: z.string().nullable().optional(),
  dashboardId: z.string().optional()
});

export async function POST(request: NextRequest) {
  const sessionOrError = await getSessionOr401();
  if (sessionOrError instanceof NextResponse) return sessionOrError;
  const session = sessionOrError;

  const body = await request.json().catch(() => null);
  const parsed = saveBodySchema.safeParse(body);
  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? 'Invalid layout payload');
  }

  const orgId = parsed.data.organizationId ?? session.user.activeOrgId ?? null;
  const dashboardId = parsed.data.dashboardId ?? 'overview';

  try {
    const saved = await saveDashboardLayout({
      userId: session.user.id,
      organizationId: orgId,
      dashboardId,
      items: parsed.data.items
    });

    return NextResponse.json({ success: true, layout: saved });
  } catch (error) {
    return toServiceErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  const sessionOrError = await getSessionOr401();
  if (sessionOrError instanceof NextResponse) return sessionOrError;
  const session = sessionOrError;

  const { searchParams } = request.nextUrl;
  const orgId = searchParams.get('organizationId') || session.user.activeOrgId || null;
  const dashboardId = searchParams.get('dashboardId') || 'overview';

  try {
    const layout = await resetDashboardLayout({
      userId: session.user.id,
      organizationId: orgId,
      dashboardId
    });

    return NextResponse.json({ success: true, layout });
  } catch (error) {
    return toServiceErrorResponse(error);
  }
}
