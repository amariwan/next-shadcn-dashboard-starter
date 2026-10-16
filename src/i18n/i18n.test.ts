import { describe, expect, it } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';
import { routing, locales, defaultLocale, localeNames } from './routing';

describe('i18n Configuration & Routing', () => {
  it('configures all 5 required locales with English as default', () => {
    expect(locales).toEqual(['en', 'de', 'fr', 'es', 'uk']);
    expect(defaultLocale).toBe('en');
    expect(routing.locales).toEqual(['en', 'de', 'fr', 'es', 'uk']);
    expect(routing.defaultLocale).toBe('en');
    expect(routing.localePrefix).toBe('as-needed');
  });

  it('provides native names and flags for all 5 locales', () => {
    for (const locale of locales) {
      const meta = localeNames[locale];
      expect(meta).toBeDefined();
      expect(meta.name).toBeTruthy();
      expect(meta.nativeName).toBeTruthy();
      expect(meta.flag).toBeTruthy();
    }
  });

  it('defines localized pathnames for key dashboard routes', () => {
    const pathnames = routing.pathnames as Record<string, any>;
    expect(pathnames).toBeDefined();

    // Check dashboard overview has localized paths
    const overview = pathnames['/dashboard/overview'];
    expect(overview).toBeDefined();
    expect(overview.en).toBe('/dashboard/overview');
    expect(overview.de).toBe('/dashboard/uebersicht');
    expect(overview.fr).toBe('/dashboard/vue-d-ensemble');
    expect(overview.es).toBe('/dashboard/vision-general');
    expect(overview.uk).toBe('/dashboard/oglyad');

    // Check product has localized paths
    const product = pathnames['/dashboard/product'];
    expect(product).toBeDefined();
    expect(product.en).toBe('/dashboard/product');
    expect(product.de).toBe('/dashboard/produkte');
    expect(product.fr).toBe('/dashboard/produits');
    expect(product.es).toBe('/dashboard/productos');
    expect(product.uk).toBe('/dashboard/produkty');

    // Check workspaces has localized paths
    const workspaces = pathnames['/dashboard/workspaces'];
    expect(workspaces).toBeDefined();
    expect(workspaces.de).toBe('/dashboard/arbeitsbereiche');
    expect(workspaces.fr).toBe('/dashboard/espaces-de-travail');
  });
});

describe('Translation Completeness & Missing Key Detection', () => {
  const messagesDir = path.resolve(process.cwd(), 'messages');

  function loadMessages(loc: string): Record<string, any> {
    const filePath = path.join(messagesDir, `${loc}.json`);
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  }

  function getLeafKeys(obj: Record<string, any>, prefix = ''): Array<{ key: string; value: string }> {
    let results: Array<{ key: string; value: string }> = [];
    for (const [key, val] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof val === 'object' && val !== null) {
        results = results.concat(getLeafKeys(val, fullKey));
      } else {
        results.push({ key: fullKey, value: String(val) });
      }
    }
    return results;
  }

  const enMessages = loadMessages('en');
  const enLeafs = getLeafKeys(enMessages);
  const enKeySet = new Set(enLeafs.map((l) => l.key));

  it('contains expected baseline translation namespaces in English source', () => {
    expect(enMessages.common).toBeDefined();
    expect(enMessages.nav).toBeDefined();
    expect(enMessages.dashboard).toBeDefined();
    expect(enMessages.products).toBeDefined();
    expect(enMessages.users).toBeDefined();
    expect(enMessages.workspaces).toBeDefined();
    expect(enMessages.auditLog).toBeDefined();
    expect(enMessages.kanban).toBeDefined();
    expect(enMessages.chat).toBeDefined();
    expect(enMessages.notifications).toBeDefined();
    expect(enMessages.profile).toBeDefined();
    expect(enMessages.forms).toBeDefined();
    expect(enMessages.validation).toBeDefined();
    expect(enMessages.auth).toBeDefined();
    expect(enMessages.errors).toBeDefined();
    expect(enLeafs.length).toBeGreaterThan(150);
  });

  for (const locale of ['de', 'fr', 'es', 'uk'] as const) {
    describe(`Locale: ${locale}`, () => {
      const locMessages = loadMessages(locale);
      const locLeafs = getLeafKeys(locMessages);
      const locKeySet = new Set(locLeafs.map((l) => l.key));
      const locValueMap = new Map(locLeafs.map((l) => [l.key, l.value]));

      it(`has zero missing keys compared to English`, () => {
        const missingKeys: string[] = [];
        for (const enKey of enKeySet) {
          if (!locKeySet.has(enKey)) {
            missingKeys.push(enKey);
          }
        }
        expect(missingKeys).toEqual([]);
      });

      it(`has zero extraneous keys not in English`, () => {
        const extraneousKeys: string[] = [];
        for (const locKey of locKeySet) {
          if (!enKeySet.has(locKey)) {
            extraneousKeys.push(locKey);
          }
        }
        expect(extraneousKeys).toEqual([]);
      });

      it(`has no empty translation strings`, () => {
        const emptyKeys: string[] = [];
        for (const [key, value] of locValueMap.entries()) {
          if (!value || value.trim() === '') {
            emptyKeys.push(key);
          }
        }
        expect(emptyKeys).toEqual([]);
      });

      it(`preserves identical ICU placeholder parameters`, () => {
        function extractPlaceholders(str: string): string[] {
          const matches = str.match(/\{[a-zA-Z0-9_]+\}/g) || [];
          return matches.sort();
        }

        const mismatchedPlaceholders: string[] = [];
        for (const { key, value: enValue } of enLeafs) {
          const enPlaceholders = extractPlaceholders(enValue);
          const locValue = locValueMap.get(key) || '';
          const locPlaceholders = extractPlaceholders(locValue);

          if (enPlaceholders.join(',') !== locPlaceholders.join(',')) {
            mismatchedPlaceholders.push(
              `${key} (en: [${enPlaceholders}] vs ${locale}: [${locPlaceholders}])`
            );
          }
        }
        expect(mismatchedPlaceholders).toEqual([]);
      });
    });
  }
});

describe('Date & Number Localization Formats', () => {
  it('formats numbers and currencies per locale', () => {
    const amount = 1234567.89;

    // English USD
    const enUsd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    expect(enUsd).toContain('$');
    expect(enUsd).toContain('1,234,567.89');

    // German EUR
    const deEur = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
    expect(deEur).toContain('€');
    // German uses period as thousands separator and comma as decimal separator
    expect(deEur).toContain('1.234.567,89');

    // French EUR
    const frEur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
    expect(frEur).toContain('€');

    // Spanish EUR
    const esEur = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
    expect(esEur).toContain('€');

    // Ukrainian UAH
    const ukUah = new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH' }).format(amount);
    expect(ukUah).toContain('₴');
  });

  it('formats dates per locale', () => {
    const testDate = new Date('2026-10-16T12:00:00Z');

    const enDate = testDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    expect(enDate).toContain('2026');

    const deDate = testDate.toLocaleDateString('de-DE', { month: 'short', day: 'numeric', year: 'numeric' });
    expect(deDate).toContain('2026');

    const frDate = testDate.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric', year: 'numeric' });
    expect(frDate).toContain('2026');

    const ukDate = testDate.toLocaleDateString('uk-UA', { month: 'short', day: 'numeric', year: 'numeric' });
    expect(ukDate).toContain('2026');
  });
});
