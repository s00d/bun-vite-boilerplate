// Starts the real API server in-process on a free port, against a throwaway in-memory DB
// with the default (db) session storage.
import { SECURITY_CONFIG } from "../config/security.config";

process.env.DB_FILE_NAME = ":memory:";
process.env.LOG_LEVEL ??= "silent";

const { createApp } = await import("../src/server/app");

export async function startServer() {
  const app = (await createApp({ ssr: false })).listen({ port: 0, hostname: "127.0.0.1" });
  if (!app.server) throw new Error("server did not start");
  const url = app.server.url; // http://127.0.0.1:<port>/
  return {
    base: url.origin,
    ws: `ws://${url.host}/ws`,
    stop: () => app.stop(true),
  };
}

/** `Set-Cookie` headers → one `Cookie` request header (removed cookies dropped). */
export function cookieHeader(res: Response, prev = ""): string {
  const jar = new Map(
    prev
      .split("; ")
      .filter(Boolean)
      .map((c) => [c.slice(0, c.indexOf("=")), c.slice(c.indexOf("=") + 1)] as const),
  );
  for (const c of res.headers.getSetCookie()) {
    const [pair] = c.split(";");
    const name = pair.slice(0, pair.indexOf("="));
    const value = pair.slice(pair.indexOf("=") + 1);
    if (value && !/max-age=0|expires=thu, 01 jan 1970/i.test(c)) jar.set(name, value);
    else jar.delete(name);
  }
  return [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
}

/** A browser-like client: keeps cookies, sends the CSRF cookie back in the header. */
export function client(base: string) {
  let cookie = "";
  const csrf = () => cookie.match(new RegExp(`(?:^|; )${SECURITY_CONFIG.csrfCookieName}=([^;]+)`))?.[1] ?? "";
  const request = async (path: string, init: RequestInit = {}) => {
    const headers = new Headers(init.headers);
    if (cookie) headers.set("cookie", cookie);
    if (init.method && init.method !== "GET" && !headers.has(SECURITY_CONFIG.csrfHeaderName))
      headers.set(SECURITY_CONFIG.csrfHeaderName, csrf());
    const res = await fetch(base + path, { ...init, headers });
    cookie = cookieHeader(res, cookie);
    return res;
  };
  return {
    get cookie() {
      return cookie;
    },
    csrf,
    get: (path: string) => request(path),
    post: (path: string, body?: unknown, headers?: Record<string, string>) =>
      request(path, {
        method: "POST",
        headers: { "content-type": "application/json", ...headers },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
  };
}

/** A new guest that has loaded a page (got its session and CSRF cookies). */
export async function guest(base: string) {
  const c = client(base);
  await c.get("/meta/health");
  return c;
}
