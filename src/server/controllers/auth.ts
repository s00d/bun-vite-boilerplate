// src/server/controllers/auth.ts
import { randomUUIDv7 } from "bun";
import { eq } from "drizzle-orm";
import type { AppContext } from "@/server/context";
import { db } from "@/server/db/init";
import { type User, users } from "@/server/models/user";

export interface AuthBody {
  email: string;
  password: string;
}

// bcrypt: existing hashes keep working (Bun.password.verify reads them), hashing is off the event loop.
const hash = (password: string) => Bun.password.hash(password, { algorithm: "bcrypt", cost: 10 });
// Unknown emails are verified against this, so the response time does not reveal which emails exist.
const DUMMY_HASH = await hash(randomUUIDv7());

type Ctx = Pick<AppContext, "set" | "log" | "t" | "validateCsrf" | "startSession">;

export async function registerController({ body, set, log, t, validateCsrf, startSession }: Ctx & { body: AuthBody }) {
  if (!validateCsrf()) {
    set.status = 403;
    return { error: t("auth:invalid_csrf") };
  }

  const { email, password } = body;
  if (db.select({ id: users.id }).from(users).where(eq(users.email, email)).get()) {
    set.status = 409;
    return { error: t("auth:user_exists") };
  }

  const [user] = await db
    .insert(users)
    .values({ email, passwordHash: await hash(password), apiKey: randomUUIDv7() })
    .returning();
  if (!user) {
    log.error({ email }, "Registration failed: DB insert returned empty");
    set.status = 500;
    return { error: t("auth:registration_failed") };
  }

  await startSession(user.id);
  log.info({ userId: user.id }, "User registered");
  return { message: t("auth:registered"), userId: user.id };
}

export async function loginController({ body, set, log, t, validateCsrf, startSession }: Ctx & { body: AuthBody }) {
  if (!validateCsrf()) {
    set.status = 403;
    return { error: t("auth:invalid_csrf") };
  }

  const user = db.select().from(users).where(eq(users.email, body.email)).get();
  const ok = await Bun.password.verify(body.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) {
    log.warn("Login failed");
    set.status = 401;
    return { error: t("auth:invalid_credentials") };
  }

  await startSession(user.id);
  log.info({ userId: user.id }, "User logged in");
  return { message: t("auth:login_success") };
}

export async function logoutController({
  set,
  t,
  validateCsrf,
  endSession,
}: Pick<AppContext, "set" | "t" | "validateCsrf" | "endSession">) {
  if (!validateCsrf()) {
    set.status = 403;
    return { error: t("auth:invalid_csrf") };
  }
  await endSession();
  return { message: t("auth:logout_success") };
}

export function profileController({ user, t }: { user: User; t: AppContext["t"] }) {
  return { id: user.id, email: user.email, apiKey: user.apiKey, message: t("auth:profile_info") };
}

export function flashController({
  user,
  body,
  params,
  set,
  log,
  t,
  server,
  validateCsrf,
}: Pick<AppContext, "set" | "log" | "t" | "server" | "validateCsrf"> & {
  user: User;
  body: { message: string };
  params: { userId: string };
}) {
  if (!validateCsrf()) {
    set.status = 403;
    return { error: t("auth:invalid_csrf") };
  }
  if (String(user.id) !== params.userId) {
    set.status = 403;
    return { error: "Forbidden" };
  }

  const sent = server?.publish(`flash:${user.id}`, JSON.stringify({ type: "flash", message: body.message }));
  log.info({ userId: user.id, delivered: !!sent }, "Flash");
  return { success: true };
}
