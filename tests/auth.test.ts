import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { guest, startServer } from "./server";

let server: Awaited<ReturnType<typeof startServer>>;
beforeAll(async () => {
  server = await startServer();
});
afterAll(() => server.stop());

const credentials = { email: "test@example.com", password: "secret123" };

describe("Auth API", () => {
  it("gives a new visitor a session and a CSRF cookie", async () => {
    const c = await guest(server.base);
    expect(c.cookie).toContain("sessionId=");
    expect(c.csrf()).not.toBe("");
  });

  it("registers a user and logs them in", async () => {
    const c = await guest(server.base);
    const res = await c.post("/api/guest/register", credentials);
    expect(res.status).toBe(200);
    expect((await res.json()).userId).toBeTypeOf("number");

    // the new session works right away, its rotated CSRF token included
    const profile = await c.get("/api/profile");
    expect(profile.status).toBe(200);
    expect((await profile.json()).email).toBe(credentials.email);
    expect((await c.post("/api/logout")).status).toBe(200);
  });

  it("rejects a duplicate email", async () => {
    const res = await (await guest(server.base)).post("/api/guest/register", credentials);
    expect(res.status).toBe(409);
  });

  it("rejects a request without the right CSRF token", async () => {
    const c = await guest(server.base);
    expect((await c.post("/api/guest/login", credentials, { "x-csrf-token": "wrong" })).status).toBe(403);
  });

  it("rejects a wrong password and an unknown email alike", async () => {
    const c = await guest(server.base);
    expect((await c.post("/api/guest/login", { ...credentials, password: "nope-nope" })).status).toBe(401);
    expect((await c.post("/api/guest/login", { ...credentials, email: "x@example.com" })).status).toBe(401);
  });

  it("logs in, reads the profile, logs out", async () => {
    const c = await guest(server.base);
    expect((await c.post("/api/guest/login", credentials)).status).toBe(200);
    expect((await c.get("/api/profile")).status).toBe(200);

    expect((await c.post("/api/logout", undefined, { "x-csrf-token": "wrong" })).status).toBe(403);
    expect((await c.post("/api/logout")).status).toBe(200);
    expect((await c.get("/api/profile")).status).toBe(401);
  });

  it("authenticates by API key", async () => {
    const c = await guest(server.base);
    await c.post("/api/guest/login", credentials);
    const { apiKey } = await (await c.get("/api/profile")).json();
    const res = await fetch(`${server.base}/api/profile`, { headers: { authorization: `Bearer ${apiKey}` } });
    expect(res.status).toBe(200);
  });

  it("refuses the profile to a guest", async () => {
    expect((await (await guest(server.base)).get("/api/profile")).status).toBe(401);
  });

  it("does not give SSR's anonymous API calls a session", async () => {
    const res = await fetch(`${server.base}/meta/health`, { headers: { "x-ssr-request": "1" } });
    expect(res.headers.getSetCookie()).toEqual([]);
  });
});

describe("Auth rate limit", () => {
  it("answers 429 after AUTH_RATE_LIMIT credential attempts per minute", async () => {
    const own = await startServer(); // fresh limiter
    try {
      const c = await guest(own.base);
      const statuses: number[] = [];
      // sequential on purpose: the limiter counts requests in order
      for (let i = 0; i < 11; i++) {
        // oxlint-disable-next-line no-await-in-loop
        statuses.push((await c.post("/api/guest/login", credentials)).status);
      }
      expect(statuses.slice(0, 10)).not.toContain(429);
      expect(statuses[10]).toBe(429);
    } finally {
      own.stop();
    }
  });
});
