import "dotenv/config";

import { Elysia } from "elysia";
import { staticPlugin } from "@elysiajs/static";
import { cookie } from "@elysiajs/cookie";
import { swagger } from "@elysiajs/swagger";
import { logger } from "@bogeychan/elysia-logger";
import { i18next as i18nextPlugin } from "elysia-i18next";
import { compression } from "./plugin/compression";
import { rateLimit } from "elysia-rate-limit";
// import { geoIP } from './plugin/geo-ip'
import { etag } from "@bogeychan/elysia-etag";
import { serverTiming } from "@elysiajs/server-timing";
import { elysiaXSS } from "elysia-xss";
import { html } from "@elysiajs/html";
import { i18n } from "./i18n";
import { guestRoutes } from "./routes/guest";
import { metaRoutes } from "./routes/meta";
import { protectedRoutes } from "./routes/protected";
import { wsRoutes } from "./routes/ws";
import { ssr } from "./routes/ssr";
import { i18nRoutes } from "@/server/routes/i18n";
import { initDb } from "@/server/db/init";
import {sessionPlugin} from "@/server/plugin/session";

const idDev = process.env.NODE_ENV !== "production";

try {
  const db = await initDb();

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  const hostname = process.env.HOST ?? "localhost";

  const app = new Elysia();
  app.derive(() => ({ db }));
  app.use(
    logger({
      level: process.env.LOG_LEVEL ?? "info",
    }),
  );
  app.use(i18nextPlugin({ instance: i18n }));
  app.use(staticPlugin({ prefix: "/public" }));
  app.use(cookie());
  app.use(html());
  app.use(serverTiming());
  app.use(sessionPlugin());

  app.use(
    swagger({
      documentation: {
        info: {
          title: "bun-vite-boilerplate",
          version: "1.0.0",
        },
      },
    }),
  );
  if (!idDev) app.use(elysiaXSS({}));
  if (!idDev) app.use(compression());
  if (!idDev) app.use(etag());

  if (!idDev)
    app.use(
      rateLimit({
        max: 100,
      }),
    );
  // app.use(geoIP) // required geo id db in data/GeoLite2-Country.mmdb
  app.use(i18nRoutes);
  app.use(guestRoutes);
  app.use(metaRoutes);
  app.use(protectedRoutes);
  app.use(wsRoutes);
  app.use(ssr);

  app
    .onError(({ code, error }) => {
      if (code === "NOT_FOUND") return "Page not found";
      console.error(error);
    })
    .listen({ port, hostname });

  console.log(`🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`);
} catch (error) {
  console.error("❌ Initialization error:", error);
  process.exit(1);
}
