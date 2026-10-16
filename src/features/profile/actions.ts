'use server';

import { updateUser } from '@/features/profile/api/service';

export async function updateProfile({
  userId,
  name,
  email
}: {
  userId: string;
  name: string;
  email: string;
}) {
  try {
    const user = await updateUser({ userId, name, email });
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
