// src/shared/axios.ts
import axios from "axios";
import { getEnv } from "./env";
import { getGlobalCookie } from "./globalCookieJar";
import {SECURITY_CONFIG} from "../../config/security.config";

const isServer = typeof window === "undefined";

export const api = axios.create({
  baseURL: getEnv("PUBLIC_API_URL"),
  withCredentials: true,
});

export function getCookie(name: string): string | null {
  const cookieString = typeof document !== "undefined" ? document.cookie : "";
  const cookies = cookieString.split("; ").reduce(
    (acc, pair) => {
      const [key, value] = pair.split("=");
      acc[key] = value;
      return acc;
    },
    {} as Record<string, string>,
  );
  return cookies[name] || null;
}

if (isServer) {
  api.interceptors.request.use((config) => {
    const cookie = getGlobalCookie();
    if (cookie) {
      config.headers = config.headers || {};
      config.headers.cookie = cookie;
    }
    return config;
  });
} else {
  api.interceptors.request.use((config) => {
    if (["post", "put", "patch", "delete"].includes(config.method || "")) {
      const csrf = getCookie(SECURITY_CONFIG.csrfCookieName);
      console.log(111, csrf)
      if (csrf) config.headers[SECURITY_CONFIG.csrfHeaderName] = csrf;
    }
    return config;
  });
}
