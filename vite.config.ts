import "dotenv/config";

import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isSSR = command === 'build' && mode === 'ssr';

  const PORT = Number.parseInt(env.VITE_PORT || '6996', 10);

  return {
    root: './',
    base: '/',
    plugins: [
      vue(),
      tailwindcss()
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    define: {
      __VUE_PROD_DEVTOOLS__: false,
      __VUE_OPTIONS_API__: true,
    },
    server: {
      port: PORT,
      strictPort: true,
      cors: true,
      hmr: true
    },
    build: {
      outDir: resolve(__dirname, isSSR ? 'dist/server' : 'dist/client'),
      emptyOutDir: !isSSR, // чтобы при сборке SSR не терлась client-сборка
      ssr: isSSR,
      manifest: !isSSR,
      ssrManifest: isSSR,
      rollupOptions: {
        input: isSSR
          ? resolve(__dirname, 'src/client/entry-server.ts')
          : resolve(__dirname, 'index.html'),
        output: {
          entryFileNames: '[name].js'
        }
      }
    },
    ssr: {
      noExternal: [
        'vue',
        '@vue/server-renderer',
        'vue-router',
        'vue-i18n',
        'pinia'
      ]
    }
  };
});
