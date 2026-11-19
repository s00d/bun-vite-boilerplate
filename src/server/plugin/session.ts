// src/server/plugin/session.ts
import { Elysia } from "elysia";
import { SECURITY_CONFIG } from "../../../config/security.config";
import type { User } from "@/server/models/user";
import type { SessionData, SessionStore } from "@/server/services/session-store";

/**
 * Sent by SSR's own API calls (src/shared/axios.ts). Such a request without a session cookie
 * is an anonymous render and gets no guest session: otherwise every page view would store
 * a few throwaway sessions. Spoofing it only means "don't give me a session".
 */
export const SSR_REQUEST_HEADER = "x-ssr-request";

function bearer(header: string | null): string | null {
  const [type, token] = header?.split(" ") ?? [];
  return type === "Bearer" && token ? token : null;
}

/** Resolves the session (creating a guest one) and the user: by API key, else by session. */
export function sessionPlugin(store: SessionStore) {
  const secure = process.env.NODE_ENV === "production";

  return new Elysia({ name: "session" }).derive({ as: "global" }, async ({ request, cookie }) => {
    const sessionCookie = cookie[SECURITY_CONFIG.sessionCookieName];
    const csrfCookie = cookie[SECURITY_CONFIG.csrfCookieName];

    const issue = (s: SessionData) => {
      sessionCookie.set({
        value: s.id,
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure,
        maxAge: SECURITY_CONFIG.sessionMaxAge,
      });
      // Readable by the page: it sends the value back in the CSRF header.
      csrfCookie.set({
        value: s.csrfToken ?? "",
        path: "/",
        sameSite: "strict",
        secure,
        maxAge: SECURITY_CONFIG.sessionMaxAge,
      });
    };

    const id = typeof sessionCookie.value === "string" ? sessionCookie.value : undefined;
    let session = id ? await store.get(id) : null;
    if (!session && !request.headers.has(SSR_REQUEST_HEADER)) {
      session = store.createNew();
      await store.set(session);
      issue(session);
    }

    const apiKey = request.headers.get("x-api-key") ?? bearer(request.headers.get("authorization"));
    const user: User | null = apiKey
      ? await store.getUserByApiKey(apiKey)
      : session?.userId != null
        ? await store.getUser(session.userId)
        : null;

    return {
      session,
      user,
      /** The request carries this session's CSRF token in the header. */
      validateCsrf(): boolean {
        const token = request.headers.get(SECURITY_CONFIG.csrfHeaderName);
        return !!session?.csrfToken && token === session.csrfToken;
      },
      /** Replaces the current session with a new one for `userId` (login, register). */
      async startSession(userId: number): Promise<SessionData> {
        if (session) await store.delete(session.id);
        session = store.createNew(userId);
        await store.set(session);
        issue(session);
        return session;
      },
      async endSession(): Promise<void> {
        if (session) await store.delete(session.id);
        session = null;
        sessionCookie.remove();
        csrfCookie.remove();
      },
    };
  });
}
