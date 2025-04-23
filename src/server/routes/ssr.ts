import { Elysia } from "elysia";
import { join } from "node:path";

const STATIC_DIR = join(process.cwd(), "./dist/static");
const CLIENT_DIR = join(process.cwd(), "./dist/client");

let renderer: ((url: string, headers: Headers, manifest: Record<string, string[]>) => Promise<any>) | null = null;
let manifest: Record<string, string[]> = {};
let template = "";

if (process.env.NODE_ENV === "production") {
  const htmlPath = join(CLIENT_DIR, "index.html");
  template = await Bun.file(htmlPath).text();
  manifest = await import(join(process.cwd(), "./dist/server/.vite/ssr-manifest.json")).then((m) => m.default);
  const mod = await import(join(process.cwd(), "./dist/server/entry-server.js"));
  renderer = mod.render;
}

const fileCache = new Map<string, Bun.BunFile>();

const isStaticFile = (path: string) =>
  path.startsWith("/assets/") ||
  path === "/favicon.ico" ||
  /\.(js|css|map|png|jpg|jpeg|svg|webp|woff2?|ttf|ico)$/.test(path);

export const ssr = new Elysia();

ssr.get("*", async ({ request, set }) => {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // 🔁 DEV: proxy all to Vite
  if (process.env.NODE_ENV !== "production") {
    const vite_port = Number.parseInt(process.env.VITE_PORT || "6996", 10);
    const viteUrl = `http://localhost:${vite_port}${pathname}${url.search}`;
    console.log(`[proxy → vite] ${viteUrl}`);

    const proxyRes = await fetch(viteUrl, {
      method: request.method,
      headers: request.headers,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
    });

    set.headers["Surrogate-Control"] = "no-store";
    set.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, proxy-revalidate";
    // Deprecated though https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Pragma
    set.headers.Pragma = "no-cache";
    set.headers.Expires = "0";

    return new Response(proxyRes.body, {
      status: proxyRes.status,
      headers: proxyRes.headers,
    });
  }

  // 🔒 PROD: file cache
  if (fileCache.has(pathname)) {
    const file = fileCache.get(pathname);
    set.headers.Cache = "yes";
    set.headers["Content-Type"] = file?.type || "application/octet-stream";
    set.headers["Cache-Control"] = "public, max-age=31536000, immutable";
    return new Response(file);
  }

  // 🔒 PROD: static files
  if (isStaticFile(pathname)) {
    const filePath = join(CLIENT_DIR, pathname);

    const file = Bun.file(filePath);
    if (await file.exists()) {
      fileCache.set(pathname, file);
      set.headers["Content-Type"] = file.type || "application/octet-stream";
      set.headers["Cache-Control"] = "public, max-age=31536000, immutable";
      return file;
    }
    return new Response("Not found", { status: 404 });
  }

  // 🔒 PROD: prerendered HTML
  const htmlFilePath = join(STATIC_DIR, pathname === "/" ? "index.html" : `${pathname}.html`);
  const staticHtml = Bun.file(htmlFilePath);
  if (await staticHtml.exists()) {
    fileCache.set(pathname, staticHtml);
    set.headers["Content-Type"] = "text/html";
    return staticHtml;
  }

  // 🧠 PROD SSR
  if (renderer) {
    try {
      const { env, html, state, preloadLinks, headTags, locale } = await renderer(pathname, request.headers, manifest);

      const fullHtml = template
        .replace("<!--preload-links-->", preloadLinks)
        .replace("<!--locale-->", locale)
        .replace("<!--ssr-outlet-->", html)
        .replace("<!--head-tags-->", headTags)
        .replace("<!--pinia-state-->", `window.__pinia = ${state}`)
        .replace("<!--ssr-env-->", `<script>window.__env = ${JSON.stringify(env)}</script>`);

      set.headers["Content-Type"] = "text/html";

      return fullHtml;
    } catch (err) {
      console.error("SSR render error:", err);
      return new Response("Internal Server Error", { status: 500 });
    }
  }

  return new Response("Not found", { status: 404 });
});
