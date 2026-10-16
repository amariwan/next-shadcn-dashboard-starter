import { Metadata } from 'next';
import { redirect } from '@/i18n/navigation';
import { setRequestLocale } from 'next-intl/server';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false
  }
};

export default async function AuthPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  redirect({ href: '/auth/sign-in', locale });
}
