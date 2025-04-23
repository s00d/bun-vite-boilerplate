// src/server/routes/guest.ts
import { Elysia, t } from "elysia";
import { loginController, registerController, logoutController } from "@/server/controllers/auth";

export const guestRoutes = new Elysia({ prefix: "/api", tags: ["guest"] })
  .model({
    credentials: t.Object({
      email: t.String({ format: "email" }),
      password: t.String({ minLength: 6 }),
    }),
  })

  .post("/guest/register", registerController, {
    body: "credentials",
  })

  .post("/guest/login", loginController, {
    body: "credentials",
  })

  .post("/logout", logoutController);
