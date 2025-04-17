// src/server/routes/router.ts
import type { IncomingMessage, ServerResponse } from "node:http";
import { resolve } from "node:path";
import { generateCsrfToken } from "@/server/middleware/csrf";
import vue from "@vitejs/plugin-vue";
import { authorize } from "../middleware/auth";
import { guestRoutes } from "./guest";
import { protectedRoutes } from "./protected";

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
  // manifest = await import(resolve(process.cwd(), './dist/client/manifest.json')).then(m => m.default);
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
  const html = await Bun.file(resolve(process.cwd(), "./index.html")).text();
  template = await vite.transformIndexHtml("/", html);
  manifest = {}; // пустой, для dev режима
  const mod = await vite.ssrLoadModule(resolve(process.cwd(), "./src/client/entry-server.ts"));
  renderer = mod.render;
}

const encoder = new TextEncoder();

export async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (pathname.startsWith("/api/guest")) {
    return guestRoutes(request);
  }

  if (pathname.startsWith("/api/")) {
    const auth = await authorize(request);
    if (!auth.user) {
      return new Response("Unauthorized", { status: 401 });
    }
    return protectedRoutes(request, { user: auth.user });
  }

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
    }

    return response;
  }

  const accept = request.headers.get("accept") || "";
  const isHtmlRequest = accept.includes("text/html");

  if (!isHtmlRequest) {
    return new Response("Not found", { status: 404 });
  }

  // SSR
  const { env, html, state, preloadLinks, headTags } = await renderer(new URL(request.url).pathname, request.headers, manifest);
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
