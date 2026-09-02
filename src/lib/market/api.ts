import { createServerFn } from "@tanstack/react-start";
import { auditDesk } from "./pillars";
import { INDEX_UNIVERSE, PULSE_UNIVERSE, type DeskAudit, type NewsItem, type OptionSnapshot, type Quote } from "./types";
import { fetchNews, fetchOptions, fetchQuote, fetchQuotes, normalizeSymbol } from "./yahoo";

export interface PulsePayload {
  indexes: Quote[];
  names: Quote[];
  news: NewsItem[];
  asOf: string;
}

export interface TickerPayload {
  quote: Quote | null;
  options: OptionSnapshot | null;
  news: NewsItem[];
  desk: DeskAudit | null;
  error: string | null;
}

export const loadPulse = createServerFn({ method: "GET" }).handler(async (): Promise<PulsePayload> => {
  const [indexes, names, news] = await Promise.all([
    fetchQuotes(INDEX_UNIVERSE),
    fetchQuotes(PULSE_UNIVERSE),
    fetchNews("stock market"),
  ]);
  return { indexes, names, news, asOf: new Date().toISOString() };
});

export const loadTicker = createServerFn({ method: "GET" })
  .validator((d: { symbol?: string }) => ({
    symbol: normalizeSymbol(String(d?.symbol ?? "AAPL")) || "AAPL",
  }))
  .handler(async ({ data }): Promise<TickerPayload> => {
    const symbol = data.symbol;
    const [quote, options, news] = await Promise.all([
      fetchQuote(symbol),
      fetchOptions(symbol),
      fetchNews(symbol),
    ]);
    if (!quote) {
      return {
        quote: null,
        options,
        news,
        desk: null,
        error: `No delayed quote for ${symbol}. Yahoo may be rate-limiting or the symbol is invalid.`,
      };
    }
    return {
      quote,
      options,
      news,
      desk: auditDesk(quote, options, news),
      error: null,
    };
  });

export const loadNews = createServerFn({ method: "GET" })
  .validator((d: { q?: string }) => ({ q: String(d?.q ?? "US stocks") }))
  .handler(async ({ data }) => fetchNews(data.q));

export const loadOptions = createServerFn({ method: "GET" })
  .validator((d: { symbol?: string }) => ({
    symbol: normalizeSymbol(String(d?.symbol ?? "SPY")) || "SPY",
  }))
  .handler(async ({ data }) => fetchOptions(data.symbol));
