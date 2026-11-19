// src/server/app.ts
import { etag } from "@bogeychan/elysia-etag";
import { serverTiming } from "@elysiajs/server-timing";
import { staticPlugin } from "@elysiajs/static";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { createContext } from "./context";
import { initDb } from "./db/init";
import { viteSSR } from "./plugin/vite-ssr";
import { guestRoutes } from "./routes/guest";
import { i18nRoutes } from "./routes/i18n";
import { metaRoutes } from "./routes/meta";
import { protectedRoutes } from "./routes/protected";
import { wsRoutes } from "./routes/ws";
import { SessionStore, type SessionStorageType } from "./services/session-store";

export interface AppOptions {
  /** Serve Vue pages (Vite SSR). Off for API-only use, e.g. tests. */
  ssr?: boolean;
}

export async function createApp({ ssr = true }: AppOptions = {}) {
  const dev = process.env.NODE_ENV !== "production";
  await initDb();

  const sessionStore = new SessionStore((process.env.SESSION_STORAGE as SessionStorageType) || "db");
  const purge = setInterval(() => void sessionStore.purgeExpired(), 60 * 60 * 1000);
  purge.unref();

  const context = createContext(sessionStore);

  const app = new Elysia()
    .use(context)
    .use(staticPlugin({ prefix: "/public" }))
    .use(serverTiming());

  if (dev) app.use(swagger({ documentation: { info: { title: "bun-vite-boilerplate", version: "1.0.0" } } }));
  else app.use(etag());

  app
    .use(i18nRoutes)
    .use(guestRoutes(context, () => app.server))
    .use(metaRoutes(context))
    .use(protectedRoutes(context))
    .use(wsRoutes(context));

  if (ssr) app.use(await viteSSR());

  app.onStop(() => {
    clearInterval(purge);
    sessionStore.close();
  });

  return app;
}
