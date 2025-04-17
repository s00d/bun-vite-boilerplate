// src/server/utils/globalCookieJar.ts
let globalCookies = "";

export function setGlobalCookie(cookieHeader: string | undefined | null) {
  if (!cookieHeader) return;
  globalCookies = cookieHeader;
}

export function getGlobalCookie(): string {
  return globalCookies;
}
