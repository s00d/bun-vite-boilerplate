import { readdirSync } from "node:fs";
// src/server/routes/router.ts
import type { IncomingMessage, ServerResponse } from "node:http";
import { join, resolve, sep } from "node:path";
import { generateCsrfToken } from "@/server/middleware/csrf";
import { guestRoutes } from "@/server/routes/guest";
import { metaRoute } from "@/server/routes/meta";
import vue from "@vitejs/plugin-vue";
import type { BunFile } from "bun";
import { authorize } from "../middleware/auth";
import { protectedRoute } from "./protected";

const PUBLIC_DIR = join(process.cwd(), "./public");

let renderer: (
  url: string,
  headers: Headers,
  manifest: Record<string, string[]>,
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

function adaptNodeMiddleware(middleware: (req: any, res: any, next: () => void) => void) {
  return async (request: Request): Promise<Response> => {
    return await new Promise<Response>((resolve) => {
      const url = new URL(request.url);

      const req = {
        url: url.pathname + url.search,
        originalUrl: url.pathname + url.search,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        socket: {}, // vite может его дергать
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
            }),
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
  manifest = {}; // пустой, для dev режима

  await new Promise((r) => setTimeout(r, 300));
  const htmlRaw = await Bun.file(resolve(process.cwd(), "./index.html")).text();
  template = await vite.transformIndexHtml("/", htmlRaw);
  const mod = await vite.ssrLoadModule(resolve(process.cwd(), "./src/client/entry-server.ts"));
  renderer = mod.render;
}

const encoder = new TextEncoder();

type BunRouteHandler = (request: Bun.BunRequest) => Response | Promise<Response>;

interface RouteEntry {
  method: string;
  path: string;
  handler: BunRouteHandler;
}

function walkStaticFiles(dir: string, base = ""): [string, BunFile][] {
  const entries: [string, BunFile][] = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    const relativePath = join(base, entry.name);

    if (entry.isDirectory()) {
      entries.push(...walkStaticFiles(fullPath, relativePath));
    } else {
      const pathKey = `/${relativePath.split(sep).join("/")}`;
      entries.push([pathKey, Bun.file(fullPath)]);
    }
  }

  return entries;
}

export async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // ✅ Production SSR
  if (process.env.NODE_ENV === "production") {
    try {
      const staticPrefix = "/assets/";
      if (
        pathname.startsWith(staticPrefix) ||
        pathname === "/favicon.ico" ||
        pathname.match(/\.(js|css|map|png|jpg|jpeg|svg|webp|woff2?|ttf)$/)
      ) {
        try {
          const filePath = resolve(process.cwd(), `./dist/client${pathname}`);
          const file = Bun.file(filePath);
          if (await file.exists()) {
            return new Response(file, {
              headers: { "Content-Type": file.type || "application/octet-stream" },
            });
          }
        } catch (err) {
          console.error("Static file error:", err);
        }
        return new Response("Not found", { status: 404 });
      }

      const staticFile = Bun.file(
        resolve(process.cwd(), `./dist/static${pathname === "/" ? "/index" : pathname}.html`),
      );
      if (await staticFile.exists()) {
        const csrfToken = generateCsrfToken();
        const headers = new Headers();
        headers.set("Content-Type", "text/html");
        headers.set("Set-Cookie", `csrf=${csrfToken}; Path=/; SameSite=Strict`);
        return new Response(staticFile, { headers });
      }

      const { env, html, state, preloadLinks, headTags } = await renderer(url.pathname, request.headers, manifest);
      const fullHtml = template
        .replace("<!--preload-links-->", preloadLinks)
        .replace("<!--ssr-outlet-->", html)
        .replace("<!--head-tags-->", headTags)
        .replace("<!--pinia-state-->", `window.__pinia = ${state}`)
        .replace("<!--ssr-env-->", `<script>window.__env = ${JSON.stringify(env)}</script>`);

      const csrfToken = generateCsrfToken();
      const respHeaders = new Headers();
      respHeaders.set("Set-Cookie", `csrf=${csrfToken}; Path=/; SameSite=Strict`);
      respHeaders.set("Content-Type", "text/html");
      return new Response(fullHtml, {
        headers: respHeaders,
      });
    } catch (err: any) {
      console.error("SSR render error:", err);
      return new Response("Internal Server Error", { status: 500 });
    }
  }

  if (
    viteMiddleware &&
    (pathname.startsWith("/@vite/") ||
      pathname.startsWith("/src/") ||
      pathname.startsWith("/node_modules/") ||
      pathname.startsWith("/@id/") ||
      pathname.match(/\.(js|ts|jsx|tsx|css|json|map|svg|png|jpg|jpeg|gif|webp|woff2?|ttf)$/))
  ) {
    const response = await adaptNodeMiddleware(viteMiddleware)(request);

    // Vite может вернуть 404 без тела
    if (response.status === 404) {
      console.warn(`Vite bad url ${pathname}`);
      return new Response("Not found", { status: 404 });
    }

    return response;
  }

  const accept = request.headers.get("accept") || "";
  const isHtmlRequest = accept.includes("text/html");

  if (!isHtmlRequest) {
    return new Response("Not found", { status: 404 });
  }

  // SSR
  const { env, html, state, preloadLinks, headTags } = await renderer(
    new URL(request.url).pathname,
    request.headers,
    manifest,
  );
  const fullHtml = template
    .replace("<!--preload-links-->", preloadLinks)
    .replace("<!--ssr-outlet-->", html)
    .replace("<!--head-tags-->", headTags)
    .replace("<!--pinia-state-->", `window.__pinia = ${state}`)
    .replace("<!--ssr-env-->", `<script>window.__env = ${JSON.stringify(env)}</script>`);

  const csrfToken = generateCsrfToken();
  const respHeaders = new Headers();
  respHeaders.set("Set-Cookie", `csrf=${csrfToken}; Path=/; SameSite=Strict`);
  respHeaders.set("Content-Type", "text/html");
  return new Response(fullHtml, {
    headers: respHeaders,
  });
}

export function generateRoutes(): Record<string, BunRouteHandler> {
  const routes: RouteEntry[] = [];

  for (const [path, methods] of Object.entries(metaRoute)) {
    for (const [method, handler] of Object.entries(methods)) {
      routes.push({
        method,
        path,
        handler,
      });
    }
  }
  for (const [path, methods] of Object.entries(guestRoutes)) {
    for (const [method, handler] of Object.entries(methods)) {
      routes.push({
        method,
        path,
        handler,
      });
    }
  }

  for (const [path, methods] of Object.entries(protectedRoute)) {
    for (const [method, handler] of Object.entries(methods)) {
      routes.push({
        method,
        path,
        handler: async (req) => {
          const auth = await authorize(req);
          if (!auth.user) {
            return new Response("Unauthorized", { status: 401 });
          }

          return handler(req, { user: auth.user });
        },
      });
    }
  }

  for (const [path, file] of walkStaticFiles(PUBLIC_DIR)) {
    routes.push({
      method: "GET",
      path,
      handler: () =>
        new Response(file, {
          headers: { "Content-Type": file.type || "application/octet-stream" },
        }),
    });
  }

  // Convert to Bun.serve() style
  const finalRoutes: Record<string, BunRouteHandler> = {};

  for (const route of routes) {
    finalRoutes[route.path] = route.handler;
  }

  return finalRoutes;
}
