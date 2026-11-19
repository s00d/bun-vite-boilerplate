// src/server/routes/i18n.ts
import { resolve } from "node:path";
import { Elysia, t } from "elysia";
import { I18N_CONFIG } from "../../../config/i18n.config";

const supportedLngs: readonly string[] = I18N_CONFIG.supportedLngs;
const namespaces: readonly string[] = I18N_CONFIG.namespaces;

/** Translations of one namespace, for the client's lazy loading. */
export const i18nRoutes = new Elysia({ prefix: "/api/i18n", tags: ["i18n"] }).get(
  "/",
  async ({ query, status }) => {
    const locale = query.locale ?? I18N_CONFIG.fallbackLng;
    const namespace = query.namespace ?? I18N_CONFIG.defaultNS;

    // Whitelisted, so both are safe to put into a path.
    if (!supportedLngs.includes(locale)) return status(404, "Locale not supported");
    if (!namespaces.includes(namespace)) return status(404, "Namespace not supported");

    const file = Bun.file(resolve(I18N_CONFIG.localesPath, locale, `${namespace}.json`));
    if (!(await file.exists())) return status(404, "Translation file not found");

    return {
      locale,
      namespace,
      translations: await file.json(),
      availableLocales: supportedLngs,
      availableNamespaces: namespaces,
    };
  },
  {
    query: t.Object({
      locale: t.Optional(t.String()),
      namespace: t.Optional(t.String()),
    }),
  },
);
