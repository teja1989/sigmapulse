const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

type CacheEntry = { expires: number; value: unknown };
const cache = new Map<string, CacheEntry>();

export async function fetchJson<T>(
  urls: string[],
  ttlMs = 45_000,
  timeoutMs = 6_000,
  extraHeaders?: Record<string, string>,
): Promise<T | null> {
  const key = urls[0] ?? "";
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": BROWSER_UA,
          Accept: "application/json",
          ...extraHeaders,
        },
        signal: AbortSignal.timeout(timeoutMs),
        cache: "no-store",
      });
      if (!res.ok) continue;
      const json = (await res.json()) as T;
      cache.set(key, { expires: Date.now() + ttlMs, value: json });
      return json;
    } catch {
      // try next host
    }
  }
  return null;
}

export async function fetchText(
  urls: string[],
  ttlMs = 45_000,
  timeoutMs = 6_000,
  extraHeaders?: Record<string, string>,
): Promise<string | null> {
  const key = `text:${urls[0] ?? ""}`;
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as string;

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": BROWSER_UA,
          Accept: "application/rss+xml, application/xml, text/xml, */*",
          ...extraHeaders,
        },
        signal: AbortSignal.timeout(timeoutMs),
        cache: "no-store",
      });
      if (!res.ok) continue;
      const text = await res.text();
      if (!text) continue;
      cache.set(key, { expires: Date.now() + ttlMs, value: text });
      return text;
    } catch {
      // try next host
    }
  }
  return null;
}

export async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  }
  const n = Math.min(Math.max(limit, 1), items.length || 1);
  await Promise.all(Array.from({ length: n }, () => worker()));
  return out;
}

export function yahooHosts(path: string): string[] {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return [`https://query1.finance.yahoo.com${clean}`, `https://query2.finance.yahoo.com${clean}`];
}

export const NASDAQ_HEADERS = {
  Origin: "https://www.nasdaq.com",
  Referer: "https://www.nasdaq.com/",
};
