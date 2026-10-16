export const ACTION_OPTIONS = [
  { label: 'All Actions', value: '' },
  { label: 'Org Created', value: 'org:create' },
  { label: 'Org Renamed', value: 'org:rename' },
  { label: 'Org Deleted', value: 'org:delete' },
  { label: 'Member Joined', value: 'member:join' },
  { label: 'Member Removed', value: 'member:remove' },
  { label: 'Role Changed', value: 'member:role_change' },
  { label: 'Invite Created', value: 'invite:create' },
  { label: 'Invite Revoked', value: 'invite:revoke' },
  { label: 'Password Reset', value: 'auth:password_reset' },
  { label: 'Email Verified', value: 'auth:verify_email' }
];

export const ENTITY_OPTIONS = [
  { label: 'All Entities', value: '' },
  { label: 'Organization', value: 'organization' },
  { label: 'Membership', value: 'membership' },
  { label: 'Invitation', value: 'invitation' },
  { label: 'User', value: 'user' }
];
