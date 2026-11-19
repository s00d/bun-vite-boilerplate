// src/server/routes/meta.ts
import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import type { AppContextPlugin } from "@/server/context";
import { healthController, infoController } from "@/server/controllers/meta";

export const metaRoutes = (context: AppContextPlugin) => {
  const routes = new Elysia({ prefix: "/meta", tags: ["meta"] })
    .use(context)
    .use(
      cors({
        // Explicit allow-list (CORS_ORIGIN=https://a.com,https://b.com). Reflecting any origin with
        // credentials would let every site read user data (this hook applies to all routes).
        origin: process.env.CORS_ORIGIN?.split(",").filter(Boolean) ?? false,
        credentials: true,
      }),
    )
    .get("/health", (ctx) => healthController(ctx));
  // Memory, versions, uptime: useful locally, a fingerprint in production.
  return process.env.NODE_ENV === "production" ? routes : routes.get("/info", (ctx) => infoController(ctx));
};
