// src/server/routes/protected.ts
import { Elysia } from "elysia";
import { profileController } from "@/server/controllers/auth";
import { authorize } from "@/server/middleware/auth";

export const protectedRoutes = new Elysia({ prefix: "/api" })
  .derive(async ({ request }) => {
    const { user } = await authorize(request);
    if (!user) throw new Response("Unauthorized", { status: 401 });
    return { user };
  })
  .get("/profile", profileController);
