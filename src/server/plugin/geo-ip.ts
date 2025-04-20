import { Elysia } from "elysia";
import { ip as ipPlugin } from "elysia-ip";
import fs from "node:fs";
import { Reader, type CountryResponse } from "mmdb-lib";
import { join } from "node:path";
import process from "node:process";

// Путь к базе данных GeoIP
const MMDB_PATH = join(process.cwd(), "./data/GeoLite2-Country.mmdb");
const dbBuffer = fs.readFileSync(MMDB_PATH);
const reader = new Reader<CountryResponse>(dbBuffer);

// Максимальное количество записей в кеше
const CACHE_MAX_ENTRIES = 1_000;

// Кеш типа LRU (наивная реализация с Map)
const geoCache = new Map<string, CountryResponse | null>();

function getFromCache(ip: string): CountryResponse | null | undefined {
  const value = geoCache.get(ip);
  if (value !== undefined) {
    // перемещаем в конец, чтобы обновить "использованность"
    geoCache.delete(ip);
    geoCache.set(ip, value);
  }
  return value;
}

function saveToCache(ip: string, value: CountryResponse | null) {
  if (geoCache.size >= CACHE_MAX_ENTRIES) {
    // удаляем наименее недавно использованный элемент
    const firstKey = geoCache.keys().next().value;
    if (firstKey) geoCache.delete(firstKey);
  }
  geoCache.set(ip, value);
}

export const geoIP = new Elysia({ name: "geo-ip" })
  .use(ipPlugin())
  .derive(({ ip }) => {
    if (!ip) return { geo: null as CountryResponse | null };

    const cached = getFromCache(ip);
    if (cached !== undefined) return { geo: cached };

    const geo = reader.get(ip) ?? null;
    saveToCache(ip, geo);
    return { geo };
  })
  .as("plugin");
