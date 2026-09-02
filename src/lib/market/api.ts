import { createServerFn } from "@tanstack/react-start";
import { auditDesk, decideAction } from "./pillars";
import { capFromMarketCap, filterNews, getSector, isCapSize, isSectorId, type CapSize, type SectorId } from "./sectors";
import { INDEX_UNIVERSE, type ActionCall, type DeskAudit, type NewsItem, type OptionSnapshot, type Quote } from "./types";
import { fetchNews, fetchOptions, fetchQuote, fetchQuotes, normalizeSymbol } from "./yahoo";

export interface PulseName {
  quote: Quote;
  call: ActionCall;
  cap: CapSize | null;
  tag: string;
  watch: string;
}

export interface SectorQueueItem {
  symbol: string;
  tag: string;
  watch: string;
  cap: CapSize | null;
}

export interface PulsePayload {
  indexes: Quote[];
  names: PulseName[];
  news: NewsItem[];
  queue: SectorQueueItem[];
  queueTitle: string;
  sector: SectorId;
  cap: CapSize | "all";
  counts: { all: number; small: number; mid: number; large: number };
  blurb: string;
  asOf: string;
}

export interface TickerPayload {
  quote: Quote | null;
  options: OptionSnapshot | null;
  news: NewsItem[];
  desk: DeskAudit | null;
  error: string | null;
}

export const loadPulse = createServerFn({ method: "GET" })
  .validator((d: { sector?: string; cap?: string }): { sector: SectorId; cap: CapSize | "all" } => ({
    sector: isSectorId(d?.sector) ? d.sector : "tape",
    cap: isCapSize(d?.cap) ? d.cap : "all",
  }))
  .handler(async ({ data }): Promise<PulsePayload> => {
    const sector = getSector(data.sector);
    const symbols = sector.names.map((n) => n.symbol);
    const [indexes, quotes, rawNews] = await Promise.all([
      fetchQuotes(INDEX_UNIVERSE),
      fetchQuotes(symbols),
      fetchNews(sector.newsQuery),
    ]);
    const bySymbol = new Map(quotes.map((q) => [q.symbol, q]));
    const allNames: PulseName[] = [];
    for (const row of sector.names) {
      const quote = bySymbol.get(row.symbol);
      if (!quote) continue;
      const cap = capFromMarketCap(quote.marketCap, row.capHint);
      quote.cap = cap;
      allNames.push({
        quote,
        call: decideAction(quote),
        cap,
        tag: row.tag,
        watch: row.watch,
      });
    }
    const counts = {
      all: allNames.length,
      small: allNames.filter((n) => n.cap === "small").length,
      mid: allNames.filter((n) => n.cap === "mid").length,
      large: allNames.filter((n) => n.cap === "large").length,
    };
    const names = data.cap === "all" ? allNames : allNames.filter((n) => n.cap === data.cap);
    const news = filterNews(rawNews, sector.newsFilter);
    const queue = (data.cap === "all" ? allNames : names).map((n) => ({
      symbol: n.quote.symbol,
      tag: n.tag,
      watch: n.watch,
      cap: n.cap,
    }));
    return {
      indexes,
      names,
      news,
      queue,
      queueTitle: sector.queueTitle,
      sector: sector.id,
      cap: data.cap,
      counts,
      blurb: sector.blurb,
      asOf: new Date().toISOString(),
    };
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
