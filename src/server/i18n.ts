// src/server/i18n.ts — the API's translator: one instance, forked per request (own locale).
import { createI18n } from "@i18n-micro/node";
import { detectLocaleFromAcceptLanguage } from "@i18n-micro/utils/accept-language";
import { I18N_CONFIG, LOCALE_CODES } from "../../config/i18n.config";
import { getTranslations } from "./translations";

const { root, routes } = await getTranslations();

export const i18n = createI18n({
  locale: I18N_CONFIG.defaultLocale,
  fallbackLocale: I18N_CONFIG.defaultLocale,
  messages: root,
  routeMessages: routes,
});

/** `?lng=`, else Accept-Language (q-weighted), else the default locale. */
export function requestLocale(request: Request): string {
  const fromQuery = new URL(request.url).searchParams.get("lng");
  if (fromQuery && LOCALE_CODES.includes(fromQuery)) return fromQuery;
  return (
    detectLocaleFromAcceptLanguage(request.headers.get("accept-language") ?? undefined, LOCALE_CODES) ??
    I18N_CONFIG.defaultLocale
  );
}
