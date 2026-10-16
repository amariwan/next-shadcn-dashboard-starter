import { NextRequest, NextResponse } from 'next/server';
import { getSessionOr401, toServiceErrorResponse } from '@/app/api/organizations/_lib';
import { getDashboardMetrics } from '@/features/dashboard/api/metrics-service';

export async function GET(request: NextRequest) {
  const sessionOrError = await getSessionOr401();
  if (sessionOrError instanceof NextResponse) return sessionOrError;
  const session = sessionOrError;

  const { searchParams } = request.nextUrl;
  const orgId = searchParams.get('organizationId') || session.user.activeOrgId || null;

  try {
    const metrics = await getDashboardMetrics({
      userId: session.user.id,
      organizationId: orgId
    });

    return NextResponse.json({ success: true, metrics });
  } catch (error) {
    return toServiceErrorResponse(error);
  }
}
