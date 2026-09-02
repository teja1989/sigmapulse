const KEY = "sigmapulse.watchlist";
const DEFAULT = ["AAPL", "NVDA", "SPY"];

export function readWatchlist(): string[] {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return DEFAULT;
    return parsed.map((s) => String(s).toUpperCase()).filter(Boolean).slice(0, 24);
  } catch {
    return DEFAULT;
  }
}

export function writeWatchlist(symbols: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(symbols.slice(0, 24)));
}

export function toggleWatch(symbol: string): string[] {
  const next = readWatchlist();
  const i = next.indexOf(symbol);
  if (i >= 0) next.splice(i, 1);
  else next.unshift(symbol);
  writeWatchlist(next);
  return next;
}
