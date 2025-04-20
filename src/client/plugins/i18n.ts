// src/client/plugins/i18n.ts
import { createI18n, type I18n } from "vue-i18n";
import { nextTick } from "vue";
import { I18N_CONFIG } from "../../../config/i18n.config";
import { api } from "@/shared/axios";

export function setupI18n(locale: string): I18n<any, any, any, any, false> {
  return createI18n({
    legacy: false,
    globalInjection: true,
    locale,
    fallbackLocale: "en",
    messages: {},
  });
}

export function setI18nLanguage(i18n: I18n<any, any, any, any, false>, locale: string) {
  i18n.global.locale.value = locale;

  for (const lng of I18N_CONFIG.supportedLngs) {
    if (!i18n.global.availableLocales.includes(lng)) {
      i18n.global.setLocaleMessage(lng, {});
    }
  }

  if (typeof document !== "undefined") {
    document.documentElement.lang = locale;
  }
}

export function getLocaleFromPath(path: string): string {
  const segments = path.split("/").filter(Boolean);
  return /^[a-z]{2}$/.test(segments[0]) ? segments[0] : "en";
}

export function getNamespaceFromPath(path: string): string {
  const segments = path.split("/").filter(Boolean);
  return /^[a-z]{2}$/.test(segments[0]) ? segments.slice(1).join("/") || "home" : segments.join("/") || "home";
}

export async function loadLocaleNamespace(i18n: I18n<any, any, any, any, false>, locale: string, namespace: string) {
  const key = `${locale}:${namespace}`;

  try {
    const res = await api.get("/api/i18n", {
      params: {
        locale,
        namespace,
      },
    });

    const translations = res.data?.translations ?? {};

    const existing = i18n.global.getLocaleMessage(locale);
    i18n.global.setLocaleMessage(locale, {
      ...(typeof existing === "object" ? existing : {}),
      [namespace]: translations,
    });
  } catch (e: any) {
    // Файл может отсутствовать — устанавливаем пустой namespace
    const existing = i18n.global.getLocaleMessage(locale);
    i18n.global.setLocaleMessage(locale, {
      ...(typeof existing === "object" ? existing : {}),
      [namespace]: {},
    });

    console.warn(`⚠️ Missing translations for ${locale}/${namespace}, using empty fallback.`);
  }

  return nextTick();
}
