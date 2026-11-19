// src/client/i18n.ts — @i18n-micro/vue, one instance per app (per request on the server).
import { createI18n, type I18nPlugin } from "@i18n-micro/vue";
import { createVueRouterAdapter } from "@i18n-micro/vue/router";
import type { RouteLocationNormalized, Router } from "vue-router";
import { I18N_CONFIG } from "../../config/i18n.config";
import type { PageTranslations } from "@/server/translations";

export type { PageTranslations };

const locales = I18N_CONFIG.locales.map((l) => ({ ...l }));

export function setupI18n(router: Router): I18nPlugin {
  return createI18n({
    locale: I18N_CONFIG.defaultLocale,
    fallbackLocale: I18N_CONFIG.defaultLocale,
    messages: {},
    locales,
    defaultLocale: I18N_CONFIG.defaultLocale,
    // `/about`, `/ru/about`; <I18nLink> renders RouterLink, switchLocale keeps the page.
    routingStrategy: createVueRouterAdapter(router, locales, I18N_CONFIG.defaultLocale),
  });
}

/** Route dictionary name: the route's name (`auth-login` ↔ locales/pages/auth/login). */
export const routeKey = (route: RouteLocationNormalized) => String(route.name ?? "index");

/** Adds a page's dictionaries and makes `locale` and `route` current. */
export function applyPageTranslations(i18n: I18nPlugin, locale: string, route: string, data: PageTranslations) {
  for (const [code, dict] of Object.entries(data)) {
    i18n.global.addTranslations(code, dict.root);
    i18n.global.addRouteTranslations(code, route, dict.route);
  }
  i18n.global.setRoute(route);
  i18n.global.locale.value = locale;
}
