// src/server/plugins/session.ts
import { Elysia } from "elysia";
import { SECURITY_CONFIG } from "../../../config/security.config";
import { SessionStore } from "@/server/services/session-store";
import { parseCookies } from "@/server/utils/parse-cookies";
import { randomUUIDv7 } from "bun";
import { db } from "@/server/db/init";
import { users } from "@/server/models/user";
import { eq } from "drizzle-orm";

function extractBearerToken(header: string | null | undefined): string | null {
  if (!header) return null;
  const [type, token] = header.split(" ");
  return type === "Bearer" ? token : null;
}

export function sessionPlugin() {
  const sessionStore = new SessionStore(process.env.SESSION_STORAGE as any);

  return new Elysia({ name: "session" })
    .derive(async ({ request, set, cookie }) => {

      const headers = request.headers;
      const cookies = parseCookies(headers.get("cookie") ?? "");
      const sessionId = cookies[SECURITY_CONFIG.sessionCookieName];

      let session = sessionId ? await sessionStore.get(sessionId) : null;
      let user = session?.userId ? await sessionStore.getUser(session.userId) : null;

      // Попытка авторизации по API-ключу (приоритет выше сессии)
      const apiKey = headers.get("x-api-key") || extractBearerToken(headers.get("authorization"));
      if (apiKey) {
        user = db.select().from(users).where(eq(users.apiKey, apiKey)).get() ?? null;
      }

      // Если нет валидной сессии — создаём новую гостевую
      if (!session) {
        session = sessionStore.createNew();
        await sessionStore.set(session);

        cookie[SECURITY_CONFIG.sessionCookieName].set({
          value: session.id,
          httpOnly: true,
          path: "/",
          maxAge: SECURITY_CONFIG.sessionMaxAge,
        });

        cookie[SECURITY_CONFIG.csrfCookieName].set({
          value: session.csrfToken,
          path: "/",
          sameSite: "strict",
        });
      }

      const csrfHeader = headers.get(SECURITY_CONFIG.csrfHeaderName) ?? null;

      return {
        session,
        sessionStore,
        sessionId: session.id,
        csrfToken: session.csrfToken,
        user,
        validateCsrf(): boolean {
          return session.csrfToken !== null && csrfHeader !== null && session.csrfToken === csrfHeader;
        },
        getCsrfToken(): string {
          return randomUUIDv7();
        },
      };
    })
    .as("plugin");
}
