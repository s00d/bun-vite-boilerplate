/// <reference types="vite/client" />

interface Window {
  __env: Record<string, string>;
  /** Pinia state serialized by SSR. */
  __pinia?: Record<string, any>;
}
