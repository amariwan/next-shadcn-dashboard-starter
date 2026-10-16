'use client';

import PageContainer from '@/components/layout/page-container';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { useSession } from 'next-auth/react';
import { useState, useTransition } from 'react';
import * as z from 'zod';
import { updateProfile } from '@/features/profile/actions';
import { toast } from 'sonner';
import { useLocale, useTranslations } from 'next-intl';
import { locales, localeNames, type Locale } from '@/i18n/routing';
import { usePathname, useRouter } from '@/i18n/navigation';

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  locale?: string | null;
}

function ProfileForm({ user }: { user: UserProfile }) {
  const currentLocale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [selectedLocale, setSelectedLocale] = useState<Locale>(
    (user.locale as Locale) || currentLocale
  );
  const [isPending, startTransition] = useTransition();

  const t = useTranslations('profile');
  const tCommon = useTranslations('common');
  const tVal = useTranslations('validation');

  const schema = z.object({
    name: z.string().min(1, tVal('required')).max(100),
    email: z.string().email(tVal('invalidEmail'))
  });

  type Values = z.infer<typeof schema>;
  const { FormTextField } = useFormFields<Values>();

  const form = useAppForm({
    defaultValues: { name: user.name ?? '', email: user.email ?? '' },
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      startTransition(async () => {
        const result = await updateProfile({
          userId: user.id,
          name: value.name.trim(),
          email: value.email.trim().toLowerCase(),
          locale: selectedLocale
        });
        if (result.success) {
          toast.success(t('profileUpdated'));
          if (selectedLocale !== currentLocale) {
            router.replace(pathname, { locale: selectedLocale });
          }
        } else {
          toast.error(result.error ?? t('updateFailed'));
        }
      });
    }
  });

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>{t('accountInfo')}</CardTitle>
          <CardDescription>{t('accountInfoDesc')}</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <form.AppForm>
            <form.Form>
              <div className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='name'>{t('name')}</Label>
                  <FormTextField
                    id='name'
                    name='name'
                    label={t('name')}
                    required
                    placeholder={t('namePlaceholder')}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='email'>{t('email')}</Label>
                  <FormTextField
                    id='email'
                    name='email'
                    label={t('email')}
                    type='email'
                    required
                    placeholder={t('emailPlaceholder')}
                  />
                </div>
                <div className='space-y-2'>
                  <Label>{t('role')}</Label>
                  <Input value={user.role} readOnly className='bg-muted' />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='language'>{t('languagePreference')}</Label>
                  <Select
                    value={selectedLocale}
                    onValueChange={(val) => setSelectedLocale(val as Locale)}
                  >
                    <SelectTrigger id='language' className='w-full'>
                      <SelectValue placeholder={tCommon('language.selectLanguage')} />
                    </SelectTrigger>
                    <SelectContent>
                      {locales.map((loc) => (
                        <SelectItem key={loc} value={loc}>
                          <span className='mr-2'>{localeNames[loc].flag}</span>
                          <span>{localeNames[loc].nativeName}</span>
                          <span className='ml-1 text-muted-foreground uppercase text-xs'>
                            ({loc})
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className='text-muted-foreground text-xs'>
                    {t('languagePreferenceDesc')}
                  </p>
                </div>
                <form.SubmitButton className='w-full' disabled={isPending}>
                  {isPending ? t('saving') : t('saveChanges')}
                </form.SubmitButton>
              </div>
            </form.Form>
          </form.AppForm>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProfileViewPage() {
  const { data: session } = useSession();
  const user = session?.user as UserProfile | null;
  const t = useTranslations('profile');

  if (!user) {
    return (
      <PageContainer pageTitle={t('title')}>
        <div className='flex h-full items-center justify-center'>
          <p className='text-muted-foreground'>{t('pleaseSignIn')}</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer pageTitle={t('title')} pageDescription={t('description')}>
      <ProfileForm user={user} />
    </PageContainer>
  );
}
