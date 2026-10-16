import { describe, expect, it, beforeEach } from 'bun:test';
import { getOrgPrisma } from '@/lib/auth/organization';
import {
  createOrganization,
  renameOrganizationById,
  deleteOrganizationById,
  updateMemberRoleById,
  removeMemberById,
  createInvitation,
  listInvitations,
  revokeInvitationById
} from './server-service';

describe('Server Service RBAC & Security Enforcement', () => {
  const prisma = getOrgPrisma();

  // Test entities
  let userOwnerA: { id: string; email: string };
  let userAdminA: { id: string; email: string };
  let userMemberA: { id: string; email: string };
  let userOwnerB: { id: string; email: string };

  let orgA: { id: string; name: string };
  let orgB: { id: string; name: string };

  beforeEach(async () => {
    // Clean up test data
    await prisma.auditLog.deleteMany({
      where: {
        entityId: { startsWith: 'test-rbac-' }
      }
    });

    await prisma.organizationInvitation.deleteMany({
      where: {
        email: { contains: 'test-rbac' }
      }
    });

    await prisma.organizationMembership.deleteMany({
      where: {
        organization: { name: { startsWith: 'Test RBAC Org' } }
      }
    });

    await prisma.organization.deleteMany({
      where: {
        name: { startsWith: 'Test RBAC Org' }
      }
    });

    await prisma.user.deleteMany({
      where: {
        email: { contains: 'test-rbac-' }
      }
    });

    // Create test users
    userOwnerA = await prisma.user.create({
      data: {
        email: `test-rbac-owner-a-${Date.now()}@example.com`,
        password: 'hashed-password',
        name: 'Owner User A',
        role: 'user'
      }
    });

    userAdminA = await prisma.user.create({
      data: {
        email: `test-rbac-admin-a-${Date.now()}@example.com`,
        password: 'hashed-password',
        name: 'Admin User A',
        role: 'user'
      }
    });

    userMemberA = await prisma.user.create({
      data: {
        email: `test-rbac-member-a-${Date.now()}@example.com`,
        password: 'hashed-password',
        name: 'Member User A',
        role: 'user'
      }
    });

    userOwnerB = await prisma.user.create({
      data: {
        email: `test-rbac-owner-b-${Date.now()}@example.com`,
        password: 'hashed-password',
        name: 'Owner User B',
        role: 'user'
      }
    });

    // Create test organizations
    orgA = await createOrganization({
      userId: userOwnerA.id,
      name: `Test RBAC Org A ${Date.now()}`
    });

    orgB = await createOrganization({
      userId: userOwnerB.id,
      name: `Test RBAC Org B ${Date.now()}`
    });

    // Add admin and member to Org A
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

  describe('Permission Enforcement across Roles', () => {
    it('Owner has full management permissions in Org A', async () => {
      // Owner can rename
      const renamed = await renameOrganizationById({
        id: orgA.id,
        name: 'Renamed by Owner',
        actorId: userOwnerA.id
      });
      expect(renamed.name).toBe('Renamed by Owner');

      // Owner can invite another member or admin
      const invite = await createInvitation({
        organizationId: orgA.id,
        email: 'test-rbac-invitee@example.com',
        role: 'member',
        invitedById: userOwnerA.id
      });
      expect(invite.id).toBeDefined();

      // Owner can revoke invitation
      const revoked = await revokeInvitationById({
        organizationId: orgA.id,
        invitationId: invite.id,
        actorId: userOwnerA.id
      });
      expect(revoked.id).toBe(invite.id);
    });

    it('Admin can rename and invite, but cannot delete the organization', async () => {
      // Admin can rename
      const renamed = await renameOrganizationById({
        id: orgA.id,
        name: 'Renamed by Admin',
        actorId: userAdminA.id
      });
      expect(renamed.name).toBe('Renamed by Admin');

      // Admin CANNOT delete organization
      expect(
        deleteOrganizationById({
          id: orgA.id,
          actorId: userAdminA.id
        })
      ).rejects.toThrow('Forbidden');
    });

    it('Member is denied all management actions (Default Deny)', async () => {
      // Member cannot rename
      expect(
        renameOrganizationById({
          id: orgA.id,
          name: 'Renamed by Member',
          actorId: userMemberA.id
        })
      ).rejects.toThrow('Forbidden');

      // Member cannot delete
      expect(
        deleteOrganizationById({
          id: orgA.id,
          actorId: userMemberA.id
        })
      ).rejects.toThrow('Forbidden');

      // Member cannot invite
      expect(
        createInvitation({
          organizationId: orgA.id,
          email: 'test-rbac-new@example.com',
          role: 'member',
          invitedById: userMemberA.id
        })
      ).rejects.toThrow('Forbidden');

      // Member cannot list invitations
      expect(listInvitations(orgA.id, userMemberA.id)).rejects.toThrow('Forbidden');

      // Member cannot update roles
      expect(
        updateMemberRoleById({
          organizationId: orgA.id,
          targetUserId: userAdminA.id,
          role: 'member',
          actorId: userMemberA.id
        })
      ).rejects.toThrow('Forbidden');

      // Member cannot remove other members
      expect(
        removeMemberById({
          organizationId: orgA.id,
          targetUserId: userAdminA.id,
          actorId: userMemberA.id
        })
      ).rejects.toThrow('Forbidden');
    });
  });

  describe('Privilege Escalation Prevention', () => {
    it('Admin cannot promote a member to owner', async () => {
      expect(
        updateMemberRoleById({
          organizationId: orgA.id,
          targetUserId: userMemberA.id,
          role: 'owner',
          actorId: userAdminA.id
        })
      ).rejects.toThrow('Forbidden');
    });

    it('Admin cannot modify an existing owner', async () => {
      expect(
        updateMemberRoleById({
          organizationId: orgA.id,
          targetUserId: userOwnerA.id,
          role: 'admin',
          actorId: userAdminA.id
        })
      ).rejects.toThrow('Forbidden');
    });

    it('Admin cannot remove an owner', async () => {
      expect(
        removeMemberById({
          organizationId: orgA.id,
          targetUserId: userOwnerA.id,
          actorId: userAdminA.id
        })
      ).rejects.toThrow('Forbidden');
    });

    it('Admin cannot invite someone with the owner role', async () => {
      expect(
        createInvitation({
          organizationId: orgA.id,
          email: 'test-rbac-inv-owner@example.com',
          role: 'owner',
          invitedById: userAdminA.id
        })
      ).rejects.toThrow('Forbidden');
    });
  });

  describe('Last Owner Protection', () => {
    it('sole owner cannot be demoted to admin or member', async () => {
      // Attempting to demote sole owner
      expect(
        updateMemberRoleById({
          organizationId: orgA.id,
          targetUserId: userOwnerA.id,
          role: 'admin',
          actorId: userOwnerA.id
        })
      ).rejects.toThrow('Organization must keep at least one owner');

      expect(
        updateMemberRoleById({
          organizationId: orgA.id,
          targetUserId: userOwnerA.id,
          role: 'member',
          actorId: userOwnerA.id
        })
      ).rejects.toThrow('Organization must keep at least one owner');
    });

    it('sole owner cannot be removed or leave without keeping an owner', async () => {
      expect(
        removeMemberById({
          organizationId: orgA.id,
          targetUserId: userOwnerA.id,
          actorId: userOwnerA.id
        })
      ).rejects.toThrow('Organization must keep at least one owner');
    });

    it('demoting an owner succeeds when multiple owners exist', async () => {
      // Promote userAdminA to owner by userOwnerA
      await updateMemberRoleById({
        organizationId: orgA.id,
        targetUserId: userAdminA.id,
        role: 'owner',
        actorId: userOwnerA.id
      });

      // Now there are 2 owners. Demoting userOwnerA must succeed!
      const demoted = await updateMemberRoleById({
        organizationId: orgA.id,
        targetUserId: userOwnerA.id,
        role: 'admin',
        actorId: userAdminA.id // userAdminA is now an owner
      });
      expect(demoted.role).toBe('admin');

      // Now userAdminA is the ONLY owner. Demoting them must fail!
      expect(
        updateMemberRoleById({
          organizationId: orgA.id,
          targetUserId: userAdminA.id,
          role: 'member',
          actorId: userAdminA.id
        })
      ).rejects.toThrow('Organization must keep at least one owner');
    });
  });

  describe('Cross-Tenant Isolation', () => {
    it('user from Org B has no access to Org A resources', async () => {
      expect(orgB.id).not.toBe(orgA.id);

      // UserOwnerB tries to rename Org A
      expect(
        renameOrganizationById({
          id: orgA.id,
          name: 'Hacked by Tenant B',
          actorId: userOwnerB.id
        })
      ).rejects.toThrow('Forbidden');

      // UserOwnerB tries to delete Org A
      expect(
        deleteOrganizationById({
          id: orgA.id,
          actorId: userOwnerB.id
        })
      ).rejects.toThrow('Forbidden');

      // UserOwnerB tries to modify members in Org A
      expect(
        updateMemberRoleById({
          organizationId: orgA.id,
          targetUserId: userMemberA.id,
          role: 'admin',
          actorId: userOwnerB.id
        })
      ).rejects.toThrow('Forbidden');

      // UserOwnerB tries to remove member in Org A
      expect(
        removeMemberById({
          organizationId: orgA.id,
          targetUserId: userMemberA.id,
          actorId: userOwnerB.id
        })
      ).rejects.toThrow('Forbidden');

      // UserOwnerB tries to list invitations in Org A
      expect(listInvitations(orgA.id, userOwnerB.id)).rejects.toThrow('Forbidden');

      // UserOwnerB tries to invite into Org A
      expect(
        createInvitation({
          organizationId: orgA.id,
          email: 'infiltrator@example.com',
          role: 'member',
          invitedById: userOwnerB.id
        })
      ).rejects.toThrow('Forbidden');
    });
  });

  describe('Dynamic Role Change during Active Session', () => {
    it('immediately denies elevated actions when user is demoted in database', async () => {
      // 1. userAdminA is currently admin in Org A. Rename works.
      const firstRename = await renameOrganizationById({
        id: orgA.id,
        name: 'Valid Admin Rename',
        actorId: userAdminA.id
      });
      expect(firstRename.name).toBe('Valid Admin Rename');

      // 2. Simulate demoting userAdminA in the database to member (e.g. from another session or admin action)
      await prisma.organizationMembership.update({
        where: {
          userId_organizationId: {
            userId: userAdminA.id,
            organizationId: orgA.id
          }
        },
        data: { role: 'member' }
      });

      // 3. userAdminA immediately attempts another admin action without re-logging in.
      // Must be immediately rejected with Forbidden!
      expect(
        renameOrganizationById({
          id: orgA.id,
          name: 'Unauthorized Demoted Rename',
          actorId: userAdminA.id
        })
      ).rejects.toThrow('Forbidden');

      // 4. Inviting another user must also be rejected
      expect(
        createInvitation({
          organizationId: orgA.id,
          email: 'demoted-invite@example.com',
          role: 'member',
          invitedById: userAdminA.id
        })
      ).rejects.toThrow('Forbidden');
    });
  });
});
