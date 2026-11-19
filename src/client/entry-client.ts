// src/client/entry-client.ts
import { localeFromPath } from "../../config/i18n.config";
import { applyPageTranslations, type PageTranslations, routeKey } from "./i18n";
import { createApp } from "./main";
import { api } from "@/shared/axios";
import { useUserStore } from "./store/user";

const { app, router, pinia, i18n } = createApp();

if (window.__pinia) pinia.state.value = window.__pinia;

// Dictionaries already here, as `locale:route` (SSR sent the first page's).
const loaded = new Set<string>();
if (window.__i18n) {
  const { locale, route, translations } = window.__i18n;
  applyPageTranslations(i18n, locale, route, translations);
  loaded.add(`${locale}:${route}`);
}

router.beforeEach(async (to) => {
  const locale = localeFromPath(to.path);
  const route = routeKey(to);
  if (!loaded.has(`${locale}:${route}`)) {
    const { data } = await api.get<PageTranslations>("/api/i18n", { params: { locale, route } });
    loaded.add(`${locale}:${route}`);
    applyPageTranslations(i18n, locale, route, data);
    return;
  }
  i18n.global.setRoute(route);
  i18n.global.locale.value = locale;
});

router.afterEach((to) => {
  document.documentElement.lang = localeFromPath(to.path);
});

// Mount from the SSR state at once; then refresh the user (prerendered pages carry the guest state).
await router.isReady();
app.mount("#app");
void useUserStore(pinia).get();
