import { and, eq, gt } from "drizzle-orm";
// src/server/middleware/auth.ts
import { db } from "../db/init";
import { sessions } from "../models/session";
import { type User, users } from "../models/user";
import { SECURITY_CONFIG } from "../../../config/security.config";

export async function authorize(request: Request): Promise<{ user: User | null }> {
  return getUserFromHeaders({
    cookie: request.headers.get("cookie"),
    authorization: request.headers.get("authorization"),
    apiKey: request.headers.get("x-api-key"),
  });
}

export async function getUserFromHeaders(headers: {
  cookie?: string | null;
  authorization?: string | null;
  apiKey?: string | null;
}): Promise<{ user: User | null }> {
  const cookies = parseCookies(headers.cookie);
  const sessionId = cookies[SECURITY_CONFIG.sessionCookieName];

  if (sessionId) {
    const now = new Date();
    const session = db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, now)))
      .get();
    if (session) {
      const user = db.select().from(users).where(eq(users.id, session.userId)).get();
      if (user) return { user };
    }
  }

  const apiKey = headers.apiKey || extractBearerToken(headers.authorization);
  if (apiKey) {
    const user = db.select().from(users).where(eq(users.apiKey, apiKey)).get();
    if (user) return { user };
  }

  return { user: null };
}

function extractBearerToken(header: string | null | undefined): string | null {
  if (!header) return null;
  const [type, token] = header.split(" ");
  return type === "Bearer" ? token : null;
}

function parseCookies(cookieHeader: string | null | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  return Object.fromEntries(cookieHeader.split("; ").map((s) => s.split("=")));
}
