'use client';

import React, { useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { locales, localeNames, type Locale } from '@/i18n/routing';
import { usePathname, useRouter } from '@/i18n/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { setUserLocalePreference } from '@/features/profile/actions';

export function LocaleSwitcher() {
  const currentLocale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('common.language');
  const [isPending, startTransition] = useTransition();

  const handleSelect = (nextLocale: Locale) => {
    if (nextLocale === currentLocale) return;

    startTransition(async () => {
      // 1. Persist to DB (if authenticated) and set NEXT_LOCALE cookie
      await setUserLocalePreference(nextLocale);
      // 2. Perform client navigation to the new locale route smoothly
      router.replace(pathname, { locale: nextLocale });
    });
  };

  const active = localeNames[currentLocale] || localeNames.en;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='sm'
          className='flex h-9 items-center gap-1.5 px-2.5 text-xs font-medium'
          disabled={isPending}
          aria-label={t('selectLanguage')}
        >
          <span className='text-base leading-none'>{active.flag}</span>
          <span className='hidden uppercase font-semibold sm:inline-block'>
            {currentLocale}
          </span>
          <Icons.chevronDown className='h-3.5 w-3.5 opacity-60' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='min-w-[170px]'>
        <DropdownMenuLabel className='text-xs font-medium text-muted-foreground'>
          {t('selectLanguage')}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {locales.map((loc) => {
          const item = localeNames[loc];
          const isSelected = loc === currentLocale;
          return (
            <DropdownMenuItem
              key={loc}
              onClick={() => handleSelect(loc)}
              className='flex cursor-pointer items-center justify-between text-xs'
            >
              <div className='flex items-center gap-2'>
                <span className='text-base leading-none'>{item.flag}</span>
                <span>{item.nativeName}</span>
                <span className='text-muted-foreground uppercase text-[10px]'>
                  ({loc})
                </span>
              </div>
              {isSelected && <Icons.check className='h-3.5 w-3.5 text-primary' />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
