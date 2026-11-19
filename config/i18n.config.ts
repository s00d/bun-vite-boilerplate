// config/i18n.config.ts — shared by server and client (@i18n-micro/node, @i18n-micro/vue).
export const I18N_CONFIG = {
  /**
   * Translation folder, Nuxt I18n Micro layout:
   * locales/<locale>.json (root, every page) and locales/pages/<route>/<locale>.json
   * (route dictionaries, loaded with their page; `auth/login` ↔ route name `auth-login`).
   */
  localesPath: "locales",

  /** Locale of unprefixed URLs, and the fallback for missing keys. */
  defaultLocale: "en",

  /** Every other locale is a URL prefix: /ru/about. */
  locales: [
    { code: "en", iso: "en-US", displayName: "English" },
    { code: "ru", iso: "ru-RU", displayName: "Русский" },
  ],
} as const;

export const LOCALE_CODES: readonly string[] = I18N_CONFIG.locales.map((l) => l.code);

/** `/ru/about` → `ru`; an unprefixed path is the default locale. */
export function localeFromPath(path: string): string {
  const first = path.split("/").find(Boolean);
  return first && first !== I18N_CONFIG.defaultLocale && LOCALE_CODES.includes(first)
    ? first
    : I18N_CONFIG.defaultLocale;
}
