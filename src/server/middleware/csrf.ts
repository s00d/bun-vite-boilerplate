// src/server/middleware/csrf.ts
import { randomUUIDv7 } from "bun";
import {SECURITY_CONFIG} from "../../../config/security.config";

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
  const csrfHeader = request.headers.get(SECURITY_CONFIG.csrfHeaderName);
  if (!csrfCookie || !csrfHeader) return false;
  return csrfCookie === csrfHeader;
}
