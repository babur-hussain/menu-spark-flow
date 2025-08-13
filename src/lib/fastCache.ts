// Simple in-memory + localStorage cache with TTL, safe for multi-tab usage
// Stores values under a namespaced key with a timestamp for freshness checks

type CachedEntry<T> = {
  value: T;
  timestamp: number; // epoch ms
};

const memoryCache = new Map<string, CachedEntry<unknown>>();

export function getCachedValue<T>(key: string, maxAgeMs: number): T | null {
  try {
    const now = Date.now();

    // 1) Check in-memory first (fast path)
    const mem = memoryCache.get(key) as CachedEntry<T> | undefined;
    if (mem && now - mem.timestamp <= maxAgeMs) {
      return mem.value;
    }

    // 2) Check localStorage for cross-tab reuse
    const raw = localStorage.getItem(`fastcache:${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedEntry<T>;
    if (now - parsed.timestamp <= maxAgeMs) {
      // hydrate memory for future
      memoryCache.set(key, parsed);
      return parsed.value;
    }
    return null;
  } catch {
    return null;
  }
}

export function setCachedValue<T>(key: string, value: T): void {
  const entry: CachedEntry<T> = { value, timestamp: Date.now() };
  try {
    memoryCache.set(key, entry);
    localStorage.setItem(`fastcache:${key}`, JSON.stringify(entry));
  } catch {
    // ignore quota or serialization errors
  }
}

// Small timeout helper for network calls
export async function withTimeout<T>(promise: Promise<T>, timeoutMs = 1200, label = "request"): Promise<T> {
  const timeout = new Promise<T>((_, reject) =>
    setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs)
  );
  // @ts-expect-error: Promise.race typing compatible
  return Promise.race([promise, timeout]);
}


