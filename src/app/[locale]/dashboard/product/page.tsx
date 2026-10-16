import PageContainer from '@/components/layout/page-container';
import { buttonVariants } from '@/components/ui/button';
import ProductListingPage from '@/features/products/components/product-listing';
import { searchParamsCache } from '@/lib/searchparams';
import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';
import { Link } from '@/i18n/navigation';
import { SearchParams } from 'nuqs/server';
import { productInfoContent } from '@/config/infoconfig';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export const metadata = {
  title: 'Dashboard: Products'
};

type pageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
};

export default async function Page(props: pageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'products' });

  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      pageTitle={t('title')}
      pageDescription={t('description')}
      infoContent={productInfoContent}
      pageHeaderAction={
        <Link href='/dashboard/product/new' className={cn(buttonVariants(), 'text-xs md:text-sm')}>
          <Icons.add className='mr-2 h-4 w-4' /> {t('addProduct')}
        </Link>
      }
    >
      <ProductListingPage />
    </PageContainer>
  );
}
