// src/client/main.ts
import { createHead } from "@vueuse/head";
import { createPinia } from "pinia";
import { createApp as createBaseApp, createSSRApp } from "vue";
import App from "./App.vue";
import { createRouter } from "./router";

export function createApp() {
  const app = import.meta.env.SSR ? createSSRApp(App) : createBaseApp(App);
  const pinia = createPinia();
  const router = createRouter();
  const head = createHead();

  app.use(pinia).use(router).use(head);

  return { app, pinia, router, head };
}
