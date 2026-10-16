import { describe, expect, it, beforeEach } from 'bun:test';
import {
  sanitizeAuditMetadata,
  logAuditAction,
  logSecurityEvent,
  listAuditLogs,
  countAuditLogs
} from './audit-service';
import { getOrgPrisma } from '@/lib/auth/organization';

describe('AuditLog Service & Security Hardening', () => {
  const prisma = getOrgPrisma();

  beforeEach(async () => {
    // Clean up test audit logs before each test
    await prisma.auditLog.deleteMany({
      where: {
        entityId: { startsWith: 'test-' }
      }
    });
  });

  describe('Security: Metadata Sanitization & Size Limits', () => {
    it('redacts sensitive keys in plain objects and deeply nested structures', () => {
      const sensitive = {
        name: 'Workspace Acme',
        password: 'super-secret-password',
        token: 'invite-token-12345',
        api_key: 'sk_live_12345',
        nested: {
          secretField: 'secret-val',
          publicInfo: 'visible'
        }
      };

      const result = sanitizeAuditMetadata(sensitive);
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Workspace Acme');
      expect(result?.password).toBe('[REDACTED]');
      expect(result?.token).toBe('[REDACTED]');
      expect(result?.api_key).toBe('[REDACTED]');
      expect((result?.nested as Record<string, unknown>)?.secretField).toBe('[REDACTED]');
      expect((result?.nested as Record<string, unknown>)?.publicInfo).toBe('visible');
    });

    it('redacts sensitive keys inside arrays and nested arrays of objects', () => {
      const payloadWithArrays = {
        items: [
          { token: 'secret-token-1', user: 'alice' },
          { password: 'hash-password-2', user: 'bob' },
          'normal-string'
        ],
        publicList: ['clear-item', { apiKey: 'secret-key-3' }]
      };

      const result = sanitizeAuditMetadata(payloadWithArrays);
      expect(result).not.toBeNull();

      const items = result?.items as unknown[];
      expect(items).toBeArray();
      expect((items[0] as Record<string, unknown>).token).toBe('[REDACTED]');
      expect((items[0] as Record<string, unknown>).user).toBe('alice');
      expect((items[1] as Record<string, unknown>).password).toBe('[REDACTED]');
      expect((items[1] as Record<string, unknown>).user).toBe('bob');
      expect(items[2]).toBe('normal-string');

      const publicList = result?.publicList as unknown[];
      expect(publicList[0]).toBe('clear-item');
      expect((publicList[1] as Record<string, unknown>).apiKey).toBe('[REDACTED]');
    });

    it('enforces size limit and prevents unbounded metadata payloads', () => {
      // Create a payload exceeding 16 KB
      const oversizedPayload: Record<string, unknown> = {
        name: 'Normal name',
        hugeField: 'x'.repeat(25000)
      };

      const result = sanitizeAuditMetadata(oversizedPayload);
      expect(result).not.toBeNull();
      // Should either truncate long strings or cap total serialized bytes
      const serialized = JSON.stringify(result);
      expect(serialized.length).toBeLessThanOrEqual(16 * 1024);
    });

    it('returns null when given null or non-object', () => {
      expect(sanitizeAuditMetadata(null)).toBeNull();
      expect(sanitizeAuditMetadata(undefined)).toBeNull();
    });
  });

  describe('Transaction Atomicity & Rollback Consistency', () => {
    it('creates an audit log entry within an active transaction', async () => {
      let user = await prisma.user.findFirst();
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: 'audit-tx-user@example.com',
            password: 'hashed-password',
            name: 'Audit Tx User'
          }
        });
      }

      await prisma.$transaction(async (tx) => {
        const log = await logAuditAction(
          {
            userId: user.id,
            action: 'test:atomic_success',
            entityType: 'test_entity',
            entityId: 'test-entity-atomic',
            metadata: { detail: 'persisted' }
          },
          tx
        );
        expect(log.id).toBeDefined();
      });

      const found = await prisma.auditLog.findFirst({
        where: { action: 'test:atomic_success', entityId: 'test-entity-atomic' }
      });
      expect(found).not.toBeNull();
      expect(found?.entityId).toBe('test-entity-atomic');
    });

    it('rolls back audit log creation when the enclosing transaction fails', async () => {
      let user = await prisma.user.findFirst();
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: 'audit-rollback-user@example.com',
            password: 'hashed-password',
            name: 'Audit Rollback User'
          }
        });
      }

      try {
        await prisma.$transaction(async (tx) => {
          await logAuditAction(
            {
              userId: user.id,
              action: 'test:should_rollback',
              entityType: 'test_entity',
              entityId: 'test-entity-rollback',
              metadata: { attempt: 'will fail' }
            },
            tx
          );

          // Force an intentional error to trigger rollback
          throw new Error('Simulated transaction mutation failure');
        });
      } catch (err: unknown) {
        expect((err as Error).message).toBe('Simulated transaction mutation failure');
      }

      // Verify that the audit log was NOT persisted
      const found = await prisma.auditLog.findFirst({
        where: { action: 'test:should_rollback', entityId: 'test-entity-rollback' }
      });
      expect(found).toBeNull();
    });
  });

  describe('Security Event Logging', () => {
    it('records security violations with sanitized reason and context', async () => {
      let user = await prisma.user.findFirst();
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: 'audit-sec-user@example.com',
            password: 'hashed-password',
            name: 'Audit Sec User'
          }
        });
      }

      const secLog = await logSecurityEvent({
        userId: user.id,
        action: 'security:unauthorized_attempt',
        entityId: 'test-target-org',
        reason: 'Attempted to delete org with token secret-12345',
        metadata: {
          clientIp: '127.0.0.1',
          authHeader: 'Bearer secret-auth-token'
        }
      });

      expect(secLog.id).toBeDefined();
      expect(secLog.action).toBe('security:unauthorized_attempt');
      expect(secLog.metadata).not.toBeNull();

      const parsed = JSON.parse(secLog.metadata!);
      expect(parsed.authHeader).toBe('[REDACTED]');
      expect(parsed.clientIp).toBe('127.0.0.1');
    });
  });

  describe('Tenant Isolation', () => {
    it('strictly isolates audit logs between different organizations', async () => {
      let user = await prisma.user.findFirst();
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: 'audit-isolation-user@example.com',
            password: 'hashed-password',
            name: 'Isolation User'
          }
        });
      }

      // Create two test organizations
      const orgA = await prisma.organization.create({
        data: {
          name: 'Tenant Alpha',
          slug: `tenant-alpha-${Date.now()}`,
          createdById: user.id
        }
      });

      const orgB = await prisma.organization.create({
        data: {
          name: 'Tenant Beta',
          slug: `tenant-beta-${Date.now()}`,
          createdById: user.id
        }
      });

      // Log actions in both tenants
      await logAuditAction({
        userId: user.id,
        organizationId: orgA.id,
        action: 'org:action_alpha',
        entityType: 'test',
        entityId: 'test-alpha-1'
      });

      await logAuditAction({
        userId: user.id,
        organizationId: orgB.id,
        action: 'org:action_beta',
        entityType: 'test',
        entityId: 'test-beta-1'
      });

      // Query Org A: must only contain Org A logs
      const logsA = await listAuditLogs({ organizationId: orgA.id });
      expect(logsA.every((l) => l.organizationId === orgA.id)).toBe(true);
      expect(logsA.some((l) => l.action === 'org:action_alpha')).toBe(true);
      expect(logsA.some((l) => l.action === 'org:action_beta')).toBe(false);

      // Query Org B: must only contain Org B logs
      const logsB = await listAuditLogs({ organizationId: orgB.id });
      expect(logsB.every((l) => l.organizationId === orgB.id)).toBe(true);
      expect(logsB.some((l) => l.action === 'org:action_beta')).toBe(true);
      expect(logsB.some((l) => l.action === 'org:action_alpha')).toBe(false);
    });

    it('correctly applies pagination limits and offsets', async () => {
      let user = await prisma.user.findFirst();
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: 'audit-paging-user@example.com',
            password: 'hashed-password',
            name: 'Paging User'
          }
        });
      }

      for (let i = 0; i < 5; i++) {
        await logAuditAction({
          userId: user.id,
          action: `test:page_item_${i}`,
          entityType: 'test_entity',
          entityId: `test-page-${i}`
        });
      }

      const page1 = await listAuditLogs({
        userId: user.id,
        entityType: 'test_entity',
        page: 1,
        limit: 2
      });
      expect(page1.length).toBe(2);

      const page2 = await listAuditLogs({
        userId: user.id,
        entityType: 'test_entity',
        page: 2,
        limit: 2
      });
      expect(page2.length).toBe(2);

      // Verify that page 1 and page 2 have non-overlapping items
      expect(page1[0].id).not.toBe(page2[0].id);

      const total = await countAuditLogs({
        userId: user.id,
        entityType: 'test_entity'
      });
      expect(total).toBeGreaterThanOrEqual(5);
    });
  });
});
