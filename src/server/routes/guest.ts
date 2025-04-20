// src/server/routes/guest.ts
import { Elysia, t } from "elysia";
import {
  loginController,
  registerController,
  logoutController,
} from "@/server/controllers/auth";
import {validateCsrf} from "@/server/middleware/csrf";

export const guestRoutes = new Elysia({ prefix: "/api", tags: ["guest"] })
  .model({
    credentials: t.Object({
      email: t.String({ format: "email" }),
      password: t.String({ minLength: 6 }),
    }),
  })
  .derive(({ request }) => {
    if (!validateCsrf(request)) {
      throw new Response("Invalid CSRF token", { status: 403 });
    }
    return {};
  })

  .post("/guest/register", registerController, {
    body: "credentials",
  })

  .post("/guest/login", loginController, {
    body: "credentials",
  })

  .post("/logout", logoutController);
