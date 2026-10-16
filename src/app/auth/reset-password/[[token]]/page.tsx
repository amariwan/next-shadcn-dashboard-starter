'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import * as z from 'zod';

const schema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

type Values = z.infer<typeof schema>;

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token;
  const router = useRouter();
  const [step, setStep] = useState<'request' | 'reset' | 'success'>(token ? 'reset' : 'request');

  if (step === 'success') {
    return (
      <div className='flex h-full items-center justify-center'>
        <Card className='w-full max-w-md'>
          <CardHeader>
            <CardTitle>Password reset</CardTitle>
            <CardDescription>Your password has been changed successfully.</CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col items-center justify-center gap-4'>
            <Button asChild onClick={() => router.push('/auth/sign-in')}>
              <Link href='/auth/sign-in'>Sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'request') {
    return (
      <div className='flex h-full items-center justify-center'>
        <Card className='w-full max-w-md'>
          <CardHeader>
            <CardTitle>Forgot password</CardTitle>
            <CardDescription>Enter your email and we'll send you a reset link.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='email'>Email</Label>
                <Input id='email' type='email' placeholder='you@example.com' />
              </div>
              <Button type='submit' className='w-full'>
                Send reset link
              </Button>
            </form>
          </CardContent>
          <CardContent className='flex justify-end'>
            <Link href='/auth/sign-in' className='text-sm text-muted-foreground'>
              Remember your password? Sign in
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // reset step
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPending, setIsPending] = useState(false);

  if (!token) {
    return (
      <div className='flex h-full items-center justify-center'>
        <Card className='w-full max-w-md'>
          <CardHeader>
            <CardTitle>Invalid reset link</CardTitle>
            <CardDescription>This reset link is missing a token.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href='/auth/sign-in'>Go to sign in</Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setIsPending(true);
    try {
      const res = await fetch('/api/auth/reset-password?action=reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? 'Failed to reset password');
        return;
      }
      setStep('success');
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className='flex h-full items-center justify-center'>
      <Card className='w-full max-w-md'>
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
          <CardDescription>Enter your new password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='password'>New password</Label>
              <Input
                id='password'
                type='password'
                placeholder='••••••••'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='confirmPassword'>Confirm password</Label>
              <Input
                id='confirmPassword'
                type='password'
                placeholder='••••••••'
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button type='submit' className='w-full' disabled={isPending}>
              {isPending ? 'Resetting...' : 'Reset password'}
            </Button>
          </form>
        </CardContent>
        <CardContent className='flex justify-end'>
          <Link href='/auth/sign-in' className='text-sm text-muted-foreground'>
            Cancel and sign in
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
