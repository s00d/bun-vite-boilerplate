// src/server/routes/protected.ts
import { Elysia, t } from "elysia";
import type { AppContextPlugin } from "@/server/context";
import { flashController, profileController } from "@/server/controllers/auth";

export const protectedRoutes = (context: AppContextPlugin) =>
  new Elysia({ prefix: "/api", tags: ["protected"] })
    .use(context)
    .resolve(({ user, status }) => (user ? { user } : status(401, "Unauthorized")))
    .get("/profile", (ctx) => profileController(ctx))
    .post("/flash/:userId", (ctx) => flashController(ctx), {
      body: t.Object({ message: t.String({ minLength: 1 }) }),
    });
