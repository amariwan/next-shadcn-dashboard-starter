import { Metadata } from 'next';
import SignInViewPage from '@/features/auth/components/sign-in-view';
import { setRequestLocale } from 'next-intl/server';

export const metadata: Metadata = {
  title: 'Authentication | Sign In',
  description: 'Sign In page for authentication.'
};

export default async function Page({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SignInViewPage />;
}
