// src/shared/env.ts

const isServer = typeof window === "undefined";

export function getEnv(key: string, fallback = ""): string {
  if (isServer) {
    return process.env[key] ?? fallback;
  }

  return (window.__env?.[key] as string) ?? fallback;
}
