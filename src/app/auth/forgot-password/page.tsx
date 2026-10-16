'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsPending(true);
    try {
      const res = await fetch('/api/auth/reset-password?action=forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? 'Failed to send reset email');
        return;
      }
      setSent(true);
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsPending(false);
    }
  }

  if (sent) {
    return (
      <div className='flex h-full items-center justify-center'>
        <Card className='w-full max-w-md'>
          <CardHeader>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              We've sent a password reset link to <strong>{email}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className='text-center'>
            <p className='text-sm text-muted-foreground'>
              Didn't receive it? Check your spam folder or
              <Link
                href='/auth/forgot-password'
                className='text-primary underline underline-offset-4'
              >
                request again
              </Link>
              .
            </p>
          </CardContent>
          <CardContent className='flex justify-end'>
            <Link href='/auth/sign-in' className='text-sm text-muted-foreground'>
              Back to sign in
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
          <CardTitle>Forgot password</CardTitle>
          <CardDescription>Enter your email and we'll send you a reset link.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                type='email'
                placeholder='you@example.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
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
