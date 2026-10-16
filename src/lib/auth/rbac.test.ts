import { describe, expect, it } from 'bun:test';
import {
  getOrgPermissions,
  hasOrgPermission,
  hasSystemPermission,
  canAssignRole,
  canRemoveMember,
  canInviteRole,
  type OrgPermission
} from './rbac';

describe('Central RBAC Unit Tests', () => {
  describe('Default Deny & Unknown Roles', () => {
    it('returns empty permissions for unknown, null, or undefined role', () => {
      expect(getOrgPermissions(null)).toEqual([]);
      expect(getOrgPermissions(undefined)).toEqual([]);
      expect(getOrgPermissions('')).toEqual([]);
      expect(getOrgPermissions('unknown_role')).toEqual([]);
      expect(getOrgPermissions('guest')).toEqual([]);
    });

    it('denies all permissions for invalid roles', () => {
      expect(hasOrgPermission(null, 'organization.read')).toBe(false);
      expect(hasOrgPermission(undefined, 'organization.read')).toBe(false);
      expect(hasOrgPermission('superadmin', 'organization.read')).toBe(false);
      expect(hasOrgPermission('anonymous', 'members.read')).toBe(false);
    });

    it('denies system permissions for regular users or invalid system roles', () => {
      expect(hasSystemPermission('user', 'system.admin')).toBe(false);
      expect(hasSystemPermission('user', 'audit.read:all')).toBe(false);
      expect(hasSystemPermission(null, 'system.admin')).toBe(false);
      expect(hasSystemPermission(undefined, 'system.admin')).toBe(false);
      expect(hasSystemPermission('unknown', 'system.admin')).toBe(false);
    });
  });

  describe('Organization Role Permission Matrix', () => {
    const allOrgPermissions: OrgPermission[] = [
      'organization.read',
      'organization.update',
      'organization.delete',
      'members.read',
      'members.manage',
      'roles.manage',
      'invitations.read',
      'invitations.manage',
      'audit.read'
    ];

    it('Owner has all organization permissions', () => {
      for (const perm of allOrgPermissions) {
        expect(hasOrgPermission('owner', perm)).toBe(true);
      }
    });

    it('Admin has management permissions but cannot delete organization', () => {
      expect(hasOrgPermission('admin', 'organization.read')).toBe(true);
      expect(hasOrgPermission('admin', 'organization.update')).toBe(true);
      expect(hasOrgPermission('admin', 'organization.delete')).toBe(false); // Only owner!
      expect(hasOrgPermission('admin', 'members.read')).toBe(true);
      expect(hasOrgPermission('admin', 'members.manage')).toBe(true);
      expect(hasOrgPermission('admin', 'roles.manage')).toBe(true);
      expect(hasOrgPermission('admin', 'invitations.read')).toBe(true);
      expect(hasOrgPermission('admin', 'invitations.manage')).toBe(true);
      expect(hasOrgPermission('admin', 'audit.read')).toBe(true);
    });

    it('Member has read-only access to organization and members list', () => {
      expect(hasOrgPermission('member', 'organization.read')).toBe(true);
      expect(hasOrgPermission('member', 'members.read')).toBe(true);

      // Denied management permissions
      expect(hasOrgPermission('member', 'organization.update')).toBe(false);
      expect(hasOrgPermission('member', 'organization.delete')).toBe(false);
      expect(hasOrgPermission('member', 'members.manage')).toBe(false);
      expect(hasOrgPermission('member', 'roles.manage')).toBe(false);
      expect(hasOrgPermission('member', 'invitations.read')).toBe(false);
      expect(hasOrgPermission('member', 'invitations.manage')).toBe(false);
      expect(hasOrgPermission('member', 'audit.read')).toBe(false);
    });
  });

  describe('System Role Permissions', () => {
    it('System admin has overarching system permissions', () => {
      expect(hasSystemPermission('admin', 'system.admin')).toBe(true);
      expect(hasSystemPermission('admin', 'audit.read:all')).toBe(true);
    });
  });

  describe('Privilege Escalation Prevention: canAssignRole', () => {
    it('Owner can assign any role (owner, admin, member) to any member', () => {
      expect(canAssignRole('owner', 'member', 'admin')).toBe(true);
      expect(canAssignRole('owner', 'member', 'owner')).toBe(true);
      expect(canAssignRole('owner', 'admin', 'owner')).toBe(true);
      expect(canAssignRole('owner', 'owner', 'admin')).toBe(true);
      expect(canAssignRole('owner', 'owner', 'member')).toBe(true);
    });

    it('Admin cannot promote anyone to owner', () => {
      expect(canAssignRole('admin', 'member', 'owner')).toBe(false);
      expect(canAssignRole('admin', 'admin', 'owner')).toBe(false);
    });

    it('Admin cannot modify an existing owner', () => {
      expect(canAssignRole('admin', 'owner', 'member')).toBe(false);
      expect(canAssignRole('admin', 'owner', 'admin')).toBe(false);
      expect(canAssignRole('admin', 'owner', 'owner')).toBe(false);
    });

    it('Admin can change roles between member and admin', () => {
      expect(canAssignRole('admin', 'member', 'admin')).toBe(true);
      expect(canAssignRole('admin', 'admin', 'member')).toBe(true);
    });

    it('Member cannot change any role', () => {
      expect(canAssignRole('member', 'member', 'admin')).toBe(false);
      expect(canAssignRole('member', 'member', 'owner')).toBe(false);
      expect(canAssignRole('member', 'admin', 'member')).toBe(false);
    });

    it('Rejects invalid roles', () => {
      expect(canAssignRole('owner', 'member', 'superboss')).toBe(false);
    });
  });

  describe('Member Removal Protection: canRemoveMember', () => {
    it('Any user can leave themselves', () => {
      expect(canRemoveMember('member', 'member', true)).toBe(true);
      expect(canRemoveMember('admin', 'admin', true)).toBe(true);
      expect(canRemoveMember('owner', 'owner', true)).toBe(true);
    });

    it('Admin can remove members and other admins, but cannot remove owner', () => {
      expect(canRemoveMember('admin', 'member', false)).toBe(true);
      expect(canRemoveMember('admin', 'admin', false)).toBe(true);
      expect(canRemoveMember('admin', 'owner', false)).toBe(false); // Admin cannot remove owner!
    });

    it('Owner can remove members, admins, and other owners', () => {
      expect(canRemoveMember('owner', 'member', false)).toBe(true);
      expect(canRemoveMember('owner', 'admin', false)).toBe(true);
      expect(canRemoveMember('owner', 'owner', false)).toBe(true);
    });

    it('Member cannot remove another member or admin', () => {
      expect(canRemoveMember('member', 'member', false)).toBe(false);
      expect(canRemoveMember('member', 'admin', false)).toBe(false);
      expect(canRemoveMember('member', 'owner', false)).toBe(false);
    });
  });

  describe('Invitation Escalation Prevention: canInviteRole', () => {
    it('Owner can invite owner, admin, or member', () => {
      expect(canInviteRole('owner', 'owner')).toBe(true);
      expect(canInviteRole('owner', 'admin')).toBe(true);
      expect(canInviteRole('owner', 'member')).toBe(true);
    });

    it('Admin can invite admin or member, but cannot invite owner', () => {
      expect(canInviteRole('admin', 'member')).toBe(true);
      expect(canInviteRole('admin', 'admin')).toBe(true);
      expect(canInviteRole('admin', 'owner')).toBe(false); // Only owner can invite owner!
    });

    it('Member cannot invite anyone', () => {
      expect(canInviteRole('member', 'member')).toBe(false);
      expect(canInviteRole('member', 'admin')).toBe(false);
      expect(canInviteRole('member', 'owner')).toBe(false);
    });
  });
});
