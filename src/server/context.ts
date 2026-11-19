// src/server/context.ts
// What every route sees: log, t, session, user. Built once per app (createApp) and passed to
// the route modules, which `.use()` it for types; Elysia dedupes it by name, so its hooks
// run once per request.
import { logger } from "@bogeychan/elysia-logger";
import { Elysia, type InferContext } from "elysia";
import { i18n, requestLocale } from "./i18n";
import { sessionPlugin } from "./plugin/session";
import type { SessionStore } from "./services/session-store";

export function createContext(store: SessionStore) {
  return new Elysia({ name: "context" })
    .use(logger({ level: process.env.LOG_LEVEL ?? "info" }))
    .derive({ as: "global" }, ({ request }) => {
      // A fork has its own locale: concurrent requests never switch each other's.
      const translator = i18n.fork(requestLocale(request));
      return {
        locale: translator.getLocale(),
        t: (key: string, params?: Record<string, string | number>) => translator.ts(key, params),
      };
    })
    .use(sessionPlugin(store));
}

export type AppContextPlugin = ReturnType<typeof createContext>;
export type AppContext = InferContext<AppContextPlugin>;
