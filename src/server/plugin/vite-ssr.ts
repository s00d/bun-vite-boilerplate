// src/server/plugin/vite-ssr.ts
// One plugin for the whole Vue SSR pipeline:
//  - dev:  Vite runs inside this Bun process (one `bun --hot` command), pages are
//          server-rendered through vite.ssrLoadModule, assets/HMR come from Vite.
//  - prod: renders with the built dist/server bundle, serves dist/client assets
//          and prerendered dist/static pages.
// `loadRenderer` is exported so SSG renders pages the same way the server does.
import { join, resolve } from "node:path";
import { staticPlugin } from "@elysiajs/static";
import { Elysia } from "elysia";
import type { ViteDevServer } from "vite";

/** What src/client/entry-server.ts `render` returns. */
export interface RenderResult {
  html: string;
  state: string;
  /** `window.__i18n`: the page's dictionaries for the client. */
  i18nState: string;
  preloadLinks: string;
  headTags: string;
  locale: string;
  status: number;
}

export interface RenderedPage {
  /** Full HTML page, `<!--ssr-env-->` still open (see withEnv). */
  html: string;
  status: number;
}

export interface Renderer {
  render(url: string, headers: Headers): Promise<RenderedPage>;
}

export interface ViteSSROptions {
  /** Server entry, as Vite sees it in dev. */
  entry?: string;
  /** Build output root (client/, server/, static/ inside). */
  dist?: string;
  dev?: boolean;
}

// Read at call time: NODE_ENV may be set after this module is imported.
const withDefaults = (o: ViteSSROptions): Required<ViteSSROptions> => ({
  entry: "/src/client/entry-server.ts",
  dist: resolve(process.cwd(), "dist"),
  dev: process.env.NODE_ENV !== "production",
  ...o,
});

// JSON placed inside <script>: `<` must not be able to close the tag.
const safeJson = (json: string) => json.replaceAll("<", "\\u003c");

/**
 * Fills index.html placeholders. Function replacers: page HTML may contain `$&`.
 * `<!--ssr-env-->` stays: env is injected when serving (withEnv), so prerendered pages
 * get the runtime env, not the build machine's.
 */
export function fillTemplate(template: string, r: RenderResult): string {
  const slots: Record<string, string> = {
    "<!--preload-links-->": r.preloadLinks,
    "<!--locale-->": r.locale,
    "<!--ssr-outlet-->": r.html,
    "<!--head-tags-->": r.headTags,
    "<!--pinia-state-->": `window.__pinia = ${safeJson(r.state)}; window.__i18n = ${safeJson(r.i18nState)}`,
  };
  return template.replaceAll(/<!--[a-z-]+-->/g, (slot) => slots[slot] ?? slot);
}

/** PUBLIC_* env of this process → `window.__env`. */
export function withEnv(html: string): string {
  const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => k.startsWith("PUBLIC_")));
  const script = `<script>window.__env = ${safeJson(JSON.stringify(env))}</script>`;
  return html.replace("<!--ssr-env-->", () => script);
}

type RenderFn = (url: string, headers: Headers, manifest: Record<string, string[]>) => Promise<RenderResult>;

// Survives `bun --hot` reloads: the module re-runs, the Vite server must not.
const g = globalThis as { __viteDevServer?: Promise<ViteDevServer> };

function startVite(): Promise<ViteDevServer> {
  g.__viteDevServer ??= (async () => {
    const { createServer } = await import("vite");
    const port = Number.parseInt(process.env.VITE_PORT || "6996", 10);
    const vite = await createServer({
      appType: "custom", // HTML pages are ours, Vite only serves modules/assets
      server: { port, strictPort: true, hmr: { clientPort: port } },
    });
    await vite.listen();
    return vite;
  })();
  return g.__viteDevServer;
}

async function devRenderer(entry: string): Promise<Renderer & { vite: ViteDevServer }> {
  const vite = await startVite();
  const indexHtml = resolve(vite.config.root, "index.html");
  return {
    vite,
    async render(url, headers) {
      try {
        const template = await vite.transformIndexHtml(url, await Bun.file(indexHtml).text());
        const { render } = (await vite.ssrLoadModule(entry)) as { render: RenderFn };
        const result = await render(url, headers, {});
        return { html: fillTemplate(template, result), status: result.status };
      } catch (e) {
        if (e instanceof Error) vite.ssrFixStacktrace(e);
        throw e;
      }
    },
  };
}

async function prodRenderer(dist: string): Promise<Renderer> {
  const template = await Bun.file(join(dist, "client/index.html")).text();
  const manifest = await Bun.file(join(dist, "client/.vite/ssr-manifest.json")).json();
  const { render } = (await import(join(dist, "server/entry-server.js"))) as { render: RenderFn };
  return {
    async render(url, headers) {
      const result = await render(url, headers, manifest);
      return { html: fillTemplate(template, result), status: result.status };
    },
  };
}

export function loadRenderer(options: ViteSSROptions = {}): Promise<Renderer> {
  const o = withDefaults(options);
  return o.dev ? devRenderer(o.entry) : prodRenderer(o.dist);
}

const html = (body: string, status = 200) =>
  new Response(body, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });

/** Catch-all: register after API routes. */
export async function viteSSR(options: ViteSSROptions = {}) {
  const o = withDefaults(options);
  const plugin = new Elysia({ name: "vite-ssr" });

  if (o.dev) {
    const { vite, render } = await devRenderer(o.entry);
    const viteOrigin = `http://localhost:${vite.config.server.port}`;

    return plugin.all("*", async ({ request }) => {
      const url = new URL(request.url);

      // Page navigation → SSR. Everything else (/@vite/client, /src/*.vue, assets) → Vite.
      if (request.method === "GET" && request.headers.get("accept")?.includes("text/html")) {
        try {
          const page = await render(url.pathname + url.search, request.headers);
          return html(withEnv(page.html), page.status);
        } catch (e) {
          console.error(e);
          return html(`<pre>${Bun.escapeHTML(e instanceof Error ? (e.stack ?? e.message) : String(e))}</pre>`, 500);
        }
      }

      const res = await fetch(viteOrigin + url.pathname + url.search, {
        method: request.method,
        headers: request.headers,
        body: request.body,
      });
      // fetch already decoded the body; stale length/encoding would break the browser.
      const headers = new Headers(res.headers);
      headers.delete("content-encoding");
      headers.delete("content-length");
      return new Response(res.body, { status: res.status, headers });
    });
  }

  const renderer = await prodRenderer(o.dist);
  const staticDir = join(o.dist, "static");
  // Prerendered pages never change while the server runs; env is filled in once.
  // Only hits are cached: arbitrary URLs must not grow the map.
  const prerendered = new Map<string, string>();

  async function prerenderedPage(pathname: string): Promise<string | undefined> {
    const cached = prerendered.get(pathname);
    if (cached) return cached;
    const file = Bun.file(join(staticDir, pathname === "/" ? "index.html" : `${pathname}.html`));
    // Resolved path must stay inside dist/static (no `..` escapes).
    if (!file.name?.startsWith(staticDir) || !(await file.exists())) return undefined;
    const page = withEnv(await file.text());
    prerendered.set(pathname, page);
    return page;
  }

  return plugin
    .use(
      // async plugin: await it, a nested lazy plugin never registers its routes
      await staticPlugin({
        assets: join(o.dist, "client/assets"),
        prefix: "/assets",
        maxAge: 31536000,
        directive: "immutable",
      }),
    )
    .get("/favicon.ico", () => Bun.file(join(o.dist, "client/favicon.ico")))
    .get("*", async ({ request }) => {
      const { pathname } = new URL(request.url);
      // A file nobody serves is a 404, not a page.
      if (/\.\w+$/.test(pathname)) return new Response("Not found", { status: 404 });

      const page = await prerenderedPage(pathname);
      if (page) return html(page);

      try {
        const rendered = await renderer.render(pathname, request.headers);
        return html(withEnv(rendered.html), rendered.status);
      } catch (e) {
        console.error("SSR render error:", e);
        return html("Internal Server Error", 500);
      }
    });
}
