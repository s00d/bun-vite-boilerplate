// src/client/main.ts
import { createHead } from "@vueuse/head";
import { createPinia } from "pinia";
import { createSSRApp } from "vue";
import App from "./App.vue";
import { setupI18n } from "./i18n";
import { createRouter } from "./router";
import "./main.css";

export function createApp() {
  // SSR on both sides: the client hydrates the server markup instead of re-rendering it.
  const app = createSSRApp(App);
  const pinia = createPinia();
  const router = createRouter();
  const head = createHead();
  const i18n = setupI18n(router);

  app.use(pinia).use(router).use(head).use(i18n);

  return { app, pinia, router, head, i18n };
}
