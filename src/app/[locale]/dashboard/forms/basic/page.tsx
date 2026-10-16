import PageContainer from '@/components/layout/page-container';
import DemoForm from '@/components/forms/demo-form';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export const metadata = {
  title: 'Dashboard: Basic Form'
};

export default async function Page({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'forms' });

  return (
    <PageContainer
      pageTitle={t('basicForm')}
      pageDescription={t('description')}
    >
      <DemoForm />
    </PageContainer>
  );
}
