import { createI18n} from "vue-i18n";
import { watch } from "vue";
import { api } from "@/shared/axios";
import type { Router } from "vue-router";

export interface I18nApiResponse {
  locale: string;
  namespace: string;
  translations: Record<string, string>;
  availableLocales: string[];
  availableNamespaces: string[];
}

function getLocaleFromPath(path: string): string | null {
  const segments = path.split("/").filter(Boolean);
  if (segments.length && /^[a-z]{2}$/.test(segments[0])) {
    return segments[0];
  }
  return null;
}

function getNamespaceFromPath(path: string): string {
  const segments = path.split("/").filter(Boolean);
  if (segments.length && /^[a-z]{2}$/.test(segments[0])) {
    return segments.slice(1).join("/") || "home";
  }
  return segments.join("/") || "home";
}

async function fetchTranslations(locale: string, namespace: string): Promise<I18nApiResponse | null> {
  try {
    const { data } = await api.get("/api/i18n", {
      params: { locale, namespace }
    });

    return data;
  } catch (e) {
    console.warn(`Could not load translations for ${locale}/${namespace}`, e);
    return null;
  }
}

export async function installI18n(app: ReturnType<typeof import("vue").createApp>, router: Router) {
  const initialPath = router.currentRoute.value.path;
  const initialLocale = getLocaleFromPath(initialPath) || "en";
  const initialNamespace = getNamespaceFromPath(initialPath);
  const loadedKeys = new Set<string>();

  const localesData = await fetchTranslations(initialLocale, initialNamespace);
  if (!localesData) throw new Error("Failed to load initial translations");

  const i18n = createI18n({
    legacy: false,
    globalInjection: true,
    locale: localesData.locale,
    fallbackLocale: "en",
    messages: {
      [initialLocale]: { [localesData.namespace]: JSON.parse(JSON.stringify(localesData.translations)) }
    }
  });

  for (const lng of localesData.availableLocales) {
    if (!i18n.global.availableLocales.includes(lng)) {
      i18n.global.setLocaleMessage(lng, {});
    }
  }

  loadedKeys.add(`${initialLocale}:${initialNamespace}`);
  app.use(i18n);

  watch(
    () => router.currentRoute.value.path,
    async (newPath) => {
      const locale = getLocaleFromPath(newPath) || "en";
      const namespace = getNamespaceFromPath(newPath);
      const key = `${locale}:${namespace}`;

      if (loadedKeys.has(key)) {
        if (i18n.global.locale.value !== locale) {
          i18n.global.locale.value = locale;
        }
        return;
      }

      const localesData = await fetchTranslations(locale, namespace);
      if (!localesData?.translations) throw new Error("Failed to load initial translations");

      const existing = i18n.global.getLocaleMessage(localesData.locale);
      i18n.global.setLocaleMessage(localesData.locale, {
        ...(typeof existing === "object" ? existing : {}),
        ...{ [localesData.namespace]: JSON.parse(JSON.stringify(localesData.translations)) }
      });
      i18n.global.locale.value = localesData.locale;
      loadedKeys.add(key);
    },
    { immediate: false }
  );
}
