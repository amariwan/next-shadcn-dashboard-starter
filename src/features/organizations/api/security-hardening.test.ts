import { describe, expect, it, beforeEach } from 'bun:test';
import { getOrgPrisma } from '@/lib/auth/organization';
import {
  createOrganization,
  renameOrganizationById,
  deleteOrganizationById,
  updateMemberRoleById,
  removeMemberById,
  createInvitation,
  listInvitations
} from './server-service';

describe('P2 - Security Hardening & Concurrency Tests', () => {
  const prisma = getOrgPrisma();

  let userOwnerA: { id: string; email: string };
  let userAdminA: { id: string; email: string };
  let userMemberA: { id: string; email: string };
  let userOwnerB: { id: string; email: string };
  let userOrphan: { id: string; email: string };

  let orgA: { id: string; name: string };
  let orgB: { id: string; name: string };

  beforeEach(async () => {
    // Clean up test data
    await prisma.auditLog.deleteMany({
      where: {
        entityId: { startsWith: 'sec-test-' }
      }
    });

    await prisma.organizationInvitation.deleteMany({
      where: {
        email: { contains: 'sec-test' }
      }
    });

    await prisma.organizationMembership.deleteMany({
      where: {
        organization: { name: { startsWith: 'Security Hardening Org' } }
      }
    });

    await prisma.organization.deleteMany({
      where: {
        name: { startsWith: 'Security Hardening Org' }
      }
    });

    await prisma.user.deleteMany({
      where: {
        email: { contains: 'sec-test-' }
      }
    });

    // Create users
    userOwnerA = await prisma.user.create({
      data: {
        email: `sec-test-owner-a-${Date.now()}@example.com`,
        password: 'password',
        name: 'Owner A'
      }
    });

    userAdminA = await prisma.user.create({
      data: {
        email: `sec-test-admin-a-${Date.now()}@example.com`,
        password: 'password',
        name: 'Admin A'
      }
    });

    userMemberA = await prisma.user.create({
      data: {
        email: `sec-test-member-a-${Date.now()}@example.com`,
        password: 'password',
        name: 'Member A'
      }
    });

    userOwnerB = await prisma.user.create({
      data: {
        email: `sec-test-owner-b-${Date.now()}@example.com`,
        password: 'password',
        name: 'Owner B'
      }
    });

    // Authenticated user with NO organization memberships
    userOrphan = await prisma.user.create({
      data: {
        email: `sec-test-orphan-${Date.now()}@example.com`,
        password: 'password',
        name: 'Orphan User'
      }
    });

    // Create Org A and Org B
    orgA = await createOrganization({
      userId: userOwnerA.id,
      name: `Security Hardening Org A ${Date.now()}`
    });

    orgB = await createOrganization({
      userId: userOwnerB.id,
      name: `Security Hardening Org B ${Date.now()}`
    });

    // Add Admin A and Member A to Org A
    await prisma.organizationMembership.create({
      data: {
        organizationId: orgA.id,
        userId: userAdminA.id,
        role: 'admin'
      }
    });

    await prisma.organizationMembership.create({
      data: {
        organizationId: orgA.id,
        userId: userMemberA.id,
        role: 'member'
      }
    });
  });

  describe('1. Authenticated User Without Organization Membership', () => {
    it('rejects all organization management calls from a user with no membership', async () => {
      // Try to rename Org A
      await expect(
        renameOrganizationById({
          id: orgA.id,
          name: 'Renamed by Orphan',
          actorId: userOrphan.id
        })
      ).rejects.toThrow('Forbidden');

      // Try to delete Org A
      await expect(
        deleteOrganizationById({
          id: orgA.id,
          actorId: userOrphan.id
        })
      ).rejects.toThrow('Forbidden');

      // Try to update role
      await expect(
        updateMemberRoleById({
          organizationId: orgA.id,
          targetUserId: userMemberA.id,
          role: 'admin',
          actorId: userOrphan.id
        })
      ).rejects.toThrow('Forbidden');

      // Try to remove member
      await expect(
        removeMemberById({
          organizationId: orgA.id,
          targetUserId: userMemberA.id,
          actorId: userOrphan.id
        })
      ).rejects.toThrow('Forbidden');

      // Try to invite
      await expect(
        createInvitation({
          organizationId: orgA.id,
          email: 'sec-test-orphan-invitee@example.com',
          role: 'member',
          invitedById: userOrphan.id
        })
      ).rejects.toThrow('Forbidden');

      // Try to list invitations
      await expect(listInvitations(orgA.id, userOrphan.id)).rejects.toThrow('Forbidden');
    });
  });

  describe('2. Member Attempts Admin & Owner Actions', () => {
    it('strictly forbids a member from renaming, inviting, changing roles or deleting', async () => {
      // Member tries to rename
      await expect(
        renameOrganizationById({
          id: orgA.id,
          name: 'Member Rename Hack',
          actorId: userMemberA.id
        })
      ).rejects.toThrow('Forbidden');

      // Member tries to invite
      await expect(
        createInvitation({
          organizationId: orgA.id,
          email: 'member-invited@example.com',
          role: 'member',
          invitedById: userMemberA.id
        })
      ).rejects.toThrow('Forbidden');

      // Member tries to promote themselves to admin or owner
      await expect(
        updateMemberRoleById({
          organizationId: orgA.id,
          targetUserId: userMemberA.id,
          role: 'owner',
          actorId: userMemberA.id
        })
      ).rejects.toThrow('Forbidden');

      // Member tries to delete
      await expect(
        deleteOrganizationById({
          id: orgA.id,
          actorId: userMemberA.id
        })
      ).rejects.toThrow('Forbidden');
    });
  });

  describe('3. Admin Attempts Owner-Exclusive Actions (Privilege Escalation)', () => {
    it('strictly forbids an admin from deleting, promoting to owner, modifying owner, or inviting owner', async () => {
      // Admin tries to delete org
      await expect(
        deleteOrganizationById({
          id: orgA.id,
          actorId: userAdminA.id
        })
      ).rejects.toThrow('Forbidden');

      // Admin tries to promote Member to Owner
      await expect(
        updateMemberRoleById({
          organizationId: orgA.id,
          targetUserId: userMemberA.id,
          role: 'owner',
          actorId: userAdminA.id
        })
      ).rejects.toThrow('Forbidden');

      // Admin tries to demote existing Owner
      await expect(
        updateMemberRoleById({
          organizationId: orgA.id,
          targetUserId: userOwnerA.id,
          role: 'admin',
          actorId: userAdminA.id
        })
      ).rejects.toThrow('Forbidden');

      // Admin tries to remove existing Owner
      await expect(
        removeMemberById({
          organizationId: orgA.id,
          targetUserId: userOwnerA.id,
          actorId: userAdminA.id
        })
      ).rejects.toThrow('Forbidden');

      // Admin tries to invite someone as Owner
      await expect(
        createInvitation({
          organizationId: orgA.id,
          email: 'admin-invites-owner@example.com',
          role: 'owner',
          invitedById: userAdminA.id
        })
      ).rejects.toThrow('Forbidden');
    });
  });

  describe('4. Dynamic Role Change During Active Session', () => {
    it('immediately enforces updated permissions when role is demoted in database', async () => {
      // Verify admin can rename initially
      const initialRename = await renameOrganizationById({
        id: orgA.id,
        name: 'Valid Name by Admin',
        actorId: userAdminA.id
      });
      expect(initialRename.name).toBe('Valid Name by Admin');

      // Demote userAdminA to member directly in database
      await prisma.organizationMembership.update({
        where: {
          userId_organizationId: {
            userId: userAdminA.id,
            organizationId: orgA.id
          }
        },
        data: { role: 'member' }
      });

      // Subsequent admin calls by userAdminA must immediately fail
      await expect(
        renameOrganizationById({
          id: orgA.id,
          name: 'Name by Demoted Admin',
          actorId: userAdminA.id
        })
      ).rejects.toThrow('Forbidden');

      await expect(
        createInvitation({
          organizationId: orgA.id,
          email: 'should-fail@example.com',
          role: 'member',
          invitedById: userAdminA.id
        })
      ).rejects.toThrow('Forbidden');
    });
  });

  describe('5. Concurrency: Parallel Last-Owner Mutex & Protection', () => {
    it('guarantees that an organization never becomes headless under concurrent owner removals', async () => {
      // Add a second owner (userAdminA promoted to owner)
      await updateMemberRoleById({
        organizationId: orgA.id,
        targetUserId: userAdminA.id,
        role: 'owner',
        actorId: userOwnerA.id
      });

      const initialOwners = await prisma.organizationMembership.count({
        where: { organizationId: orgA.id, role: 'owner' }
      });
      expect(initialOwners).toBe(2);

      // Concurrent removal: userOwnerA removes userAdminA, and userAdminA removes userOwnerA
      const results = await Promise.allSettled([
        removeMemberById({
          organizationId: orgA.id,
          targetUserId: userAdminA.id,
          actorId: userOwnerA.id
        }),
        removeMemberById({
          organizationId: orgA.id,
          targetUserId: userOwnerA.id,
          actorId: userAdminA.id
        })
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      // Exactly one succeeds, and the other is rejected
      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(1);

      const errMessage = (rejected[0] as PromiseRejectedResult).reason.message;
      expect([
        'Organization must keep at least one owner',
        'Forbidden'
      ]).toContain(errMessage);

      // Check final state in database: exactly 1 owner MUST remain!
      const finalOwners = await prisma.organizationMembership.count({
        where: { organizationId: orgA.id, role: 'owner' }
      });
      expect(finalOwners).toBe(1);
    });

    it('guarantees that an organization never becomes headless under concurrent owner demotions', async () => {
      // Promote userAdminA to owner
      await updateMemberRoleById({
        organizationId: orgA.id,
        targetUserId: userAdminA.id,
        role: 'owner',
        actorId: userOwnerA.id
      });

      // Both owners try to demote each other simultaneously
      const results = await Promise.allSettled([
        updateMemberRoleById({
          organizationId: orgA.id,
          targetUserId: userAdminA.id,
          role: 'admin',
          actorId: userOwnerA.id
        }),
        updateMemberRoleById({
          organizationId: orgA.id,
          targetUserId: userOwnerA.id,
          role: 'admin',
          actorId: userAdminA.id
        })
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(1);

      const errMessage = (rejected[0] as PromiseRejectedResult).reason.message;
      expect([
        'Organization must keep at least one owner',
        'Forbidden: Cannot perform this role change',
        'Forbidden'
      ]).toContain(errMessage);

      // Exactly 1 owner must remain
      const finalOwners = await prisma.organizationMembership.count({
        where: { organizationId: orgA.id, role: 'owner' }
      });
      expect(finalOwners).toBe(1);
    });
  });

  describe('6. Cross-Tenant IDOR Protection', () => {
    it('strictly isolates tenant operations between Org A and Org B', async () => {
      expect(orgB.id).not.toBe(orgA.id);

      // userOwnerB tries to rename Org A
      await expect(
        renameOrganizationById({
          id: orgA.id,
          name: 'Cross Tenant Rename',
          actorId: userOwnerB.id
        })
      ).rejects.toThrow('Forbidden');

      // userOwnerB tries to delete Org A
      await expect(
        deleteOrganizationById({
          id: orgA.id,
          actorId: userOwnerB.id
        })
      ).rejects.toThrow('Forbidden');

      // userOwnerB tries to invite into Org A
      await expect(
        createInvitation({
          organizationId: orgA.id,
          email: 'cross-tenant-invite@example.com',
          role: 'member',
          invitedById: userOwnerB.id
        })
      ).rejects.toThrow('Forbidden');

      // userOwnerB tries to modify members in Org A
      await expect(
        updateMemberRoleById({
          organizationId: orgA.id,
          targetUserId: userMemberA.id,
          role: 'owner',
          actorId: userOwnerB.id
        })
      ).rejects.toThrow('Forbidden');
    });
  });

  describe('7. Security Audit Event Logging on Violations', () => {
    it('records security event in audit log when unauthorized action is attempted', async () => {
      try {
        await renameOrganizationById({
          id: orgA.id,
          name: 'Security Probe Name',
          actorId: userMemberA.id
        });
      } catch {
        // Expected failure
      }

      const secEvents = await prisma.auditLog.findMany({
        where: {
          userId: userMemberA.id,
          action: 'security:unauthorized_attempt'
        }
      });

      expect(secEvents.length).toBeGreaterThanOrEqual(1);
      expect(secEvents[0].action).toBe('security:unauthorized_attempt');
    });

    it('records privilege escalation security events in audit log', async () => {
      try {
        await updateMemberRoleById({
          organizationId: orgA.id,
          targetUserId: userMemberA.id,
          role: 'owner',
          actorId: userAdminA.id
        });
      } catch {
        // Expected failure
      }

      const escalationEvents = await prisma.auditLog.findMany({
        where: {
          userId: userAdminA.id,
          action: 'security:privilege_escalation'
        }
      });

      expect(escalationEvents.length).toBeGreaterThanOrEqual(1);
    });
  });
});
