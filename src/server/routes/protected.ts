// src/server/routes/protected.ts
import { Elysia } from "elysia";
import { profileController, flashController } from "@/server/controllers/auth";
import type { User } from "@/server/models/user";

type AppContext = {
  user: User;
};

export const protectedRoutes = new Elysia({ prefix: "/api", tags: ["protected"] })
  .derive(async (ctx): Promise<AppContext> => {
    // @ts-expect-error - ctx.user добавляется sessionPlugin-ом
    const user = ctx.user;
    if (!user) throw new Response("Unauthorized", { status: 401 });
    return { user };
  })
  .get("/profile", profileController)
  .post("/flash/:userId", flashController);

