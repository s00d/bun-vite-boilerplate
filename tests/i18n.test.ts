import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { guest, startServer } from "./server";

let server: Awaited<ReturnType<typeof startServer>>;
beforeAll(async () => {
  server = await startServer();
});
afterAll(() => server.stop());

describe("i18n API", () => {
  it("serves a page's dictionaries with the fallback locale", async () => {
    const res = await fetch(`${server.base}/api/i18n?locale=ru&route=home`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ru.route.title).toBe("Главная страница");
    expect(data.en.route.title).toBe("Home Page");
    expect(data.ru.root.auth.registered).toBeTypeOf("string");
  });

  it("serves only the default locale for itself", async () => {
    const data = await (await fetch(`${server.base}/api/i18n?locale=en&route=profile`)).json();
    expect(Object.keys(data)).toEqual(["en"]);
    expect(data.en.route.title).toBe("Your Profile");
  });

  it("returns empty route dictionaries for a page without one", async () => {
    const data = await (await fetch(`${server.base}/api/i18n?locale=en&route=chat`)).json();
    expect(data.en.route).toEqual({});
  });

  it("rejects an unknown locale", async () => {
    expect((await fetch(`${server.base}/api/i18n?locale=xx`)).status).toBe(404);
  });

  it("answers API messages in the request's language", async () => {
    const ru = await (
      await fetch(`${server.base}/meta/health`, { headers: { "accept-language": "ru-RU,ru;q=0.9" } })
    ).json();
    const en = await (
      await fetch(`${server.base}/meta/health?lng=en`, { headers: { "accept-language": "ru" } })
    ).json();
    expect(ru.message).not.toBe(en.message);
    expect(en.message).toBe("Server is healthy");
  });

  it("keeps concurrent requests in their own language", async () => {
    const c = await guest(server.base);
    const answers = await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        c
          .post(
            "/api/guest/login",
            { email: "x@example.com", password: "whatever1" },
            { "accept-language": i % 2 ? "ru" : "en" },
          )
          .then((r) => r.json()),
      ),
    );
    const en = answers.filter((_, i) => i % 2 === 0).map((a) => a.error);
    const ru = answers.filter((_, i) => i % 2 === 1).map((a) => a.error);
    expect(new Set(en).size).toBe(1);
    expect(new Set(ru).size).toBe(1);
    expect(en[0]).not.toBe(ru[0]);
  });
});
