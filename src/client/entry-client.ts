// src/client/entry-client.ts
import { createApp } from "./main";
import { useUserStore } from "./store/user";
import {
  setupI18n,
  getLocaleFromPath,
  getNamespaceFromPath,
  loadLocaleNamespace,
  setI18nLanguage,
} from "./plugins/i18n";

const { app, router, pinia } = createApp();

if (window.__pinia) {
  pinia.state.value = window.__pinia;
}

// Инициализация i18n до роутера
const initialPath = window.location.pathname; // router has not navigated yet
const initialLocale = getLocaleFromPath(initialPath);

const i18n = setupI18n(initialLocale);
app.use(i18n);

// Роут-хук для ленивой загрузки перевода
router.beforeEach(async (to) => {
  const locale = getLocaleFromPath(to.path);
  const namespace = getNamespaceFromPath(to.path);

  await loadLocaleNamespace(i18n, locale, namespace);
  setI18nLanguage(i18n, locale);
});

// Запуск приложения
// Mount from the SSR state at once; then refresh the user (prerendered pages carry the guest state).
await router.isReady();
app.mount("#app");
void useUserStore(pinia).get();
