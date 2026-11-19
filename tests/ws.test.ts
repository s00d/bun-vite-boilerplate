import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { client, guest, startServer } from "./server";

let server: Awaited<ReturnType<typeof startServer>>;
beforeAll(async () => {
  server = await startServer();
});
afterAll(() => server.stop());

/** Opens a socket with `cookie`, resolves with its first message (or close code). */
function firstEvent(url: string, cookie: string, send?: string) {
  const ws = new WebSocket(url, { headers: { cookie } } as never);
  return new Promise<{ message?: string; code?: number }>((resolve, reject) => {
    ws.onopen = () => send && ws.send(send);
    ws.onmessage = (e) => {
      resolve({ message: String(e.data) });
      ws.close();
    };
    ws.onclose = (e) => resolve({ code: e.code });
    ws.onerror = () => reject(new Error("ws error"));
  });
}

describe("WebSocket", () => {
  it("echoes a guest's chat message", async () => {
    const { message } = await firstEvent(server.ws, "", JSON.stringify({ message: "Hello WS" }));
    expect(message).toBe("guest: Hello WS");
  });

  it("signs a logged-in user's message with their email", async () => {
    const c = await guest(server.base);
    expect((await c.post("/api/guest/register", { email: "ws@example.com", password: "secret123" })).status).toBe(200);
    const { message } = await firstEvent(server.ws, c.cookie, JSON.stringify({ message: "hi" }));
    expect(message).toBe("ws@example.com: hi");
  });

  it("delivers a flash to the user's flash socket", async () => {
    const c = await guest(server.base);
    const reg = await c.post("/api/guest/register", { email: "flash@example.com", password: "secret123" });
    const { userId } = await reg.json();

    const ws = new WebSocket(`${server.ws}/flash`, { headers: { cookie: c.cookie } } as never);
    const got = new Promise<string>((resolve) => {
      ws.onmessage = (e) => resolve(String(e.data));
    });
    await new Promise((resolve) => {
      ws.onopen = resolve;
    });
    expect((await c.post(`/api/flash/${userId}`, { message: "ping" })).status).toBe(200);
    expect(JSON.parse(await got)).toEqual({ type: "flash", message: "ping" });
    ws.close();
  });

  it("closes the flash socket for a guest", async () => {
    const { code } = await firstEvent(`${server.ws}/flash`, client(server.base).cookie);
    expect(code).toBe(4401);
  });
});
