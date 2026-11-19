// src/server/translations.ts
// Dictionaries from disk (@i18n-micro/node). Server only: the API (src/server/i18n.ts) and
// SSR (src/client/entry-server.ts) read them; the browser gets them from SSR state and /api/i18n.
import { resolve } from "node:path";
import { type LoadedTranslations, loadTranslations } from "@i18n-micro/node";
import { I18N_CONFIG } from "../../config/i18n.config";

const dir = resolve(process.cwd(), I18N_CONFIG.localesPath);
let cached: Promise<LoadedTranslations> | undefined;

/** Read once in production; re-read on every call in development, so edits show on reload. */
export function getTranslations(): Promise<LoadedTranslations> {
  if (process.env.NODE_ENV !== "production") return loadTranslations(dir);
  cached ??= loadTranslations(dir);
  return cached;
}

/**
 * What a page needs in `locale`: the root and its route dictionary, plus the default
 * locale's (the fallback) when `locale` is another one.
 */
export async function pageTranslations(locale: string, route: string) {
  const { root, routes } = await getTranslations();
  const locales = locale === I18N_CONFIG.defaultLocale ? [locale] : [locale, I18N_CONFIG.defaultLocale];
  return Object.fromEntries(locales.map((l) => [l, { root: root[l] ?? {}, route: routes[route]?.[l] ?? {} }] as const));
}

export type PageTranslations = Awaited<ReturnType<typeof pageTranslations>>;
