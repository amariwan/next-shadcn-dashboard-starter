'use client';

import { Icons } from '@/components/icons';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { organizationKeys, organizationsQueryOptions } from '../api/queries';
import { createOrganization } from '../api/service';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(2, 'Name at least 2 characters').max(60)
});

type CreateValues = z.infer<typeof createSchema>;

function CreateWorkspaceDialog({ onCreated }: { onCreated: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { FormTextField } = useFormFields<CreateValues>();

  const mutation = useMutation({
    mutationFn: (name: string) => createOrganization(name),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: organizationKeys.all });
      setOpen(false);
      onCreated(data.organization.id);
    }
  });

  const form = useAppForm({
    defaultValues: { name: '' } as CreateValues,
    validators: { onSubmit: createSchema },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value.name.trim());
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Icons.add className='mr-2 h-4 w-4' /> New workspace
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create workspace</DialogTitle>
          <DialogDescription>
            Workspaces group people and their permissions. You will be the owner.
          </DialogDescription>
        </DialogHeader>
        <form.AppForm>
          <form.Form>
            <div className='space-y-4'>
              <FormTextField name='name' label='Workspace name' required placeholder='Acme Inc' />
              {mutation.isError && (
                <p className='text-destructive text-sm'>
                  Could not create the workspace. Try again.
                </p>
              )}
              <form.SubmitButton className='w-full'>Create workspace</form.SubmitButton>
            </div>
          </form.Form>
        </form.AppForm>
      </DialogContent>
    </Dialog>
  );
}

export function WorkspaceList() {
  const router = useRouter();
  const { data } = useSuspenseQuery(organizationsQueryOptions());
  const organizations = data.organizations;

  if (organizations.length === 0) {
    return (
      <Card className='mx-auto max-w-lg text-center'>
        <CardHeader>
          <div className='bg-muted mx-auto mb-2 flex size-12 items-center justify-center rounded-lg'>
            <Icons.building className='size-6' />
          </div>
          <CardTitle>No workspaces yet</CardTitle>
          <CardDescription>
            Create your first workspace to collaborate with your team. Each workspace has its own
            members and roles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateWorkspaceDialog onCreated={(id) => router.push(`/dashboard/workspaces/${id}`)} />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex justify-end'>
        <CreateWorkspaceDialog onCreated={(id) => router.push(`/dashboard/workspaces/${id}`)} />
      </div>
      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
        {organizations.map((org) => (
          <Link key={org.id} href={`/dashboard/workspaces/${org.id}`}>
            <Card className='transition-colors hover:bg-accent/50'>
              <CardHeader className='flex flex-row items-center gap-3 space-y-0'>
                <div className='bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-medium'>
                  {org.name.slice(0, 2).toUpperCase()}
                </div>
                <div className='min-w-0 flex-1'>
                  <CardTitle className='truncate text-base'>{org.name}</CardTitle>
                  <CardDescription className='truncate'>
                    {org.memberCount} member{org.memberCount === 1 ? '' : 's'}
                  </CardDescription>
                </div>
                <Badge variant='secondary' className='shrink-0 capitalize'>
                  {org.role}
                </Badge>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function WorkspaceListSkeleton() {
  return (
    <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
      {[0, 1, 2].map((i) => (
        <Card key={i}>
          <CardHeader className='flex flex-row items-center gap-3 space-y-0'>
            <Skeleton className='size-10 rounded-lg' />
            <div className='flex-1 space-y-2'>
              <Skeleton className='h-4 w-32' />
              <Skeleton className='h-3 w-20' />
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
