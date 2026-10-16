import { z } from 'zod';
import type { OrgRole } from '@/lib/auth/organization';

export const createOrganizationSchema = z.object({
  name: z.string().min(2, 'Name at least 2 characters').max(60)
});

export const renameOrganizationSchema = z.object({
  name: z.string().min(2, 'Name at least 2 characters').max(60)
});

export const updateMemberRoleSchema = z.object({
  userId: z.string().uuid().or(z.string().cuid()),
  role: z.enum(['owner', 'admin', 'member'])
});

export const inviteMemberSchema = z.object({
  email: z.string().email('A valid email is required'),
  role: z.enum(['owner', 'admin', 'member']).default('member')
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type RenameOrganizationInput = z.infer<typeof renameOrganizationSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

export const orgRoleSchema = z.enum(['owner', 'admin', 'member']);
export type OrgRoleInput = z.infer<typeof orgRoleSchema>;
