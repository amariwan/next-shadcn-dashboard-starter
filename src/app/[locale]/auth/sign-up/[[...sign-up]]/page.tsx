import { Metadata } from 'next';
import SignUpViewPage from '@/features/auth/components/sign-up-view';
import { setRequestLocale } from 'next-intl/server';

export const metadata: Metadata = {
  title: 'Authentication | Sign Up',
  description: 'Sign Up page for authentication.'
};

export default async function Page({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SignUpViewPage />;
}
