// src/server/controllers/auth.ts
import { validateCsrf } from "@/server/middleware/csrf";
import { db } from "@/server/db/init";
import { sessions } from "@/server/models/session";
import { users, type User } from "@/server/models/user";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "../../../config/security.config";
import { eq } from "drizzle-orm";
import { randomUUIDv7 } from "bun";
import bcrypt from "bcryptjs";
import type { Context } from "elysia";

export interface AuthBody {
  email: string;
  password: string;
}

export async function registerController({ body, request, set }: Context<{ body: AuthBody }>) {
  if (!validateCsrf(request)) {
    set.status = 403;
    return { error: "Invalid CSRF token" };
  }

  const { email, password } = body;
  const existing = db.select().from(users).where(eq(users.email, email)).get();
  if (existing) {
    set.status = 409;
    return { error: "User already exists" };
  }

  const hash = bcrypt.hashSync(password, 10);
  const apiKey = randomUUIDv7();

  const inserted = await db
    .insert(users)
    .values({ email, passwordHash: hash, apiKey })
    .returning();
  const user = inserted[0];
  if (!user) {
    set.status = 500;
    return { error: "Registration failed" };
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

  set.headers["Set-Cookie"] = `${SESSION_COOKIE_NAME}=${sessionId}; Path=/; HttpOnly; Max-Age=${SESSION_MAX_AGE}`;
  return { message: "Registered", userId: user.id };
}

export async function loginController({ body, request, set }: Context<{ body: AuthBody }>) {
  if (!validateCsrf(request)) {
    set.status = 403;
    return { error: "Invalid CSRF token" };
  }

  const { email, password } = body;
  const user = db.select().from(users).where(eq(users.email, email)).get();
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    set.status = 401;
    return { error: "Invalid credentials" };
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

  set.headers["Set-Cookie"] = `${SESSION_COOKIE_NAME}=${sessionId}; Path=/; HttpOnly; Max-Age=${SESSION_MAX_AGE}`;
  return { message: "Logged in" };
}

export async function logoutController({ set }: Context) {
  set.headers["Set-Cookie"] = `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0`;
  return { message: "Logged out" };
}


export async function profileController({ user }: { user: User }) {
  return {
    email: user.email,
    apiKey: user.apiKey,
  };
}
