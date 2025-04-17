// tests/ws.test.ts
import "dotenv/config";
import { describe, expect, it } from "vitest";
import WebSocket from "ws";

const WS_URL = process.env.PUBLIC_WS_URL ?? "ws://localhost:3000/ws";

describe("WebSocket", () => {
  it("should connect and receive broadcasted message", async () => {
    const messages: string[] = [];

    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(WS_URL);

      ws.on("open", () => {
        ws.send("Hello WS");
      });

      ws.on("message", (data) => {
        messages.push(data.toString());
        ws.close();
      });

      ws.on("close", () => {
        try {
          // сообщение приходит в виде "guest: Hello WS"
          expect(messages.some((msg) => msg.endsWith(": Hello WS"))).toBe(true);
          resolve();
        } catch (err) {
          reject(err);
        }
      });

      ws.on("error", reject);
    });
  });
});
