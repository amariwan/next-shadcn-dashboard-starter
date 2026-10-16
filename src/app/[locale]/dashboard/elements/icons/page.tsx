import IconsViewPage from '@/features/elements/components/icons-view-page';
import { setRequestLocale } from 'next-intl/server';

export const metadata = {
  title: 'Dashboard : Icons'
};

export default async function Page({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <IconsViewPage />;
}
