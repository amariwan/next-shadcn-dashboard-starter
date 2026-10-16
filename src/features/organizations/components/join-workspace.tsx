'use client';

import { Icons } from '@/components/icons';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { invitePreviewOptions, organizationKeys } from '../api/queries';
import { acceptInvitation } from '../api/service';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function JoinWorkspace({ token }: { token: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, error } = useSuspenseQuery(invitePreviewOptions(token));

  const accept = useMutation({
    mutationFn: () => acceptInvitation(token),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
      router.push(`/dashboard/workspaces/${res.organizationId}`);
      router.refresh();
    }
  });

  if (error) {
    return (
      <Card className='mx-auto max-w-lg text-center'>
        <CardHeader>
          <CardTitle>Invite not found</CardTitle>
          <CardDescription>
            This invite is invalid, expired, or was already used. Ask for a new one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant='outline'>
            <Link href='/dashboard/workspaces'>Back to workspaces</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (data.alreadyMember) {
    return (
      <Card className='mx-auto max-w-lg text-center'>
        <CardHeader>
          <div className='bg-muted mx-auto mb-2 flex size-12 items-center justify-center rounded-lg'>
            <Icons.check className='size-6' />
          </div>
          <CardTitle>You are already a member</CardTitle>
          <CardDescription>
            You already belong to {data.invitation.organizationName}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href={`/dashboard/workspaces/${data.invitation.organizationId}`}>
              Open workspace
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data.emailMatches) {
    return (
      <Card className='mx-auto max-w-lg text-center'>
        <CardHeader>
          <CardTitle>Wrong account</CardTitle>
          <CardDescription>
            This invite was sent to {data.invitation.email}. Sign in with that address to accept it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant='outline'>
            <Link href='/auth/sign-in'>Switch account</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='mx-auto max-w-lg text-center'>
      <CardHeader>
        <div className='bg-primary text-primary-foreground mx-auto mb-2 flex size-12 items-center justify-center rounded-lg font-medium'>
          {data.invitation.organizationName.slice(0, 2).toUpperCase()}
        </div>
        <CardTitle>Join {data.invitation.organizationName}</CardTitle>
        <CardDescription>
          You were invited as <span className='font-medium'>{data.invitation.role}</span>.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-3'>
        {accept.isError && (
          <Alert variant='destructive'>
            <AlertTitle>Could not join</AlertTitle>
            <AlertDescription>Please try again or ask for a new invite.</AlertDescription>
          </Alert>
        )}
        <Button className='w-full' isLoading={accept.isPending} onClick={() => accept.mutate()}>
          Accept invite
        </Button>
      </CardContent>
    </Card>
  );
}

export function JoinWorkspaceSkeleton() {
  return (
    <Card className='mx-auto max-w-lg'>
      <CardHeader className='items-center space-y-2'>
        <Skeleton className='size-12 rounded-lg' />
        <Skeleton className='h-5 w-48' />
        <Skeleton className='h-4 w-64' />
      </CardHeader>
      <CardContent>
        <Skeleton className='h-10 w-full' />
      </CardContent>
    </Card>
  );
}
