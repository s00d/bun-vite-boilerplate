/// <reference types="vite/client" />

interface Window {
  __env: Record<string, string>;
  /** Pinia state serialized by SSR. */
  __pinia?: Record<string, any>;
  /** The first page's dictionaries, serialized by SSR. */
  __i18n?: { locale: string; route: string; translations: import("./i18n").PageTranslations };
}
