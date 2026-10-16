'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { GitHubLogoIcon } from '@radix-ui/react-icons';
import { Metadata } from 'next';
import { Link, useRouter } from '@/i18n/navigation';
import { useState } from 'react';
import { signIn } from '@/lib/auth/client';
import { signUp } from '@/features/auth/actions';
import { z } from 'zod';
import { InteractiveGridPattern } from './interactive-grid';
import { useTranslations } from 'next-intl';

export const metadata: Metadata = {
  title: 'Authentication',
  description: 'Authentication forms built using the components.'
};

const signUpSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

export default function SignUpViewPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);
  const t = useTranslations('auth');
  const tProfile = useTranslations('profile');

  async function startTransition(cb: () => Promise<void>) {
    setIsPending(true);
    cb().finally(() => setIsPending(false));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const formData = new FormData(event.currentTarget);
    const result = signUpSchema.safeParse({
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword')
    });
    if (!result.success) {
      setError(result.error.issues[0]?.message || 'Please fix the errors.');
      return;
    }

    startTransition(async () => {
      const createResult = await signUp(result.data.email, result.data.password, result.data.name);
      if (createResult.error) {
        setError(createResult.error);
        return;
      }
      const response = await signIn('credentials', {
        email: result.data.email,
        password: result.data.password,
        redirect: false
      });
      if (response?.error) {
        setError('Failed to sign in after registration.');
        return;
      }
      router.push('/dashboard/overview');
      router.refresh();
    });
  }

  return (
    <div className='relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0'>
      <Link
        href='/auth/sign-up'
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'absolute top-4 right-4 hidden md:top-8 md:right-8'
        )}
      >
        {t('signUp')}
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
          <a
            className='inline-flex hover:text-yellow-200'
            target='_blank'
            rel='noopener noreferrer'
            href={'https://github.com/amariwan/next-shadcn-dashboard-starter'}
          >
            <div className='flex items-center'>
              <GitHubLogoIcon className='size-4' />
              <span className='ml-1 inline'>Star on GitHub</span>{' '}
            </div>
          </a>
          <form onSubmit={onSubmit} className='space-y-4 w-full'>
            <div className='space-y-2'>
              <Label htmlFor='name'>{tProfile('name')}</Label>
              <Input id='name' name='name' required placeholder={tProfile('namePlaceholder')} />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='email'>{t('email')}</Label>
              <Input
                id='email'
                name='email'
                type='email'
                required
                placeholder='you@example.com'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='password'>{t('password')}</Label>
              <Input
                id='password'
                name='password'
                type='password'
                required
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='confirmPassword'>{t('confirmNewPassword')}</Label>
              <Input
                id='confirmPassword'
                name='confirmPassword'
                type='password'
                required
              />
            </div>
            {error && (
              <p className='text-destructive text-sm text-center'>{error}</p>
            )}
            <Button type='submit' className='w-full' disabled={isPending}>
              {t('signUp')}
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
              <a
                href='https://github.com/amariwan/next-shadcn-dashboard-starter'
                target='_blank'
                rel='noopener noreferrer'
                className='hover:text-primary underline underline-offset-4'
              >
                View on GitHub
              </a>
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
            {t('alreadyHaveAccount')}{' '}
            <Link href='/auth/sign-in' className='text-primary underline underline-offset-4'>
              {t('signIn')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
