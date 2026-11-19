// src/shared/globalCookieJar.ts
// Cookie of the request being server-rendered, for SSR API calls (see axios.ts).
// Shared code can't import node:async_hooks (client bundle), so entry-server plugs in
// a per-request reader; the client never calls it.
let readCookie: () => string = () => "";

export function setCookieReader(read: () => string) {
  readCookie = read;
}

export function getGlobalCookie(): string {
  return readCookie();
}
