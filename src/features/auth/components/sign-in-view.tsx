'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GitHubStarsButton } from '@/components/github-stars-button';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { signIn } from '@/lib/auth/client';
import { z } from 'zod';
import { InteractiveGridPattern } from './interactive-grid';

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export default function SignInViewPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);

  function startTransition(cb: () => Promise<void>) {
    setIsPending(true);
    cb().finally(() => setIsPending(false));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const formData = new FormData(event.currentTarget);
    const result = signInSchema.safeParse({
      email: formData.get('email'),
      password: formData.get('password')
    });
    if (!result.success) {
      setError('Please enter a valid email and password.');
      return;
    }
    startTransition(async () => {
      const response = await signIn('credentials', {
        email: result.data.email,
        password: result.data.password,
        redirect: false
      });
      if (response?.error) {
        setError('Invalid email or password.');
        return;
      }
      router.push('/dashboard/overview');
      router.refresh();
    });
  }

  return (
    <div className='relative flex min-h-screen flex-col items-center justify-center overflow-hidden md:grid lg:max-w-none lg:grid-cols-2 lg:px-0'>
      <Link
        href='/examples/authentication'
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'absolute top-4 right-4 hidden md:top-8 md:right-8'
        )}
      >
        Login
      </Link>
      <div className='relative hidden h-full flex-col p-10 lg:flex dark:border-r'>
        <div className='absolute inset-0 bg-sidebar' />
        <div className='text-sidebar-foreground relative z-20 flex items-center text-lg font-medium'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='mr-2 h-6 w-6'
          >
            <path d='M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3' />
          </svg>
          Logo
        </div>
        <InteractiveGridPattern
          className={cn(
            'mask-[radial-gradient(400px_circle_at_center,white,transparent)]',
            'inset-x-0 inset-y-[0%] h-full skew-y-12'
          )}
        />
        <div className='text-sidebar-foreground relative z-20 mt-auto'>
          <blockquote className='space-y-2'>
            <p className='text-lg'>
              &ldquo;This starter template has saved me countless hours of work and helped me
              deliver projects to my clients faster than ever before.&rdquo;
            </p>
            <footer className='text-sidebar-foreground/70 text-sm'>Random Dude</footer>
          </blockquote>
        </div>
      </div>
      <div className='flex h-full items-center justify-center p-4 lg:p-8'>
        <div className='flex w-full max-w-md flex-col items-center justify-center space-y-6'>
          <GitHubStarsButton
            owner='amariwan'
            repo='next-shadcn-dashboard-starter'
            showRepo
            variant='outline'
            size='default'
          />
          <form onSubmit={onSubmit} className='space-y-4 w-full'>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input id='email' name='email' type='email' required placeholder='you@example.com' />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='password'>Password</Label>
              <Input id='password' name='password' type='password' required />
            </div>
            {error && <p className='text-destructive text-sm text-center'>{error}</p>}
            <Button type='submit' className='w-full' disabled={isPending}>
              Sign In
            </Button>
          </form>
          <div className='text-muted-foreground space-y-2 px-8 text-center text-xs'>
            <p>
              This is an{' '}
              <Link href='/about' className='hover:text-primary underline underline-offset-4'>
                open-source project
              </Link>{' '}
              for demo purposes. Authentication is handled locally with Auth.js.
            </p>
            <p>
              <Link
                href='https://github.com/amariwan/next-shadcn-dashboard-starter'
                target='_blank'
                className='hover:text-primary underline underline-offset-4'
              >
                View on GitHub
              </Link>
            </p>
          </div>
          <p className='text-muted-foreground px-8 text-center text-sm'>
            By clicking continue, you agree to our{' '}
            <Link
              href='/terms-of-service'
              className='hover:text-primary underline underline-offset-4'
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              href='/privacy-policy'
              className='hover:text-primary underline underline-offset-4'
            >
              Privacy Policy
            </Link>
            .
          </p>
          <p className='text-center text-sm'>
            Don&apos;t have an account?{' '}
            <Link href='/auth/sign-up' className='text-primary underline underline-offset-4'>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
