// src/server/context.ts
// What every route sees: log, t, session, user. Built once per app (createApp) and passed to
// the route modules, which `.use()` it for types; Elysia dedupes it by name, so its hooks
// run once per request.
import { logger } from "@bogeychan/elysia-logger";
import { Elysia, type InferContext } from "elysia";
import { I18N_CONFIG } from "../../config/i18n.config";
import { i18n } from "./i18n";
import { sessionPlugin } from "./plugin/session";
import type { SessionStore } from "./services/session-store";

/** `?lng=`, else the Accept-Language primary tag, else the fallback. */
function detectLanguage(request: Request): string {
  const supported: readonly string[] = I18N_CONFIG.supportedLngs;
  const fromQuery = new URL(request.url).searchParams.get("lng");
  if (fromQuery && supported.includes(fromQuery)) return fromQuery;
  for (const part of (request.headers.get("accept-language") ?? "").split(",")) {
    const lng = part.trim().slice(0, 2).toLowerCase();
    if (supported.includes(lng)) return lng;
  }
  return I18N_CONFIG.fallbackLng;
}

export function createContext(store: SessionStore) {
  return new Elysia({ name: "context" })
    .use(logger({ level: process.env.LOG_LEVEL ?? "info" }))
    .derive({ as: "global" }, ({ request }) => ({
      i18n,
      t: i18n.getFixedT(detectLanguage(request)),
    }))
    .use(sessionPlugin(store));
}

export type AppContextPlugin = ReturnType<typeof createContext>;
export type AppContext = InferContext<AppContextPlugin>;
