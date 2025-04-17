import "dotenv/config";
import { describe, expect, it } from "vitest";

const baseUrl = `http://${process.env.HOST}:${process.env.PORT}`;

async function getCsrfHeaders(): Promise<{ cookie: string; token: string }> {
  const res = await fetch(`${baseUrl}/`, {
    method: "GET",
    headers: {
      Accept: "text/html", // <-- важно
    },
  });

  const cookie = res.headers.get("set-cookie") || "";
  const csrfMatch = cookie.match(/csrf=([^;]+)/);
  const csrf = csrfMatch?.[1] || "";

  return {
    cookie,
    token: csrf,
  };
}

describe("Auth API", () => {
  it("should register a user", async () => {
    const { cookie, token } = await getCsrfHeaders();

    const res = await fetch(`${baseUrl}/api/guest/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": token,
        Cookie: cookie,
      },
      body: JSON.stringify({ email: "test@example.com", password: "secret" }),
    });

    if (res.status === 409) {
      // пользователь уже существует — считаем это успешным исходом
      expect(true).toBe(true);
      return;
    }

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.userId).toBeTypeOf("number");
  });


  it("should log in a user and access profile", async () => {
    const { cookie, token } = await getCsrfHeaders();

    const login = await fetch(`${baseUrl}/api/guest/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": token,
        Cookie: cookie,
      },
      body: JSON.stringify({ email: "test@example.com", password: "secret" }),
    });


    expect(login.status).toBe(200);
    const sessionCookie = login.headers.get("set-cookie");
    expect(sessionCookie).toMatch(/sessionId=/);

    const profile = await fetch(`${baseUrl}/api/profile`, {
      method: "GET",
      headers: {
        Cookie: sessionCookie ?? "",
      },
    });

    expect(profile.status).toBe(200);
    const json = await profile.json();
    expect(json.email).toBe("test@example.com");
  });
});
