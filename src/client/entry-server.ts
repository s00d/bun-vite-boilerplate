// src/client/entry-server.ts
import { AsyncLocalStorage } from "node:async_hooks";
import { setCookieReader } from "@/shared/globalCookieJar";
import type { HeadTag } from "@unhead/schema";
import { renderToString } from "@vue/server-renderer";
import { localeFromPath } from "../../config/i18n.config";
import { pageTranslations } from "@/server/translations";
import { applyPageTranslations, routeKey } from "./i18n";
import { createApp } from "./main";
import { useUserStore } from "./store/user";

export function renderPreloadLinks(modules: Set<string>, manifest: Record<string, string[]>) {
  const seen = new Set();
  let links = "";
  for (const id of modules) {
    const files = manifest[id];
    if (files) {
      for (const file of files) {
        if (!seen.has(file)) {
          seen.add(file);
          if (file.endsWith(".js")) {
            links += `<link rel="modulepreload" crossorigin href="${file.startsWith("/") ? file : `/${file}`}">`;
          } else if (file.endsWith(".css")) {
            links += `<link rel="stylesheet" href="${file.startsWith("/") ? file : `/${file}`}">`;
          }
        }
      }
    }
  }
  return links;
}

function renderHeadTags(tags: HeadTag[]): string {
  return tags
    .map(({ tag, props, textContent }) => {
      const attrs = Object.entries(props || {})
        .map(([key, value]) => `${key}="${String(value).replaceAll('"', "&quot;")}"`)
        .join(" ");
      const openTag = `<${tag}${attrs ? ` ${attrs}` : ""}>`;
      const closeTag = tag === "meta" || tag === "link" ? "" : `</${tag}>`;
      return textContent ? `${openTag}${textContent}${closeTag}` : `${openTag}${closeTag}`;
    })
    .join("\n");
}

// Each render sees only its own request's cookie, also across awaits of concurrent renders.
const requestCookie = new AsyncLocalStorage<string>();
setCookieReader(() => requestCookie.getStore() ?? "");

export function render(url: string, headers: Headers, manifest: Record<string, string[]>) {
  return requestCookie.run(headers.get("cookie") ?? "", () => renderApp(url, manifest));
}

async function renderApp(url: string, manifest: Record<string, string[]>) {
  const { app, router, pinia, head, i18n } = createApp();

  await router.push(url);
  await router.isReady();

  // Dictionaries straight from disk; the same ones go to the client so hydration matches.
  const locale = localeFromPath(url);
  const route = routeKey(router.currentRoute.value);
  const translations = await pageTranslations(locale, route);
  applyPageTranslations(i18n, locale, route, translations);

  const store = useUserStore(pinia);
  await store.get();

  const ctx: { modules?: Set<string> } = {};
  const html = await renderToString(app, ctx);
  const rawTags = await head.headTags();
  const headTags = renderHeadTags(rawTags);
  const state = JSON.stringify(pinia.state.value);
  const preloadLinks = renderPreloadLinks(ctx.modules || new Set(), manifest);

  // The catch-all route is a real 404 for crawlers and caches, not a 200 page.
  const status = router.currentRoute.value.name === "NotFound" ? 404 : 200;

  const i18nState = JSON.stringify({ locale, route, translations });

  return { html, state, i18nState, preloadLinks, headTags, locale, status };
}
