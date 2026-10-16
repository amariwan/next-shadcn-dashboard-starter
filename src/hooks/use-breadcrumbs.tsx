'use client';

import { usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

export type BreadcrumbItem = {
  title: string;
  link: string;
};

export function useBreadcrumbs() {
  const pathname = usePathname();
  const t = useTranslations('nav');

  const breadcrumbs = useMemo(() => {
    const segmentLabels: Record<string, string> = {
      dashboard: t('dashboard'),
      overview: t('overview'),
      product: t('product'),
      users: t('users'),
      workspaces: t('workspaces'),
      'audit-log': t('auditLog'),
      kanban: t('kanban'),
      chat: t('chat'),
      notifications: t('notifications'),
      forms: t('forms'),
      elements: t('elements'),
      icons: t('icons'),
      profile: t('profile'),
      account: t('account'),
      billing: t('billing')
    };

    const segments = pathname.split('/').filter(Boolean);
    return segments.map((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join('/')}`;
      const title =
        segmentLabels[segment.toLowerCase()] ||
        segment.charAt(0).toUpperCase() + segment.slice(1);
      return {
        title,
        link: path
      };
    });
  }, [pathname, t]);

  return breadcrumbs;
}
