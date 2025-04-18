// src/server/routes/ssr.ts
import { Elysia } from "elysia";
import { resolve } from "node:path";
import { generateCsrfToken } from "@/server/middleware/csrf";
import vue from "@vitejs/plugin-vue";
import type { IncomingMessage, ServerResponse } from "node:http";

const STATIC_DIR = resolve(process.cwd(), "./dist/static");
const CLIENT_DIR = resolve(process.cwd(), "./dist/client");

let renderer: (
  url: string,
  headers: Headers,
  manifest: Record<string, string[]>
) => Promise<{
  html: string;
  state: string;
  preloadLinks: string;
  env: Record<string, string>;
  headTags: string;
}>;
let manifest: Record<string, string[]>;
let template: string;
let viteMiddleware: ((req: IncomingMessage, res: ServerResponse, next: () => void) => void) | null = null;

const encoder = new TextEncoder();

function adaptNodeMiddleware(middleware: (req: any, res: any, next: () => void) => void) {
  return async (request: Request): Promise<Response> => {
    return await new Promise<Response>((resolve) => {
      const url = new URL(request.url);

      const req = {
        url: url.pathname + url.search,
        originalUrl: url.pathname + url.search,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        socket: {},
        connection: {},
      } as any;

      const chunks: Uint8Array[] = [];
      const headers: Record<string, string> = {};
      let statusCode = 200;
      let resolved = false;

      const res = {
        statusCode,
        setHeader(key: string, value: string) {
          headers[key.toLowerCase()] = value;
        },
        getHeader(key: string) {
          return headers[key.toLowerCase()];
        },
        writeHead(code: number, h: Record<string, string>) {
          statusCode = code;
          Object.assign(headers, h);
        },
        write(chunk: any) {
          chunks.push(typeof chunk === "string" ? encoder.encode(chunk) : chunk);
        },
        end(chunk?: any) {
          if (resolved) return;
          if (chunk) res.write(chunk);

          const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
          const body = new Uint8Array(totalLength);
          let offset = 0;
          for (const c of chunks) {
            body.set(c, offset);
            offset += c.length;
          }

          resolved = true;
          resolve(
            new Response(body, {
              status: res.statusCode || statusCode,
              headers,
            })
          );
        },
      };

      middleware(req, res, () => {
        if (!resolved) {
          resolved = true;
          resolve(new Response("Not found", { status: 404 }));
        }
      });
    });
  };
}

if (process.env.NODE_ENV === "production") {
  template = await Bun.file(resolve(process.cwd(), "./dist/client/index.html")).text();
  manifest = await import(resolve(process.cwd(), "./dist/server/.vite/ssr-manifest.json")).then((m) => m.default);
  const mod = await import(resolve(process.cwd(), "./dist/server/entry-server.js"));
  renderer = mod.render;
} else {
  const { createServer } = await import("vite");
  const vite = await createServer({
    root: "./",
    base: "/",
    server: {
      middlewareMode: true,
      cors: true,
      port: 64788,
    },
    resolve: {
      alias: {
        "@": resolve(process.cwd(), "./src"),
      },
    },
    appType: "custom",
    plugins: [vue()],
  });
  viteMiddleware = vite.middlewares;
  manifest = {};

  await new Promise((r) => setTimeout(r, 300));
  const htmlRaw = await Bun.file(resolve(process.cwd(), "./index.html")).text();
  template = await vite.transformIndexHtml("/", htmlRaw);
  const mod = await vite.ssrLoadModule(resolve(process.cwd(), "./src/client/entry-server.ts"));
  renderer = mod.render;
}

const isStaticFile = (path: string) =>
  path.startsWith("/assets/") ||
  path === "/favicon.ico" ||
  /\.(js|css|map|png|jpg|jpeg|svg|webp|woff2?|ttf)$/.test(path);

export const ssr = new Elysia().get("*", async ({ request, set }) => {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (
    pathname.startsWith("/@vite/") ||
    pathname.startsWith("/src/") ||
    pathname.startsWith("/node_modules/") ||
    pathname.startsWith("/@id/") ||
    pathname.match(/\.(js|ts|jsx|tsx|css|json|map|svg|png|jpg|jpeg|gif|webp|woff2?|ttf)$/)
  ) {
    if (viteMiddleware) {
      return await adaptNodeMiddleware(viteMiddleware)(request);
    } else {
      const filePath = resolve(process.cwd(), `./dist/client${pathname}`);
      const file = Bun.file(filePath);
      if (await file.exists()) {
        return new Response(file, {
          headers: { "Content-Type": file.type || "application/octet-stream" },
        });
      }
    }
    return new Response("Not found", { status: 404 });
  }

  if (process.env.NODE_ENV === "production") {
    try {
      if (isStaticFile(pathname)) {
        const filePath = resolve(CLIENT_DIR, ".", pathname);
        const file = Bun.file(filePath);
        if (await file.exists()) {
          set.headers["Content-Type"] = file.type || "application/octet-stream";
          return file;
        } else {
          return new Response("Not found", { status: 404 });
        }
      }

      const htmlFilePath = resolve(STATIC_DIR, pathname === "/" ? "index.html" : `${pathname}.html`);
      const staticHtml = Bun.file(htmlFilePath);
      if (await staticHtml.exists()) {
        set.headers["Content-Type"] = "text/html";
        set.headers["Set-Cookie"] = `csrf=${generateCsrfToken()}; Path=/; SameSite=Strict`;
        return staticHtml;
      }
    } catch (err) {
      console.error("Static render error:", err);
    }
  }

  try {
    const { env, html, state, preloadLinks, headTags } = await renderer(pathname, request.headers, manifest);

    const fullHtml = template
      .replace("<!--preload-links-->", preloadLinks)
      .replace("<!--ssr-outlet-->", html)
      .replace("<!--head-tags-->", headTags)
      .replace("<!--pinia-state-->", `window.__pinia = ${state}`)
      .replace("<!--ssr-env-->", `<script>window.__env = ${JSON.stringify(env)}</script>`);

    set.headers["Content-Type"] = "text/html";
    set.headers["Set-Cookie"] = `csrf=${generateCsrfToken()}; Path=/; SameSite=Strict`;
    return fullHtml;
  } catch (err) {
    console.error("SSR render error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
});
