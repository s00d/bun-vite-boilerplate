// src/server/middleware/csrf.ts
import { randomUUIDv7 } from "bun";

export function generateCsrfToken(): string {
  return randomUUIDv7();
}

export function getCsrfTokenFromCookie(cookie: string | null): string | null {
  if (!cookie) return null;
  const parsed = Object.fromEntries(cookie.split("; ").map((s) => s.split("=")));
  return parsed.csrf || null;
}

export function validateCsrf(request: Request): boolean {
  const cookie = request.headers.get("cookie");
  const csrfCookie = getCsrfTokenFromCookie(cookie);
  const csrfHeader = request.headers.get("x-csrf-token");
  if (!csrfCookie || !csrfHeader) return false;
  return csrfCookie === csrfHeader;
}
