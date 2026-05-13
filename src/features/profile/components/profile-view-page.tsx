'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PageContainer from '@/components/layout/page-container';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

export default function ProfileViewPage() {
  const { data: session } = useSession();
  const user = session?.user as any;

  if (!user) {
    return (
      <PageContainer pageTitle='Profile'>
        <div className='flex h-full items-center justify-center'>
          <p className='text-muted-foreground'>Please sign in to view your profile.</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer pageTitle='Profile' pageDescription='Manage your account settings'>
      <div className='space-y-6'>
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your personal account details</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label>Name</Label>
              <Input value={user.name || ''} readOnly />
            </div>
            <div className='space-y-2'>
              <Label>Email</Label>
              <Input value={user.email || ''} readOnly />
            </div>
            <div className='space-y-2'>
              <Label>Role</Label>
              <Input value={user.role || 'user'} readOnly />
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
