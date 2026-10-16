import { defineRouting } from 'next-intl/routing';

export const locales = ['en', 'de', 'fr', 'es', 'uk'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, { name: string; flag: string; nativeName: string }> = {
  en: { name: 'English', nativeName: 'English', flag: '🇬🇧' },
  de: { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  fr: { name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  es: { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  uk: { name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦' }
};

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
  pathnames: {
    '/': '/',
    '/about': {
      en: '/about',
      de: '/ueber-uns',
      fr: '/a-propos',
      es: '/acerca-de',
      uk: '/pro-nas'
    },
    '/privacy-policy': {
      en: '/privacy-policy',
      de: '/datenschutz',
      fr: '/politique-de-confidentialite',
      es: '/politica-de-privacidad',
      uk: '/polityka-konfidentsiynosti'
    },
    '/terms-of-service': {
      en: '/terms-of-service',
      de: '/nutzungsbedingungen',
      fr: '/conditions-d-utilisation',
      es: '/terminos-de-servicio',
      uk: '/umovy-obslugovuvannya'
    },
    '/auth': '/auth',
    '/auth/sign-in': '/auth/sign-in',
    '/auth/sign-up': '/auth/sign-up',
    '/auth/forgot-password': '/auth/forgot-password',
    '/auth/reset-password': '/auth/reset-password',
    '/auth/verify-email': '/auth/verify-email',
    '/dashboard': '/dashboard',
    '/dashboard/overview': {
      en: '/dashboard/overview',
      de: '/dashboard/uebersicht',
      fr: '/dashboard/vue-d-ensemble',
      es: '/dashboard/vision-general',
      uk: '/dashboard/oglyad'
    },
    '/dashboard/product': {
      en: '/dashboard/product',
      de: '/dashboard/produkte',
      fr: '/dashboard/produits',
      es: '/dashboard/productos',
      uk: '/dashboard/produkty'
    },
    '/dashboard/product/new': '/dashboard/product/new',
    '/dashboard/users': {
      en: '/dashboard/users',
      de: '/dashboard/benutzer',
      fr: '/dashboard/utilisateurs',
      es: '/dashboard/usuarios',
      uk: '/dashboard/korystuvachi'
    },
    '/dashboard/workspaces': {
      en: '/dashboard/workspaces',
      de: '/dashboard/arbeitsbereiche',
      fr: '/dashboard/espaces-de-travail',
      es: '/dashboard/espacios-de-trabajo',
      uk: '/dashboard/robochi-prostory'
    },
    '/dashboard/audit-log': {
      en: '/dashboard/audit-log',
      de: '/dashboard/audit-protokoll',
      fr: '/dashboard/journal-d-audit',
      es: '/dashboard/registro-de-auditoria',
      uk: '/dashboard/zhurnal-audytu'
    },
    '/dashboard/kanban': '/dashboard/kanban',
    '/dashboard/chat': '/dashboard/chat',
    '/dashboard/notifications': {
      en: '/dashboard/notifications',
      de: '/dashboard/benachrichtigungen',
      fr: '/dashboard/notifications',
      es: '/dashboard/notificaciones',
      uk: '/dashboard/spovishchennya'
    },
    '/dashboard/profile': {
      en: '/dashboard/profile',
      de: '/dashboard/profil',
      fr: '/dashboard/profil',
      es: '/dashboard/perfil',
      uk: '/dashboard/profil'
    },
    '/dashboard/forms': {
      en: '/dashboard/forms',
      de: '/dashboard/formulare',
      fr: '/dashboard/formulaires',
      es: '/dashboard/formularios',
      uk: '/dashboard/formy'
    },
    '/dashboard/forms/basic': '/dashboard/forms/basic',
    '/dashboard/forms/multi-step': '/dashboard/forms/multi-step',
    '/dashboard/forms/sheet-form': '/dashboard/forms/sheet-form',
    '/dashboard/forms/advanced': '/dashboard/forms/advanced',
    '/dashboard/react-query': '/dashboard/react-query',
    '/dashboard/elements/icons': {
      en: '/dashboard/elements/icons',
      de: '/dashboard/elemente/symbole',
      fr: '/dashboard/elements/icones',
      es: '/dashboard/elementos/iconos',
      uk: '/dashboard/elementy/znachky'
    }
  }
});
