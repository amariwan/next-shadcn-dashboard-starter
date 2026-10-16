import { NextRequest, NextResponse } from 'next/server';
import {
  getSessionOr401,
  getMembershipOr403,
  err
} from '@/app/api/organizations/_lib';
import { getSessionOrganizations } from '@/lib/auth/organization';
import { hasOrgPermission, hasSystemPermission } from '@/lib/auth/rbac';
import {
  listAuditLogs,
  countAuditLogs,
  type AuditLogWithRelations
} from '@/features/organizations/api/audit-service';

export async function GET(request: NextRequest) {
  const sessionOrError = await getSessionOr401();
  if (sessionOrError instanceof NextResponse) return sessionOrError;
  const session = sessionOrError;

  const { searchParams } = request.nextUrl;
  const requestedOrgId = searchParams.get('organizationId') || undefined;
  const requestedUserId = searchParams.get('userId') || undefined;
  const action = searchParams.get('action') || undefined;
  const entityType = searchParams.get('entityType') || undefined;
  const search = searchParams.get('search') || undefined;
  const page = Math.max(Number(searchParams.get('page') ?? '1'), 1);
  const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? '20'), 1), 100);
  const cursor = searchParams.get('cursor') || undefined;

  const isSystemAdmin = hasSystemPermission(session.user.role, 'system.admin');

  let targetOrgId: string | null | undefined;
  let effectiveUserId: string | undefined;

  if (requestedOrgId) {
    // Verify that the user is an authorized member of the requested organization
    const membershipOrError = await getMembershipOr403(
      requestedOrgId,
      session.user.id,
      'member'
    );
    if (membershipOrError instanceof NextResponse) {
      return membershipOrError;
    }

    const membership = membershipOrError;
    const canReadOrgAudit = hasOrgPermission(membership.role, 'audit.read');

    targetOrgId = requestedOrgId;

    if (canReadOrgAudit || isSystemAdmin) {
      // Org admins and owners can view all logs in the org, optionally filtering by user
      effectiveUserId = requestedUserId;
    } else {
      // Standard members can only see their own logs within the organization
      if (requestedUserId && requestedUserId !== session.user.id) {
        return err('Forbidden: You can only view your own activity logs', 403);
      }
      effectiveUserId = session.user.id;
    }
  } else {
    // If no org ID is explicitly passed, scope to user's active organization
    const { organizations, activeOrgId, activeOrgRole } =
      await getSessionOrganizations(session.user.id);

    if (activeOrgId) {
      targetOrgId = activeOrgId;
      const canReadOrgAudit = hasOrgPermission(activeOrgRole, 'audit.read');

      if (canReadOrgAudit || isSystemAdmin) {
        effectiveUserId = requestedUserId;
      } else {
        effectiveUserId = session.user.id;
      }
    } else if (organizations.length > 0) {
      // Fallback to first membership
      targetOrgId = organizations[0].id;
      const canReadOrgAudit = hasOrgPermission(organizations[0].role, 'audit.read');

      if (canReadOrgAudit || isSystemAdmin) {
        effectiveUserId = requestedUserId;
      } else {
        effectiveUserId = session.user.id;
      }
    } else {
      // User has no organizations — can only see own personal logs
      targetOrgId = null;
      effectiveUserId = session.user.id;
    }
  }

  try {
    const filters = {
      organizationId: targetOrgId,
      userId: effectiveUserId,
      action,
      entityType,
      search,
      page,
      limit,
      cursor
    };

    const [logs, total] = await Promise.all([
      listAuditLogs(filters),
      countAuditLogs(filters)
    ]);

    const pageCount = Math.ceil(total / limit);

    return NextResponse.json({
      logs: logs.map((l: AuditLogWithRelations) => {
        let parsedMetadata: Record<string, unknown> | null = null;
        if (l.metadata) {
          try {
            parsedMetadata = JSON.parse(l.metadata);
          } catch {
            parsedMetadata = { raw: l.metadata };
          }
        }

        return {
          id: l.id,
          action: l.action,
          entityType: l.entityType,
          entityId: l.entityId,
          userId: l.userId,
          userName: l.user?.name ?? null,
          userEmail: l.user?.email ?? null,
          organizationId: l.organizationId,
          organizationName: l.organization?.name ?? null,
          metadata: parsedMetadata,
          createdAt: l.createdAt.toISOString()
        };
      }),
      total,
      page,
      pageCount,
      hasMore: page * limit < total
    });
  } catch (_error) {
    return NextResponse.json(
      { error: 'Failed to load audit logs' },
      { status: 500 }
    );
  }
}
