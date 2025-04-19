import { createApp } from "./main";
import { useUserStore } from "./store/user";
import { installI18n } from "./plugins/i18n";

const { app, router, pinia } = createApp();

// @ts-ignore
if (window.__pinia) {
  // @ts-ignore
  pinia.state.value = window.__pinia;
}

router.isReady().then(async () => {
  await installI18n(app, router); // <--- перенос сюда

  const store = useUserStore(pinia);
  await store.get();

  app.mount("#app");
});
