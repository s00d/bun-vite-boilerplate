// src/server/routes/guest.ts
import type { Server } from "bun";
import { Elysia, t } from "elysia";
import { rateLimit } from "elysia-rate-limit";
import type { AppContextPlugin } from "@/server/context";
import { loginController, logoutController, registerController } from "@/server/controllers/auth";

const credentials = t.Object({
  email: t.String({ format: "email" }),
  password: t.String({ minLength: 6 }),
});

/** `server`: the listening server, so the limiter can read client IPs (a sub-plugin has none). */
export const guestRoutes = (context: AppContextPlugin, server: () => Server<unknown> | null) =>
  new Elysia({ prefix: "/api", tags: ["guest"] })
    .use(context)
    .use(
      new Elysia({ prefix: "/guest" })
        .use(context)
        // Brute-force guard for the credential endpoints only (per client IP).
        .use(
          rateLimit({
            max: Number(process.env.AUTH_RATE_LIMIT ?? 10),
            duration: 60_000,
            scoping: "scoped",
            injectServer: server,
          }),
        )
        .post("/register", (ctx) => registerController(ctx), { body: credentials })
        .post("/login", (ctx) => loginController(ctx), { body: credentials }),
    )
    .post("/logout", (ctx) => logoutController(ctx));
