// src/client/entry-server.ts
import { setGlobalCookie } from "@/shared/globalCookieJar";
import type { HeadTag } from "@unhead/schema";
import { renderToString } from "@vue/server-renderer";
import { createApp } from "./main";
import { useUserStore } from "./store/user";
import {
  setupI18n,
  getLocaleFromPath,
  getNamespaceFromPath,
  loadLocaleNamespace,
  setI18nLanguage,
} from "./plugins/i18n";

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
            links += `<link rel="modulepreload" crossorigin href="/${file}">`;
          } else if (file.endsWith(".css")) {
            links += `<link rel="stylesheet" href="/${file}">`;
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
        .map(([key, value]) => `${key}="${String(value).replace(/"/g, "&quot;")}"`)
        .join(" ");
      const openTag = `<${tag}${attrs ? ` ${attrs}` : ""}>`;
      const closeTag = tag === "meta" || tag === "link" ? "" : `</${tag}>`;
      return textContent ? `${openTag}${textContent}${closeTag}` : `${openTag}${closeTag}`;
    })
    .join("\n");
}

export async function render(url: string, headers: Headers, manifest: Record<string, string[]>) {
  const { app, router, pinia, head } = createApp();

  setGlobalCookie(headers.get("cookie"));

  const locale = getLocaleFromPath(url);
  const namespace = getNamespaceFromPath(url);

  const i18n = setupI18n(locale);
  app.use(i18n);

  await loadLocaleNamespace(i18n, locale, namespace);
  setI18nLanguage(i18n, locale);

  await router.push(url);
  await router.isReady();

  const store = useUserStore(pinia);
  await store.get();

  const ctx: { modules?: Set<string> } = {};
  const html = await renderToString(app, ctx);
  const rawTags = await head.headTags();
  const headTags = renderHeadTags(rawTags);
  const state = JSON.stringify(pinia.state.value);
  const preloadLinks = renderPreloadLinks(ctx.modules || new Set(), manifest);

  const env: Record<string, string> = {};
  for (const key in process.env) {
    if (key.startsWith("PUBLIC_") && process.env[key] !== undefined) {
      env[key] = process.env[key];
    }
  }

  return { html, state, preloadLinks, env, headTags, locale };
}
