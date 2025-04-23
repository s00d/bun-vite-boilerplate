import { db } from "@/server/db/init";
import { sessions } from "@/server/models/session";
import { users, type User } from "@/server/models/user";
import { eq } from "drizzle-orm";
import { randomUUIDv7 } from "bun";
import bcrypt from "bcryptjs";
import type { Logger } from "@bogeychan/elysia-logger/types";
import type { TFunction } from "i18next";
import { SECURITY_CONFIG } from "../../../config/security.config";
import type {SessionData, SessionStore} from "@/server/services/session-store";
import type { Context as ElysiaContext } from "elysia";
import type {Server} from "elysia/universal";
import type {Cookie, ElysiaCookie} from "elysia/cookies";
import type {StatusMap} from "elysia/utils";
import type {HTTPHeaders} from "elysia/types";

export interface AuthBody {
  email: string;
  password: string;
}


export type AppContext = ElysiaContext & {
  user: User;
  log: Logger;
  db: typeof db;
  t: TFunction;
  session: SessionData;
  sessionStore: SessionStore;
  cookie: Record<string, Cookie<string | undefined>>;
  sessionId: string;
  csrfToken: string | null;
  validateCsrf: () => boolean;
  getCsrfToken: () => string;
  server: Server | null;
  set: {
    status?: number | keyof StatusMap;
    headers: HTTPHeaders;
    redirect?: string;
    cookie?: Record<string, ElysiaCookie>;
  };
};

export async function registerController({ body, set, log, t, validateCsrf }: AppContext & { body: AuthBody }) {
  if (!validateCsrf()) {
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

  const inserted = await db.insert(users).values({ email, passwordHash: hash, apiKey }).returning();
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

  set.headers["Set-Cookie"] =
    `${SECURITY_CONFIG.sessionCookieName}=${sessionId}; Path=/; HttpOnly; Max-Age=${SECURITY_CONFIG.sessionMaxAge}`;
  return { message: t("auth:registered"), userId: user.id };
}

export async function loginController(ctx: AppContext & { body: AuthBody }) {
  if (!ctx.validateCsrf()) {
    ctx.log.warn("Login failed: invalid CSRF token");
    ctx.set.status = 403;
    return { error: ctx.t("auth:invalid_csrf") };
  }

  const { email, password } = ctx.body;
  ctx.log.info({ email }, "Attempting login");

  const user = db.select().from(users).where(eq(users.email, email)).get();
  if (!user) {
    ctx.log.warn({ email }, "Login failed: user not found");
    ctx.set.status = 401;
    return { error: ctx.t("auth:invalid_credentials") };
  }

  if (!bcrypt.compareSync(password, user.passwordHash)) {
    ctx.log.warn({ email }, "Login failed: invalid password");
    ctx.set.status = 401;
    return { error: ctx.t("auth:invalid_credentials") };
  }

  // ❌ удалить текущую (гостевую) сессию, если нужно
  await ctx.sessionStore?.delete?.(ctx.sessionId); // только если у тебя есть метод удаления

  // ✅ создать новую авторизованную сессию
  const sessionId = randomUUIDv7();
  const now = Date.now();
  const expiresAt = new Date(now + SECURITY_CONFIG.sessionMaxAge * 1000);
  const csrfToken = randomUUIDv7();

  await ctx.sessionStore.set({
    id: sessionId,
    userId: user.id,
    csrfToken,
    createdAt: new Date(now),
    expiresAt,
  });

  // ✅ обновить реактивные куки
  ctx.cookie[SECURITY_CONFIG.sessionCookieName].set({
    value: sessionId,
    path: "/",
    httpOnly: true,
    maxAge: SECURITY_CONFIG.sessionMaxAge,
  });

  ctx.cookie[SECURITY_CONFIG.csrfCookieName].set({
    value: csrfToken,
    path: "/",
    sameSite: "strict",
  });

  ctx.log.info({ email, userId: user.id }, "User logged in successfully");

  return { message: ctx.t("auth:login_success") };
}

export async function logoutController({ cookie, log, t, sessionId, sessionStore }: AppContext) {
  log.info("User logged out");

  await sessionStore?.delete?.(sessionId); // только если у тебя есть метод удаления

  // Удаляем куки реактивно
  cookie[SECURITY_CONFIG.sessionCookieName].remove();
  cookie[SECURITY_CONFIG.csrfCookieName]?.remove(); // опционально, если есть

  return { message: t("auth:logout_success") };
}

export async function profileController({ user, log, t }: { user: User; log: Logger; t: TFunction }) {
  log.info({ email: user.email }, "Fetching profile");
  return {
    id: user.id,
    email: user.email,
    apiKey: user.apiKey,
    message: t("auth:profile_info"),
  };
}

export async function flashController(
  ctx: AppContext & { body: { message: string | unknown }; params: { userId: string } },
) {
  const targetUserId = Number(ctx.params.userId);

  if (ctx.user.id !== targetUserId) {
    ctx.log.warn("Flash denied: unauthorized target");
    return new Response("Forbidden", { status: 403 });
  }

  const message = ctx.body.message;

  if (!message || typeof message !== "string") {
    return new Response("Invalid message", { status: 400 });
  }

  const sent = ctx.server?.publish(`flash:${targetUserId}`, JSON.stringify({ type: "flash", message }));
  // orr all
  // const sent =
  //   ctx.server?.publish(`flash:all`, JSON.stringify({ type: "flash", message }));

  if (sent === 0) {
    ctx.log.info(`Flash not delivered (no clients) for user ${targetUserId}`);
  } else {
    ctx.log.info(`Flash sent to user ${targetUserId}`);
  }

  return { success: true };
}
