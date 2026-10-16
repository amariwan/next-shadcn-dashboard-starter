import { auth } from '@/lib/auth';
import { redirect } from '@/i18n/navigation';
import { setRequestLocale } from 'next-intl/server';

export default async function Dashboard({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();

  if (!session?.user?.id) {
    redirect({ href: '/auth/sign-in', locale });
  }

  redirect({ href: '/dashboard/overview', locale });
}
