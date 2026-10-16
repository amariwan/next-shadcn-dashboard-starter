import { describe, expect, it, beforeEach } from 'bun:test';
import { getOrgPrisma } from '@/lib/auth/organization';
import { getDashboardMetrics } from './metrics-service';
import { createOrganization } from '@/features/organizations/api/server-service';

describe('Dashboard Metrics Aggregation Service', () => {
  const prisma = getOrgPrisma();

  let user: { id: string; email: string };
  let org: { id: string; name: string };

  beforeEach(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: {
        email: { contains: 'test-metrics-' }
      }
    });

    user = await prisma.user.create({
      data: {
        email: `test-metrics-${Date.now()}@example.com`,
        password: 'password',
        name: 'Metrics Test User'
      }
    });

    org = await createOrganization({
      userId: user.id,
      name: `Metrics Org ${Date.now()}`
    });
  });

  it('aggregates live workspace metrics accurately', async () => {
    // Create an invite in the org
    await prisma.organizationInvitation.create({
      data: {
        organizationId: org.id,
        email: 'invited@example.com',
        role: 'member',
        token: `token-${Date.now()}`,
        invitedById: user.id,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60)
      }
    });

    const metrics = await getDashboardMetrics({
      userId: user.id,
      organizationId: org.id
    });

    expect(metrics.workspace.id).toBe(org.id);
    expect(metrics.workspace.totalMembers).toBeGreaterThanOrEqual(1);
    expect(metrics.workspace.pendingInvites).toBeGreaterThanOrEqual(1);
    expect(metrics.user.organizationCount).toBeGreaterThanOrEqual(1);
    expect(metrics.system.status).toBe('healthy');
    expect(metrics.system.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });

  it('handles personal view when no organization is active', async () => {
    const metrics = await getDashboardMetrics({
      userId: user.id,
      organizationId: null
    });

    expect(metrics.workspace.id).toBeNull();
    expect(metrics.user.organizationCount).toBeGreaterThanOrEqual(1);
    expect(metrics.system.status).toBe('healthy');
  });
});
