import "dotenv/config";

import { Elysia } from "elysia";
import { staticPlugin } from "@elysiajs/static";
import { cookie } from "@elysiajs/cookie";
import { swagger } from "@elysiajs/swagger";
import { logger } from "@bogeychan/elysia-logger";
import { i18next as i18nextPlugin } from 'elysia-i18next';
import { i18n } from './i18n';
import { guestRoutes } from "./routes/guest";
import { metaRoutes } from "./routes/meta";
import { protectedRoutes } from "./routes/protected";
import { wsRoutes } from "./routes/ws";
import { ssr } from "./routes/ssr";
import {i18nRoutes} from "@/server/routes/i18n";
import { initDb } from "@/server/db/init";

try {
  const db = await initDb();

  const port = process.env.PORT ? Number(process.env.PORT) : 3000
  const hostname = process.env.HOST ?? "localhost"

  const app = new Elysia()
    .derive(() => ({ db }))
    .use(
      logger({
        level: process.env.LOG_LEVEL ?? 'info',
      })
    )
    .use(i18nextPlugin({ instance: i18n }))
    .use(staticPlugin({ prefix: "/public" }))
    .use(cookie())
    .use(swagger({
      documentation: {
        info: {
          title: 'bun-vite-boilerplate',
          version: '1.0.0'
        }
      }
    }))
    .use(i18nRoutes)
    .use(guestRoutes)
    .use(metaRoutes)
    .use(protectedRoutes)
    .use(wsRoutes)
    .use(ssr)
    .onError(({ code, error }) => {
      if (code === "NOT_FOUND") return "Page not found";
      console.error(error);
    })
    .listen({ port, hostname });

  console.log(
    `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
  );
} catch (error) {
  console.error("❌ Initialization error:", error);
  process.exit(1);
}
