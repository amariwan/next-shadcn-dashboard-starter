'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import Link from 'next/link';
import { toast } from 'sonner';

interface VerifyEmailContentProps {
  token?: string;
}

export default function VerifyEmailContent({ token }: VerifyEmailContentProps) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(() =>
    token ? 'loading' : 'error'
  );

  useEffect(() => {
    if (!token) return;

    let ignore = false;
    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        if (ignore) return;
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
        if (ignore) return;
        setStatus('error');
        toast.error('Something went wrong');
      });

    return () => {
      ignore = true;
    };
  }, [token]);

  if (status === 'loading') {
    return (
      <div className='flex h-full items-center justify-center p-4'>
        <Card className='w-full max-w-md'>
          <CardHeader>
            <CardTitle>Verifying email...</CardTitle>
            <CardDescription>Please wait while we verify your email address.</CardDescription>
          </CardHeader>
          <CardContent className='flex items-center justify-center gap-2'>
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
      <div className='flex h-full items-center justify-center p-4'>
        <Card className='w-full max-w-md'>
          <CardHeader>
            <CardTitle>Email verified</CardTitle>
            <CardDescription>
              Your email address has been verified successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className='flex justify-end'>
            <Button asChild>
              <Link href='/auth/sign-in'>Sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='flex h-full items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader>
          <CardTitle>Invalid link</CardTitle>
          <CardDescription>
            This verification link is invalid or has expired.
          </CardDescription>
        </CardHeader>
        <CardContent className='flex justify-end'>
          <Button asChild variant='outline'>
            <Link href='/auth/sign-in'>Back to Sign in</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
