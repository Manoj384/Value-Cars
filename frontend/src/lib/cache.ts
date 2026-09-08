/**
 * Client-side TTL cache over localStorage with an in-memory mirror used by the
 * API layer. Fully client-side because the frontend is statically exported
 * (`output: 'export'`) — there is no server fetch cache at production.
 *
 * Keys are namespaced and stamped with CACHE_VERSION so a release invalidates
 * all previously cached data in one shot.
 */
const CACHE_VERSION = '1';
const PREFIX = `vc:c:${CACHE_VERSION}`;
const TTL_DEFAULT_MS = 60_000;

interface CacheEntry<T> {
  v: T;
  e: number; // expiry, epoch ms
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function readEntry<T>(key: string): CacheEntry<T> | null {
  try {
    const raw = canUseStorage() ? localStorage.getItem(`${PREFIX}:${key}`) : null;
    if (!raw) return null;
    return JSON.parse(raw) as CacheEntry<T>;
  } catch {
    return null;
  }
}

/** Build a short, stable hash for a cache key (simple FNV-1a-ish string hash). */
export function cacheKeyHash(...parts: (string | number)[]): string {
  const input = parts.join('::');
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36);
}

/** Return a fresh entry, or null if missing/expired (expired entries are removed). */
export function cacheGet<T>(key: string): { value: T; fresh: true } | null {
  const entry = readEntry<T>(key);
  if (!entry) return null;
  if (Date.now() > entry.e) {
    cacheDelete(key);
    return null;
  }
  return { value: entry.v, fresh: true };
}

/** Return the raw stored value even if expired (for stale-while-revalidate). */
export function cacheGetStale<T>(key: string): T | null {
  const entry = readEntry<T>(key);
  return entry ? entry.v : null;
}

export function cacheSet<T>(key: string, value: T, ttlMs = TTL_DEFAULT_MS): void {
  const entry: CacheEntry<T> = { v: value, e: Date.now() + ttlMs };
  try {
    if (canUseStorage()) localStorage.setItem(`${PREFIX}:${key}`, JSON.stringify(entry));
  } catch {
    // storage full / unavailable — ignore, cache is best-effort
  }
}

export function cacheDelete(key: string): void {
  try {
    if (canUseStorage()) localStorage.removeItem(`${PREFIX}:${key}`);
  } catch {
    // ignore
  }
}

/** Remove every key belonging to the current cache version. */
export function cacheClear(): void {
  try {
    if (!canUseStorage()) return;
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(`${PREFIX}:`)) toRemove.push(k);
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

/** In-memory mirror for ultra-fast repeat reads within the same session. */
const memoryMirror = new Map<string, { v: unknown; e: number }>();

export function memGet<T>(key: string): T | null {
  const entry = memoryMirror.get(key);
  if (!entry) return null;
  if (Date.now() > entry.e) {
    memoryMirror.delete(key);
    return null;
  }
  return entry.v as T;
}

export function memSet<T>(key: string, value: T, ttlMs = TTL_DEFAULT_MS): void {
  memoryMirror.set(key, { v: value, e: Date.now() + ttlMs });
}

export function memDelete(key: string): void {
  memoryMirror.delete(key);
}