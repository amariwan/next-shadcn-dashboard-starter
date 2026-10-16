'use client';

import { Icons } from '@/components/icons';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import type { OrgRole } from '@/lib/auth/organization';
import {
  organizationDetailOptions,
  organizationInvitationsOptions,
  organizationKeys,
  organizationMembersOptions
} from '../api/queries';
import {
  deleteOrganization,
  inviteMember,
  removeMember,
  renameOrganization,
  revokeInvitation,
  updateMemberRole
} from '../api/service';
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const ROLE_OPTIONS: OrgRole[] = ['member', 'admin', 'owner'];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant='outline'
      size='sm'
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          const el = document.createElement('textarea');
          el.value = text;
          document.body.appendChild(el);
          el.select();
          document.execCommand('copy');
          document.body.removeChild(el);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? <Icons.check className='mr-2 h-4 w-4' /> : <Icons.copy className='mr-2 h-4 w-4' />}
      {copied ? 'Copied' : 'Copy link'}
    </Button>
  );
}

function InviteDialog({ orgId, canManage }: { orgId: string; canManage: boolean }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<OrgRole>('member');
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => inviteMember(orgId, email.trim(), role),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: organizationKeys.invitations(orgId)
      });
      setInviteUrl(data.inviteUrl);
      setError('');
    },
    onError: (e: Error) => setError(e.message)
  });

  if (!canManage) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setInviteUrl(null);
          setError('');
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Icons.userPlus className='mr-2 h-4 w-4' /> Invite member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite to workspace</DialogTitle>
          <DialogDescription>
            Share the invite link with your teammate. It expires in 7 days.
          </DialogDescription>
        </DialogHeader>
        {inviteUrl ? (
          <div className='space-y-3'>
            <Label>Invite link for {email}</Label>
            <p className='bg-muted rounded-md p-3 text-xs break-all'>{inviteUrl}</p>
            <CopyButton text={inviteUrl} />
          </div>
        ) : (
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='invite-email'>Email</Label>
              <Input
                id='invite-email'
                type='email'
                placeholder='teammate@example.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className='space-y-2'>
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as OrgRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r} className='capitalize'>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error && <p className='text-destructive text-sm'>{error}</p>}
            <Button
              className='w-full'
              isLoading={mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              Send invite
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DangerZone({ orgId, orgName, role }: { orgId: string; orgName: string; role: OrgRole }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState(orgName);
  const canManage = role === 'owner' || role === 'admin';

  const rename = useMutation({
    mutationFn: (next: string) => renameOrganization(orgId, next),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
      router.refresh();
    }
  });

  const leave = useMutation({
    mutationFn: () => removeMember(orgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
      router.push('/dashboard/workspaces');
      router.refresh();
    }
  });

  const remove = useMutation({
    mutationFn: () => deleteOrganization(orgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
      router.push('/dashboard/workspaces');
      router.refresh();
    }
  });

  return (
    <div className='grid gap-4 lg:grid-cols-2'>
      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Rename workspace</CardTitle>
            <CardDescription>Visible to all members.</CardDescription>
          </CardHeader>
          <CardContent className='flex gap-2'>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
            <Button
              variant='outline'
              isLoading={rename.isPending}
              disabled={!name.trim() || name.trim() === orgName}
              onClick={() => rename.mutate(name.trim())}
            >
              Save
            </Button>
          </CardContent>
        </Card>
      )}
      <Card className='border-destructive/50'>
        <CardHeader>
          <CardTitle className='text-base'>Danger zone</CardTitle>
          <CardDescription>
            {role === 'owner'
              ? 'Owners can delete the workspace for everyone.'
              : 'You can leave this workspace at any time.'}
          </CardDescription>
        </CardHeader>
        <CardContent className='flex gap-2'>
          {role !== 'owner' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant='outline'>Leave workspace</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Leave {orgName}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You will lose access until someone invites you again.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => leave.mutate()}>Leave</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {role === 'owner' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant='destructive'>
                  <Icons.trash className='mr-2 h-4 w-4' /> Delete workspace
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {orgName}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes the workspace and all memberships for everyone. This cannot be
                    undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => remove.mutate()}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function WorkspaceDetail({ orgId }: { orgId: string }) {
  const queryClient = useQueryClient();
  const { data: detail } = useSuspenseQuery(organizationDetailOptions(orgId));
  const { data: membersData } = useSuspenseQuery(organizationMembersOptions(orgId));

  const org = detail.organization;
  const canManage = org.role === 'owner' || org.role === 'admin';
  // Invites endpoint requires admin — only managers fetch it.
  const { data: invitesData } = useQuery({
    ...organizationInvitationsOptions(orgId),
    enabled: canManage
  });
  const invalidateMembers = () =>
    queryClient.invalidateQueries({
      queryKey: organizationKeys.members(orgId)
    });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: OrgRole }) =>
      updateMemberRole(orgId, userId, role),
    onSuccess: invalidateMembers
  });
  const removeMutation = useMutation({
    mutationFn: (userId: string) => removeMember(orgId, userId),
    onSuccess: invalidateMembers
  });
  const revokeMutation = useMutation({
    mutationFn: (invitationId: string) => revokeInvitation(orgId, invitationId),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: organizationKeys.invitations(orgId)
      })
  });

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <div className='bg-primary text-primary-foreground flex size-11 items-center justify-center rounded-lg font-medium'>
            {org.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className='text-lg font-semibold'>{org.name}</h2>
            <p className='text-muted-foreground text-sm'>
              {org.memberCount} member{org.memberCount === 1 ? '' : 's'}
            </p>
          </div>
          <Badge variant='secondary' className='capitalize'>
            {org.role}
          </Badge>
        </div>
        <InviteDialog orgId={orgId} canManage={canManage} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='text-base'>Members</CardTitle>
        </CardHeader>
        <CardContent className='p-0'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {membersData.members.map((m) => (
                <TableRow key={m.userId}>
                  <TableCell>
                    <div className='font-medium'>{m.name ?? '—'}</div>
                    <div className='text-muted-foreground text-xs'>{m.email}</div>
                  </TableCell>
                  <TableCell>
                    {canManage ? (
                      <Select
                        value={m.role}
                        disabled={roleMutation.isPending}
                        onValueChange={(v) =>
                          roleMutation.mutate({ userId: m.userId, role: v as OrgRole })
                        }
                      >
                        <SelectTrigger className='w-32 capitalize'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLE_OPTIONS.map((r) => (
                            <SelectItem key={r} value={r} className='capitalize'>
                              {r}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant='outline' className='capitalize'>
                        {m.role}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className='text-right'>
                    {canManage && (
                      <Button
                        variant='ghost'
                        size='sm'
                        disabled={removeMutation.isPending}
                        onClick={() => removeMutation.mutate(m.userId)}
                      >
                        <Icons.trash className='h-4 w-4' />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {canManage && (invitesData?.invitations.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Pending invites</CardTitle>
          </CardHeader>
          <CardContent className='p-0'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitesData?.invitations.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>{inv.email}</TableCell>
                    <TableCell className='capitalize'>{inv.role}</TableCell>
                    <TableCell className='text-muted-foreground text-sm'>
                      {new Date(inv.expiresAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className='text-right'>
                      <Button
                        variant='ghost'
                        size='sm'
                        disabled={revokeMutation.isPending}
                        onClick={() => revokeMutation.mutate(inv.id)}
                      >
                        Revoke
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <DangerZone orgId={orgId} orgName={org.name} role={org.role} />
    </div>
  );
}

export function WorkspaceDetailSkeleton() {
  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-3'>
        <Skeleton className='size-11 rounded-lg' />
        <div className='space-y-2'>
          <Skeleton className='h-5 w-40' />
          <Skeleton className='h-3 w-24' />
        </div>
      </div>
      <Card>
        <CardContent className='space-y-3 p-6'>
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-10 w-full' />
        </CardContent>
      </Card>
    </div>
  );
}
