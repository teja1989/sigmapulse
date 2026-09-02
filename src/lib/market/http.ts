const YAHOO_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

type CacheEntry = { expires: number; value: unknown };
const cache = new Map<string, CacheEntry>();

export async function fetchJson<T>(
  urls: string[],
  ttlMs = 45_000,
  timeoutMs = 6_000,
): Promise<T | null> {
  const key = urls[0] ?? "";
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": YAHOO_UA,
          Accept: "application/json",
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

export function yahooHosts(path: string): string[] {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return [
    `https://query1.finance.yahoo.com${clean}`,
    `https://query2.finance.yahoo.com${clean}`,
  ];
}
