'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

export default async function VerifyEmailPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token;
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.alreadyVerified) {
          setStatus('success');
          toast.success('Email already verified');
        } else if (data.success) {
          setStatus('success');
          toast.success('Email verified successfully');
        } else {
          setStatus('error');
          toast.error(data.error ?? 'Verification failed');
        }
      })
      .catch(() => {
        setStatus('error');
        toast.error('Something went wrong');
      });
  }, [token]);

  if (status === 'loading') {
    return (
      <div className='flex h-full items-center justify-center'>
        <Card className='w-full max-w-md'>
          <CardHeader>
            <CardTitle>Verifying email...</CardTitle>
          </CardHeader>
          <CardContent className='flex justify-center items-center gap-2'>
            <Button variant='outline' size='sm' disabled>
              Verifying
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className='flex h-full items-center justify-center'>
        <Card className='w-full max-w-md'>
          <CardHeader>
            <CardTitle>Email verified</CardTitle>
            <CardDescription>Your email address has been verified successfully.</CardDescription>
          </CardHeader>
          <CardContent className='flex justify-end'>
            <Link href='/auth/sign-in' className='text-sm text-muted-foreground'>
              Sign in
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='flex h-full items-center justify-center'>
      <Card className='w-full max-w-md'>
        <CardHeader>
          <CardTitle>Invalid link</CardTitle>
          <CardDescription>This verification link is invalid or has expired.</CardDescription>
        </CardHeader>
        <CardContent className='flex justify-end'>
          <Link href='/auth/sign-in' className='text-sm text-muted-foreground'>
            Sign in
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
