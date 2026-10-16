'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import Link from 'next/link';
import { toast } from 'sonner';

interface ResetPasswordContentProps {
  token?: string;
}

export default function ResetPasswordContent({ token }: ResetPasswordContentProps) {
  const [step, setStep] = useState<'request' | 'reset' | 'success'>(
    token ? 'reset' : 'request'
  );
  const [requestEmail, setRequestEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPending, setIsPending] = useState(false);

  if (step === 'success') {
    return (
      <div className='flex h-full items-center justify-center p-4'>
        <Card className='w-full max-w-md'>
          <CardHeader>
            <CardTitle>Password reset</CardTitle>
            <CardDescription>Your password has been changed successfully.</CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col items-center justify-center gap-4'>
            <Button asChild>
              <Link href='/auth/sign-in'>Sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'request' || !token) {
    async function handleRequestReset(e: React.FormEvent) {
      e.preventDefault();
      if (!requestEmail) {
        toast.error('Please enter your email address');
        return;
      }
      setIsPending(true);
      try {
        const res = await fetch('/api/auth/reset-password?action=forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: requestEmail })
        });
        if (!res.ok) {
          const data = await res.json();
          toast.error(data.error ?? 'Failed to send reset email');
          return;
        }
        toast.success('Reset link sent if account exists');
      } catch {
        toast.error('Something went wrong');
      } finally {
        setIsPending(false);
      }
    }

    return (
      <div className='flex h-full items-center justify-center p-4'>
        <Card className='w-full max-w-md'>
          <CardHeader>
            <CardTitle>Forgot password</CardTitle>
            <CardDescription>
              Enter your email and we'll send you a reset link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRequestReset} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='email'>Email</Label>
                <Input
                  id='email'
                  type='email'
                  required
                  value={requestEmail}
                  onChange={(e) => setRequestEmail(e.target.value)}
                  placeholder='you@example.com'
                />
              </div>
              <Button type='submit' className='w-full' disabled={isPending}>
                {isPending ? 'Sending...' : 'Send reset link'}
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

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
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
      toast.success('Password reset successfully');
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className='flex h-full items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader>
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>Enter your new password below.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='new-password'>New Password</Label>
              <Input
                id='new-password'
                type='password'
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder='At least 8 characters'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='confirm-password'>Confirm Password</Label>
              <Input
                id='confirm-password'
                type='password'
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder='Re-enter your password'
              />
            </div>
            <Button type='submit' className='w-full' disabled={isPending}>
              {isPending ? 'Resetting...' : 'Reset password'}
            </Button>
          </form>
        </CardContent>
        <CardContent className='flex justify-end'>
          <Link href='/auth/sign-in' className='text-sm text-muted-foreground'>
            Back to Sign in
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
