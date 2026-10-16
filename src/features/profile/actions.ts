'use server';

import { auth } from '@/lib/auth';
import { hasSystemPermission } from '@/lib/auth/rbac';
import { updateUser } from '@/features/profile/api/service';

import { cookies } from 'next/headers';

export async function updateProfile({
  userId,
  name,
  email,
  locale
}: {
  userId: string;
  name: string;
  email: string;
  locale?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const isSystemAdmin = hasSystemPermission(session.user.role, 'system.admin');
    if (session.user.id !== userId && !isSystemAdmin) {
      return { success: false, error: 'Forbidden' };
    }

    const user = await updateUser({ userId, name, email, locale });
    if (locale) {
      const cookieStore = await cookies();
      cookieStore.set('NEXT_LOCALE', locale, {
        path: '/',
        maxAge: 365 * 24 * 60 * 60,
        sameSite: 'lax'
      });
    }
    return { success: true, user };
  } catch (error) {
    if (error instanceof Error) {
      const msg = error.message;
      if (msg === 'Forbidden') return { success: false, error: 'Forbidden' };
      if (msg.includes('not found')) return { success: false, error: 'User not found' };
      return { success: false, error: msg };
    }
    return { success: false, error: 'Internal error' };
  }
}

export async function setUserLocalePreference(locale: string) {
  try {
    const cookieStore = await cookies();
    cookieStore.set('NEXT_LOCALE', locale, {
      path: '/',
      maxAge: 365 * 24 * 60 * 60,
      sameSite: 'lax'
    });

    const session = await auth();
    if (session?.user?.id) {
      await updateUser({
        userId: session.user.id,
        name: session.user.name || '',
        email: session.user.email || '',
        locale
      });
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
