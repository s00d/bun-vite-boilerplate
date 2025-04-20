// src/client/entry-client.ts
import { createApp } from "./main";
import { useUserStore } from "./store/user";
import {
  setupI18n,
  getLocaleFromPath,
  getNamespaceFromPath,
  loadLocaleNamespace,
  setI18nLanguage
} from "./plugins/i18n";

const { app, router, pinia } = createApp();

// @ts-ignore
if (window.__pinia) {
  // @ts-ignore
  pinia.state.value = window.__pinia;
}

// Инициализация i18n до роутера
const initialPath = router.currentRoute.value.path;
const initialLocale = getLocaleFromPath(initialPath);
const initialNamespace = getNamespaceFromPath(initialPath);

const i18n = setupI18n(initialLocale);
app.use(i18n);

// Роут-хук для ленивой загрузки перевода
router.beforeEach(async (to, from, next) => {
  const locale = getLocaleFromPath(to.path);
  const namespace = getNamespaceFromPath(to.path);

  await loadLocaleNamespace(i18n, locale, namespace);
  setI18nLanguage(i18n, locale);

  return next();
});

// Запуск приложения
router.isReady().then(async () => {
  const store = useUserStore(pinia);
  await store.get();

  app.mount("#app");
});
