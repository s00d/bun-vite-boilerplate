import { resolve } from "node:path";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

export default defineConfig(({ mode, command }) => {
  const isSSR = command === "build" && mode === "ssr";

  return {
    root: resolve(__dirname, "."),
    base: "/",
    plugins: [vue()],
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
      strictPort: true,
      hmr: true,
    },
    build: {
      outDir: resolve(__dirname, isSSR ? "dist/server" : "dist/client"),
      ssr: isSSR,
      manifest: !isSSR,
      ssrManifest: isSSR,
      rollupOptions: {
        input: isSSR ? "./src/client/entry-server.ts" : "",
        // : path.resolve(__dirname, './src/client/entry-client.ts'),
        output: {
          entryFileNames: "[name].js",
        },
      },
    },
    ssr: {
      noExternal: ["vue", "@vue/server-renderer", "vue-router", "pinia"],
    },
  };
});
