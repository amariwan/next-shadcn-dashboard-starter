import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Page() {
  const session = await auth();

  if (!session?.user?.id) {
    return redirect('/auth/sign-in');
  }

  redirect('/dashboard/overview');
}
