'use client';

import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { useSession } from 'next-auth/react';
import { useTransition } from 'react';
import * as z from 'zod';
import { updateProfile } from '@/features/profile/actions';
import { toast } from 'sonner';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('A valid email is required')
});

type Values = z.infer<typeof schema>;

export default function ProfileViewPage() {
  const { data: session } = useSession();
  const user = session?.user as {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
  } | null;
  const [isPending, startTransition] = useTransition();

  if (!user) {
    return (
      <PageContainer pageTitle='Profile'>
        <div className='flex h-full items-center justify-center'>
          <p className='text-muted-foreground'>Please sign in to view your profile.</p>
        </div>
      </PageContainer>
    );
  }

  const { FormTextField } = useFormFields<Values>();
  const form = useAppForm({
    defaultValues: { name: user.name ?? '', email: user.email ?? '' },
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      startTransition(async () => {
        const result = await updateProfile({
          userId: user.id,
          name: value.name.trim(),
          email: value.email.trim().toLowerCase()
        });
        if (result.success) {
          toast.success('Profile updated');
        } else {
          toast.error(result.error ?? 'Failed to update profile');
        }
      });
    }
  });

  return (
    <PageContainer pageTitle='Profile' pageDescription='Manage your account settings'>
      <div className='space-y-6'>
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your personal account details</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <form.AppForm>
              <form.Form>
                <div className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='name'>Name</Label>
                    <FormTextField
                      id='name'
                      name='name'
                      label='Name'
                      required
                      placeholder='Your name'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='email'>Email</Label>
                    <FormTextField
                      id='email'
                      name='email'
                      label='Email'
                      type='email'
                      required
                      placeholder='you@example.com'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Role</Label>
                    <Input value={user.role} readOnly className='bg-muted' />
                  </div>
                  <form.SubmitButton className='w-full' disabled={isPending}>
                    Save changes
                  </form.SubmitButton>
                </div>
              </form.Form>
            </form.AppForm>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
