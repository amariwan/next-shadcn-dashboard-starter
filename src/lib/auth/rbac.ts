export type OrgRole = 'owner' | 'admin' | 'member';

export type SystemRole = 'admin' | 'user';

export type OrgPermission =
  | 'organization.read'
  | 'organization.update'
  | 'organization.delete'
  | 'members.read'
  | 'members.manage'
  | 'roles.manage'
  | 'invitations.read'
  | 'invitations.manage'
  | 'audit.read';

export type SystemPermission = 'system.admin' | 'audit.read:all';

/**
 * Static permission definitions per organization role.
 * Default Deny: Roles not mapped explicitly have zero permissions.
 */
export const ROLE_PERMISSIONS: Record<OrgRole, readonly OrgPermission[]> = {
  owner: [
    'organization.read',
    'organization.update',
    'organization.delete',
    'members.read',
    'members.manage',
    'roles.manage',
    'invitations.read',
    'invitations.manage',
    'audit.read'
  ],
  admin: [
    'organization.read',
    'organization.update',
    'members.read',
    'members.manage',
    'roles.manage',
    'invitations.read',
    'invitations.manage',
    'audit.read'
  ],
  member: ['organization.read', 'members.read']
} as const;

export const SYSTEM_ROLE_PERMISSIONS: Record<SystemRole, readonly SystemPermission[]> = {
  admin: ['system.admin', 'audit.read:all'],
  user: []
} as const;

export type MembershipWithOrg = {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  organization: {
    id: string;
    name: string;
    slug: string;
    image: string | null;
    createdById: string;
    createdAt: Date;
    updatedAt: Date;
  };
};

/**
 * Returns all permissions granted to an organization role.
 * Enforces Default Deny for unknown, null, or undefined roles.
 */
export function getOrgPermissions(
  role: OrgRole | string | null | undefined
): readonly OrgPermission[] {
  if (!role || !(role in ROLE_PERMISSIONS)) {
    return [];
  }
  return ROLE_PERMISSIONS[role as OrgRole];
}

/**
 * Check if an organization role has a specific permission.
 * Default Deny for missing or unknown roles.
 */
export function hasOrgPermission(
  role: OrgRole | string | null | undefined,
  permission: OrgPermission
): boolean {
  if (!role || !(role in ROLE_PERMISSIONS)) {
    return false;
  }
  return ROLE_PERMISSIONS[role as OrgRole].includes(permission);
}

/**
 * Check if a system user role has a specific system permission.
 * Default Deny: only explicit system admin grants.
 */
export function hasSystemPermission(
  role: SystemRole | string | null | undefined,
  permission: SystemPermission
): boolean {
  if (!role || !(role in SYSTEM_ROLE_PERMISSIONS)) {
    return false;
  }
  return SYSTEM_ROLE_PERMISSIONS[role as SystemRole].includes(permission);
}

/**
 * Validate whether an actor role can assign a target role to a user.
 * Privilege Escalation Prevention:
 * - Admin cannot promote to owner or modify an owner.
 * - Only owners can assign the owner role or alter an owner's role.
 * - Members cannot modify any roles.
 */
export function canAssignRole(
  actorRole: OrgRole | string | null | undefined,
  targetCurrentRole: OrgRole | string | null | undefined,
  newRole: OrgRole | string
): boolean {
  if (actorRole !== 'owner' && actorRole !== 'admin') {
    return false;
  }

  // Only owners can modify existing owners
  if (targetCurrentRole === 'owner' && actorRole !== 'owner') {
    return false;
  }

  // Only owners can promote anyone to owner
  if (newRole === 'owner' && actorRole !== 'owner') {
    return false;
  }

  // Target role must be a valid OrgRole
  if (newRole !== 'owner' && newRole !== 'admin' && newRole !== 'member') {
    return false;
  }

  return true;
}

/**
 * Validate whether an actor role can remove a target member.
 * Privilege Escalation / Protection:
 * - Members can only remove themselves (leave workspace).
 * - Admins can remove members and other admins, but NEVER owners.
 * - Owners can remove any member or other owner (last owner protection is enforced in DB check).
 */
export function canRemoveMember(
  actorRole: OrgRole | string | null | undefined,
  targetRole: OrgRole | string | null | undefined,
  isSelf: boolean
): boolean {
  if (isSelf) {
    // Any member, admin, or owner can attempt to leave (last-owner check applies in DB)
    return true;
  }

  if (actorRole !== 'owner' && actorRole !== 'admin') {
    return false;
  }

  if (targetRole === 'owner' && actorRole !== 'owner') {
    return false;
  }

  return true;
}

/**
 * Validate whether an actor can invite someone with a specific role.
 * Privilege Escalation:
 * - Only owner can invite another owner.
 * - Admins can invite admin and member.
 */
export function canInviteRole(
  actorRole: OrgRole | string | null | undefined,
  roleToInvite: OrgRole | string
): boolean {
  if (actorRole !== 'owner' && actorRole !== 'admin') {
    return false;
  }

  if (roleToInvite === 'owner' && actorRole !== 'owner') {
    return false;
  }

  return roleToInvite === 'owner' || roleToInvite === 'admin' || roleToInvite === 'member';
}
