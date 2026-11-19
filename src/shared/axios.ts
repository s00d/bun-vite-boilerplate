// src/shared/axios.ts
import axios from "axios";
import { SECURITY_CONFIG } from "../../config/security.config";
import { getEnv } from "./env";
import { getGlobalCookie } from "./globalCookieJar";

const isServer = typeof window === "undefined";

export const api = axios.create({
  // Browser: same origin unless PUBLIC_API_URL says otherwise. SSR: this server itself.
  baseURL: getEnv("PUBLIC_API_URL") || (isServer ? `http://localhost:${process.env.PORT ?? 3000}` : ""),
  withCredentials: true,
});

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  for (const pair of document.cookie.split("; ")) {
    const i = pair.indexOf("=");
    if (pair.slice(0, i) === name) return decodeURIComponent(pair.slice(i + 1));
  }
  return null;
}

if (isServer) {
  api.interceptors.request.use((config) => {
    // Matches SSR_REQUEST_HEADER in src/server/plugin/session.ts (not imported: server-only module).
    config.headers.set("x-ssr-request", "1");
    const cookie = getGlobalCookie();
    if (cookie) config.headers.set("cookie", cookie);
    return config;
  });
} else {
  api.interceptors.request.use((config) => {
    if (["post", "put", "patch", "delete"].includes(config.method || "")) {
      const csrf = getCookie(SECURITY_CONFIG.csrfCookieName);
      if (csrf) config.headers.set(SECURITY_CONFIG.csrfHeaderName, csrf);
    }
    return config;
  });
}
