import { validateCsrf } from "@/server/middleware/csrf";
import { db } from "@/server/db/init";
import { sessions } from "@/server/models/session";
import { users, type User } from "@/server/models/user";
import { eq } from "drizzle-orm";
import { randomUUIDv7 } from "bun";
import bcrypt from "bcryptjs";
import type { Context, RouteSchema } from "elysia";
import type { Logger } from "@bogeychan/elysia-logger/types";
import type { TFunction } from "i18next";
import {SECURITY_CONFIG} from "../../../config/security.config";

export interface AuthBody {
  email: string;
  password: string;
}

export type AppContext<T extends Partial<RouteSchema> = {}> = Context<T> & {
  log: Logger;
  db: typeof db;
  t: TFunction;
};

export async function registerController({ body, request, set, log, t }: AppContext<{ body: AuthBody }>) {
  if (!validateCsrf(request)) {
    log.warn("Registration failed: invalid CSRF token");
    set.status = 403;
    return { error: t("auth:invalid_csrf") };
  }

  const { email, password } = body;
  log.info({ email }, "Attempting registration");

  const existing = db.select().from(users).where(eq(users.email, email)).get();
  if (existing) {
    log.warn({ email }, "Registration failed: user already exists");
    set.status = 409;
    return { error: t("auth:user_exists") };
  }

  const hash = bcrypt.hashSync(password, 10);
  const apiKey = randomUUIDv7();

  const inserted = await db
    .insert(users)
    .values({ email, passwordHash: hash, apiKey })
    .returning();
  const user = inserted[0];

  if (!user) {
    log.error({ email }, "Registration failed: DB insert returned empty");
    set.status = 500;
    return { error: t("auth:registration_failed") };
  }

  const sessionId = randomUUIDv7();
  const now = Date.now();
  const expiresAt = now + 1000 * 60 * 60 * 24;

  await db.insert(sessions).values({
    id: sessionId,
    userId: user.id,
    createdAt: new Date(now),
    expiresAt: new Date(expiresAt),
  });

  log.info({ email, userId: user.id }, "User registered successfully");

  set.headers["Set-Cookie"] = `${SECURITY_CONFIG.sessionCookieName}=${sessionId}; Path=/; HttpOnly; Max-Age=${SECURITY_CONFIG.sessionMaxAge}`;
  return { message: t("auth:registered"), userId: user.id };
}

export async function loginController({ body, request, set, log, t }: AppContext<{ body: AuthBody }>) {
  if (!validateCsrf(request)) {
    log.warn("Login failed: invalid CSRF token");
    set.status = 403;
    return { error: t("auth:invalid_csrf") };
  }

  const { email, password } = body;
  log.info({ email }, "Attempting login");

  const user = db.select().from(users).where(eq(users.email, email)).get();
  if (!user) {
    log.warn({ email }, "Login failed: user not found");
    set.status = 401;
    return { error: t("auth:invalid_credentials") };
  }

  if (!bcrypt.compareSync(password, user.passwordHash)) {
    log.warn({ email }, "Login failed: invalid password");
    set.status = 401;
    return { error: t("auth:invalid_credentials") };
  }

  const sessionId = randomUUIDv7();
  const now = Date.now();
  const expiresAt = now + 1000 * 60 * 60 * 24;

  await db.insert(sessions).values({
    id: sessionId,
    userId: user.id,
    createdAt: new Date(now),
    expiresAt: new Date(expiresAt),
  });

  log.info({ email, userId: user.id }, "User logged in successfully");

  set.headers["Set-Cookie"] = `${SECURITY_CONFIG.sessionCookieName}=${sessionId}; Path=/; HttpOnly; Max-Age=${SECURITY_CONFIG.sessionMaxAge}`;
  return { message: t("auth:login_success") };
}

export async function logoutController({ set, log, t }: AppContext) {
  log.info("User logged out");
  set.headers["Set-Cookie"] = `${SECURITY_CONFIG.sessionCookieName}=; Path=/; HttpOnly; Max-Age=0`;
  return { message: t("auth:logout_success") };
}

export async function profileController({ user, log, t }: { user: User; log: Logger; t: TFunction }) {
  log.info({ email: user.email }, "Fetching profile");
  return {
    email: user.email,
    apiKey: user.apiKey,
    message: t("auth:profile_info")
  };
}
