// src/client/entry-client.ts
import { createApp } from "./main";
import { useUserStore } from "./store/user";

const { app, router, pinia } = createApp();

// @ts-ignore
if (window.__pinia) {
  // @ts-ignore
  pinia.state.value = window.__pinia;
}

// app.use(router).use(pinia);

router.isReady().then(async () => {
  const store = useUserStore(pinia);
  await store.get();
  app.mount("#app");
});
