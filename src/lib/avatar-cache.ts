/**
 * DiceBear avatar cache — avoids dozens of third-party SVG requests hanging
 * on slow networks (Radix then falls back to initials inconsistently).
 *
 * Strategy: first render uses the original URL; a fire-and-forget fetch
 * stores the SVG text as a data URI in memory + localStorage. Subsequent
 * renders resolve synchronously to the data URI (first-party, instant).
 */

const STORAGE_KEY = 'dcc-avatar-cache-v1';
const MAX_ENTRIES = 100;

const memoryCache = new Map<string, string>();

let hydrated = false;

function hydrate() {
  if (hydrated || typeof window === 'undefined') return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const entries = JSON.parse(raw) as Array<[string, string]>;
    if (!Array.isArray(entries)) return;
    for (const [k, v] of entries.slice(-MAX_ENTRIES)) {
      if (typeof k === 'string' && typeof v === 'string') memoryCache.set(k, v);
    }
  } catch {
    // Storage unavailable / corrupt: memory-only cache.
  }
}

function persist() {
  if (typeof window === 'undefined') return;
  try {
    const entries = Array.from(memoryCache.entries()).slice(-MAX_ENTRIES);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Quota exceeded: evict oldest and retry once.
    try {
      const entries = Array.from(memoryCache.entries());
      const room = Math.max(1, Math.floor(entries.length / 4));
      for (let i = 0; i < room; i++) {
        const oldest = memoryCache.keys().next().value;
        if (oldest === undefined) break;
        memoryCache.delete(oldest);
      }
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(Array.from(memoryCache.entries()).slice(-MAX_ENTRIES))
      );
    } catch {
      // Give up: memory-only cache still works.
    }
  }
}

function isDiceBearUrl(url: string): boolean {
  return url.includes('api.dicebear.com');
}

function populateInBackground(url: string) {
  // Fire-and-forget: never throw, never block render.
  fetch(url)
    .then((res) => {
      if (!res.ok) return null;
      const contentType = res.headers.get('content-type') || '';
      if (contentType && !contentType.includes('svg') && !contentType.includes('image')) return null;
      return res.text();
    })
    .then((svg) => {
      if (!svg || !svg.trimStart().startsWith('<svg')) return;
      try {
        const dataUri = `data:image/svg+xml,${encodeURIComponent(svg)}`;
        memoryCache.set(url, dataUri);
        persist();
      } catch {
        // Encoding/storage failure: ignore.
      }
    })
    .catch(() => {
      // Offline / blocked: keep using the original URL.
    });
}

/**
 * Synchronously resolve an avatar URL to a cached data URI when available.
 * Returns the original URL (and kicks off a background fetch) on cache miss.
 * Non-DiceBear URLs pass through untouched and are never fetched.
 */
export function resolveAvatarUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  hydrate();
  const cached = memoryCache.get(url);
  if (cached) return cached;
  if (typeof window !== 'undefined' && isDiceBearUrl(url)) {
    populateInBackground(url);
  }
  return url;
}
