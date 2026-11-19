import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import type { ViteDevServer } from "vite";
import { loadRenderer, type Renderer } from "../src/server/plugin/vite-ssr";
import { guest, startServer } from "./server";

// Real SSR (Vite dev renderer) against the real API: pages fetch /api/profile while rendering.
let server: Awaited<ReturnType<typeof startServer>>;
let renderer: Renderer;
let userCookie: string;
const email = "ssr@example.com";

beforeAll(async () => {
  server = await startServer();
  process.env.PUBLIC_API_URL = server.base; // read by src/shared/axios when Vite loads it
  process.env.VITE_PORT = "0";
  renderer = await loadRenderer({ dev: true });

  const c = await guest(server.base);
  expect((await c.post("/api/guest/register", { email, password: "secret123" })).status).toBe(200);
  userCookie = c.cookie;
}, 30_000);

afterAll(async () => {
  await (await (globalThis as { __viteDevServer?: Promise<ViteDevServer> }).__viteDevServer)?.close();
  server.stop();
});

const page = async (cookie?: string, url = "/") =>
  (await renderer.render(url, new Headers(cookie ? { cookie } : {}))).html;

describe("SSR", () => {
  it("renders the logged-in user into their own page", async () => {
    expect(await page(userCookie)).toContain(email);
  });

  it("does not hand a user's cookie to the next anonymous render", async () => {
    await page(userCookie);
    const anon = await page();
    expect(anon).not.toContain(email);
    expect(anon).toContain('"user":null');
  });

  it("keeps concurrent renders apart", async () => {
    const pages = await Promise.all(Array.from({ length: 10 }, (_, i) => page(i % 2 ? userCookie : undefined)));
    pages.forEach((html, i) => {
      if (i % 2) expect(html).toContain(email);
      else expect(html).not.toContain(email);
    });
  });

  it("answers 404 for an unknown page", async () => {
    expect((await renderer.render("/no/such/page", new Headers())).status).toBe(404);
    expect((await renderer.render("/about", new Headers())).status).toBe(200);
  });

  it("renders the URL's locale with its route dictionary and sends it to the client", async () => {
    const ru = await page(undefined, "/ru");
    expect(ru).toContain("Главная страница");
    expect(ru).toContain('<html lang="ru"');
    expect(ru).toContain('window.__i18n = {"locale":"ru","route":"home"');
    expect(await page(undefined, "/")).toContain("Home Page");
  });

  it("leaves the env slot for the server to fill", async () => {
    expect(await page()).toContain("<!--ssr-env-->");
  });
});
