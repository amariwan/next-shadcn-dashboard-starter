// ============================================================
// Audit Log Service — Data Access Layer (Server only)
// ============================================================
import { getOrgPrisma } from '@/lib/auth/organization';
import type { Prisma } from '@prisma/client';

export interface AuditLogWithRelations {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  organizationId: string | null;
  metadata: string | null;
  createdAt: Date;
  user?: { id: string; name: string | null; email: string } | null;
  organization?: { id: string; name: string; slug: string } | null;
}

const SENSITIVE_KEY_PATTERN =
  /password|token|secret|auth|key|credential|cookie|hash|bearer|authorization/i;

const MAX_STRING_LENGTH = 1000;
const MAX_ARRAY_ITEMS = 50;
const MAX_OBJECT_KEYS = 50;
const MAX_SERIALIZED_BYTES = 16 * 1024; // 16 KB

/**
 * Sanitizes metadata for audit logging:
 * - Redacts sensitive keys (passwords, tokens, secrets, cookies, etc.)
 * - Recursively processes nested objects AND arrays
 * - Truncates excessively long strings
 * - Limits nesting depth and total serialized size to prevent DoS
 */
export function sanitizeAuditMetadata(
  data?: Record<string, unknown> | null,
  depth = 0
): Record<string, unknown> | null {
  if (!data || typeof data !== 'object') return null;
  if (depth > 6) return { depthLimit: '[MAX_DEPTH_REACHED]' };

  const sanitizeValue = (val: unknown, currentDepth: number): unknown => {
    if (val === null || val === undefined) return val;
    if (typeof val === 'string') {
      if (val.length > MAX_STRING_LENGTH) {
        return `${val.slice(0, MAX_STRING_LENGTH)}...[TRUNCATED]`;
      }
      return val;
    }
    if (typeof val === 'number' || typeof val === 'boolean') {
      return val;
    }
    if (Array.isArray(val)) {
      if (currentDepth > 6) return ['[MAX_DEPTH_REACHED]'];
      const sliced = val.slice(0, MAX_ARRAY_ITEMS);
      const sanitizedArray = sliced.map((item) => {
        if (typeof item === 'object' && item !== null) {
          if (Array.isArray(item)) {
            return sanitizeValue(item, currentDepth + 1);
          }
          return sanitizeAuditMetadata(item as Record<string, unknown>, currentDepth + 1);
        }
        return sanitizeValue(item, currentDepth + 1);
      });
      if (val.length > MAX_ARRAY_ITEMS) {
        sanitizedArray.push(`...[${val.length - MAX_ARRAY_ITEMS} items truncated]`);
      }
      return sanitizedArray;
    }
    if (typeof val === 'object') {
      return sanitizeAuditMetadata(val as Record<string, unknown>, currentDepth + 1);
    }
    return String(val);
  };

  const sanitized: Record<string, unknown> = {};
  let keyCount = 0;

  for (const [key, val] of Object.entries(data)) {
    if (keyCount++ >= MAX_OBJECT_KEYS) {
      sanitized.keysTruncated = true;
      break;
    }

    if (SENSITIVE_KEY_PATTERN.test(key)) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = sanitizeValue(val, depth);
    }
  }

  // Size limit check on top level
  if (depth === 0) {
    try {
      const serialized = JSON.stringify(sanitized);
      if (serialized.length > MAX_SERIALIZED_BYTES) {
        return {
          warning: 'Metadata exceeded 16KB size limit and was truncated',
          summary: Object.keys(sanitized).slice(0, 10)
        };
      }
    } catch {
      return { error: 'Unserializable metadata' };
    }
  }

  return sanitized;
}

/**
 * Log an audit action atomically.
 * Supports passing a Prisma TransactionClient (`tx`) to guarantee
 * transactional consistency between mutations and their audit trail.
 */
export async function logAuditAction(
  {
    userId,
    action,
    entityType,
    entityId,
    organizationId,
    metadata
  }: {
    userId: string;
    action: string;
    entityType: string;
    entityId: string;
    organizationId?: string | null;
    metadata?: Record<string, unknown>;
  },
  tx?: Prisma.TransactionClient
) {
  const db = tx ?? getOrgPrisma();
  const sanitized = sanitizeAuditMetadata(metadata);

  return db.auditLog.create({
    data: {
      action,
      entityType,
      entityId,
      userId,
      organizationId: organizationId ?? null,
      metadata: sanitized ? JSON.stringify(sanitized) : null
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      organization: { select: { id: true, name: true, slug: true } }
    }
  });
}

/**
 * Log a security event (e.g. unauthorized attempt, privilege escalation, last owner violation).
 * Always executed in its own transaction so that security records persist even if the main action is rejected.
 */
export async function logSecurityEvent({
  userId,
  action,
  entityType = 'security',
  entityId,
  organizationId,
  reason,
  metadata
}: {
  userId: string;
  action: string;
  entityType?: string;
  entityId: string;
  organizationId?: string | null;
  reason: string;
  metadata?: Record<string, unknown>;
}) {
  const prisma = getOrgPrisma();
  const sanitized = sanitizeAuditMetadata({
    reason,
    ...metadata
  });

  return prisma.auditLog.create({
    data: {
      action,
      entityType,
      entityId,
      userId,
      organizationId: organizationId ?? null,
      metadata: sanitized ? JSON.stringify(sanitized) : null
    }
  });
}

export interface ListAuditLogsParams {
  organizationId?: string | null;
  userId?: string;
  action?: string;
  entityType?: string;
  search?: string;
  page?: number;
  limit?: number;
  cursor?: string;
}

function buildAuditWhereClause(
  filters: ListAuditLogsParams
): Prisma.AuditLogWhereInput {
  const where: Prisma.AuditLogWhereInput = {};

  if (filters.organizationId !== undefined) {
    where.organizationId = filters.organizationId;
  }
  if (filters.userId) {
    where.userId = filters.userId;
  }
  if (filters.action) {
    where.action = filters.action;
  }
  if (filters.entityType) {
    where.entityType = filters.entityType;
  }
  if (filters.search) {
    const q = filters.search.trim();
    if (q) {
      where.OR = [
        { action: { contains: q } },
        { entityType: { contains: q } },
        { entityId: { contains: q } }
      ];
    }
  }

  return where;
}

export async function listAuditLogs(
  filters: ListAuditLogsParams = {}
): Promise<AuditLogWithRelations[]> {
  const prisma = getOrgPrisma();
  const where = buildAuditWhereClause(filters);
  const limit = Math.min(Math.max(Number(filters.limit ?? 20), 1), 100);
  const page = Math.max(Number(filters.page ?? 1), 1);
  const skip = filters.cursor ? 1 : (page - 1) * limit;

  return prisma.auditLog.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
      organization: { select: { id: true, name: true, slug: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip,
    ...(filters.cursor ? { cursor: { id: filters.cursor } } : {})
  });
}

export async function countAuditLogs(
  filters: ListAuditLogsParams = {}
): Promise<number> {
  const prisma = getOrgPrisma();
  const where = buildAuditWhereClause(filters);
  return prisma.auditLog.count({ where });
}
