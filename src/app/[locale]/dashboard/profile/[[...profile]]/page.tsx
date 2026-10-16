import ProfileViewPage from '@/features/profile/components/profile-view-page';
import { setRequestLocale } from 'next-intl/server';

export const metadata = {
  title: 'Dashboard : Profile'
};

export default async function Page({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ProfileViewPage />;
}
