import { validateCsrf } from "@/server/middleware/csrf";
import { randomUUIDv7 } from "bun";
import { eq } from "drizzle-orm";
// src/server/controllers/auth.ts
import { db } from "../db/init";
import { sessions } from "../models/session";
import bcrypt from "bcryptjs";
import { type User, users } from "../models/user";

export async function registerController(request: Request): Promise<Response> {
  if (!validateCsrf(request)) {
    return new Response("Invalid CSRF token", { status: 403 });
  }

  const { email, password } = await request.json();
  if (!email || !password) {
    return Response.json({ error: "Email and password required" }, { status: 400 });
  }

  const existing = db.select().from(users).where(eq(users.email, email)).get();
  if (existing) {
    return Response.json({ error: "User already exists" }, { status: 409 });
  }

  // const hash = await Bun.password.hash(password); // memory leek
  const hash = bcrypt.hashSync(password, 10);
  const apiKey = randomUUIDv7();

  const inserted = await db.insert(users).values({ email, passwordHash: hash, apiKey }).returning();
  const user = inserted[0];
  if (!user) return Response.json({ error: "Registration failed" }, { status: 500 });

  const sessionId = randomUUIDv7();
  const now = Date.now();
  const expiresAt = now + 1000 * 60 * 60 * 24; // 24h

  await db.insert(sessions).values({
    id: sessionId,
    userId: user.id,
    createdAt: new Date(now),
    expiresAt: new Date(expiresAt),
  });

  const headers = new Headers({
    "Set-Cookie": `sessionId=${sessionId}; Path=/; HttpOnly; Max-Age=86400`,
  });

  return new Response(JSON.stringify({ message: "Registered", userId: user.id }), { headers });
}

export async function loginController(request: Request): Promise<Response> {
  if (!validateCsrf(request)) {
    return new Response("Invalid CSRF token", { status: 403 });
  }

  const { email, password } = await request.json();
  const user = db.select().from(users).where(eq(users.email, email)).get();
  if (!user) return Response.json({ error: "Invalid credentials" }, { status: 401 });

  // const valid = await Bun.password.verify(password, user.passwordHash); // memory leek
  const valid = bcrypt.compareSync(password, user.passwordHash);
  if (!valid) return Response.json({ error: "Invalid credentials" }, { status: 401 });

  const sessionId = randomUUIDv7();
  const now = Date.now();
  const expiresAt = now + 1000 * 60 * 60 * 24; // 24h

  await db.insert(sessions).values({
    id: sessionId,
    userId: user.id,
    createdAt: new Date(now),
    expiresAt: new Date(expiresAt),
  });

  const headers = new Headers({
    "Set-Cookie": `sessionId=${sessionId}; Path=/; HttpOnly; Max-Age=86400`,
  });

  return new Response(JSON.stringify({ message: "Logged in" }), { headers });
  // return new Response(JSON.stringify({ message: "Logged in" }), {  });
}

export async function profileController(_: Request, context: { user: User }): Promise<Response> {
  const user = db.select().from(users).where(eq(users.id, context.user.id)).get();
  if (!user) return new Response("Not Found", { status: 404 });
  return Response.json({ email: user.email, apiKey: user.apiKey });
}

export async function logoutController(_: Request): Promise<Response> {
  const headers = new Headers({
    "Set-Cookie": "sessionId=; Path=/; HttpOnly; Max-Age=0",
  });

  return new Response(JSON.stringify({ message: "Logged out" }), { headers });
}
