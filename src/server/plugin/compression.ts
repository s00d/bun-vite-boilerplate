// src/server/plugin/compression.ts
import { Elysia } from "elysia";
import { brotliCompressSync, gzipSync, deflateSync } from "node:zlib";

export function compression() {
  return new Elysia({ name: "compressResponses" })
    .mapResponse(({ request, response, set }) => {
      const isJson = typeof response === "object";
      const acceptEncoding = request.headers.get("Accept-Encoding") ?? "";
      const text = isJson ? JSON.stringify(response) : (response?.toString() ?? "");

      if (text.length < 2048) {
        return response as Response;
      }

      let encoding: "br" | "gzip" | "deflate" | null = null;

      if (acceptEncoding.includes("br")) {
        encoding = "br";
      } else if (acceptEncoding.includes("gzip")) {
        encoding = "gzip";
      } else if (acceptEncoding.includes("deflate")) {
        encoding = "deflate";
      }

      if (!encoding) {
        return response as Response;
      }

      set.headers["Content-Encoding"] = encoding;

      const encoded = (() => {
        const encodedText = Buffer.from(text, "utf-8");
        switch (encoding) {
          case "br":
            return brotliCompressSync(encodedText);
          case "gzip":
            return gzipSync(encodedText);
          case "deflate":
            return deflateSync(encodedText);
        }
      })();

      return new Response(encoded, {
        headers: {
          "Content-Type": `${isJson ? "application/json" : "text/plain"}; charset=utf-8`,
        },
      });
    })
    .as("plugin");
}
