import { createServerFn } from "@tanstack/react-start";
import { resolveDates, resolveDatesForSymbols } from "./calendar";
import { scoreConfidence } from "./confidence";
import { correlate } from "./correlate";
import type { HouseMark } from "./book";
import { auditDesk, decideAction } from "./pillars";
import { capFromMarketCap, filterNews, getSector, isCapSize, isSectorId, newsForTicker, peersOf, sectorOf, type CapSize, type SectorId } from "./sectors";
import { scorePotential, type Potential } from "./setup";
import {
  INDEX_UNIVERSE,
  type ActionCall,
  type ConfidenceRead,
  type CorrelateRow,
  type DateRead,
  type DeskAudit,
  type LivePrint,
  type NewsItem,
  type OptionSnapshot,
  type Quote,
  type RadarRead,
} from "./types";
import { fetchIntraday, fetchNews, fetchOptions, fetchQuote, fetchQuotes, normalizeSymbol } from "./yahoo";

export interface PulseName {
  quote: Quote;
  call: ActionCall;
  cap: CapSize | null;
  tag: string;
  watch: string;
  setup: Potential;
  confidence: ConfidenceRead;
  date: DateRead;
  mark: HouseMark | null;
}

export interface SectorQueueItem {
  symbol: string;
  tag: string;
  watch: string;
  cap: CapSize | null;
  dateLabel: string | null;
  daysAway: number | null;
  dateKind: "earnings" | "fda" | "headline" | null;
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
  live: LivePrint | null;
  options: OptionSnapshot | null;
  news: NewsItem[];
  desk: DeskAudit | null;
  setup: Potential | null;
  radar: RadarRead | null;
  confidence: ConfidenceRead | null;
  date: DateRead | null;
  marks: HouseMark[];
  correlates: CorrelateRow[];
  error: string | null;
}

const SETUP_RANK: Record<Potential["kind"], number> = {
  coil: 0,
  lag: 1,
  room: 2,
  wash: 3,
  spent: 4,
  none: 5,
};

function bySetup(a: PulseName, b: PulseName) {
  const d = SETUP_RANK[a.setup.kind] - SETUP_RANK[b.setup.kind];
  if (d !== 0) return d;
  const da = a.date.event?.daysAway;
  const db = b.date.event?.daysAway;
  if (da != null && db != null && da !== db && da >= 0 && db >= 0) return da - db;
  const conf = (b.confidence.score ?? 0) - (a.confidence.score ?? 0);
  if (conf !== 0) return conf;
  return (b.setup.rr ?? 0) - (a.setup.rr ?? 0);
}

function applyLive(quote: Quote, live: LivePrint | null): Quote {
  if (!live) return quote;
  return {
    ...quote,
    price: live.price,
    prevClose: live.prevClose,
    change: live.change,
    changePct: live.changePct,
    marketState: live.session.toUpperCase(),
    provenance: live.provenance,
  };
}

export const loadPulse = createServerFn({ method: "GET" })
  .validator((d: { sector?: string; cap?: string }): { sector: SectorId; cap: CapSize | "all" } => ({
    sector: isSectorId(d?.sector) ? d.sector : "tape",
    cap: isCapSize(d?.cap) ? d.cap : "all",
  }))
  .handler(async ({ data }): Promise<PulsePayload> => {
    const sector = getSector(data.sector);
    const symbols = sector.names.map((n) => n.symbol);
    const preferFda = sector.id === "bio";
    const [indexes, quotes, rawNews, dates] = await Promise.all([
      fetchQuotes(INDEX_UNIVERSE),
      fetchQuotes(symbols),
      fetchNews(sector.newsQuery),
      resolveDatesForSymbols(sector.names.map((n) => ({ symbol: n.symbol, name: n.watch, preferFda }))),
    ]);
    const bySymbol = new Map(quotes.map((q) => [q.symbol, q]));
    const spy = indexes.find((q) => q.symbol === "SPY") ?? null;
    const emptyDate: DateRead = {
      event: null,
      others: [],
      feedOk: true,
      score: 0,
      meaning: "No date we can see.",
      sentence: "No date we can see.",
    };
    const draft: Omit<PulseName, "confidence" | "mark">[] = [];
    for (const row of sector.names) {
      const quote = bySymbol.get(row.symbol);
      if (!quote) continue;
      const cap = capFromMarketCap(quote.marketCap, row.capHint);
      quote.cap = cap;
      draft.push({
        quote,
        call: decideAction(quote),
        cap,
        tag: row.tag,
        watch: row.watch,
        setup: scorePotential(quote, spy),
        date: dates.get(row.symbol) ?? emptyDate,
      });
    }
    const allNames: PulseName[] = draft.map((n) => {
      const peers = draft.filter((p) => p.quote.symbol !== n.quote.symbol).map((p) => p.quote);
      return {
        ...n,
        confidence: scoreConfidence(n.quote, n.setup, spy, peers),
        mark: null,
      };
    });
    const marksBy = await (async () => {
      try {
        const { readMarksForSymbols } = await import("./book-api");
        return readMarksForSymbols(
          allNames.map((n) => n.quote.symbol),
          allNames.map((n) => n.quote),
          spy,
        );
      } catch {
        return new Map<string, HouseMark>();
      }
    })();
    for (const n of allNames) {
      n.mark = marksBy.get(n.quote.symbol) ?? null;
    }
    const counts = {
      all: allNames.length,
      small: allNames.filter((n) => n.cap === "small").length,
      mid: allNames.filter((n) => n.cap === "mid").length,
      large: allNames.filter((n) => n.cap === "large").length,
    };
    const names = (data.cap === "all" ? allNames : allNames.filter((n) => n.cap === data.cap)).sort(bySetup);
    const news = filterNews(rawNews, sector.newsFilter);
    const queue = (data.cap === "all" ? allNames : names)
      .map((n) => ({
        symbol: n.quote.symbol,
        tag: n.tag,
        watch: n.watch,
        cap: n.cap,
        dateLabel: n.date.event?.label ?? null,
        daysAway: n.date.event?.daysAway ?? null,
        dateKind: n.date.event?.kind ?? null,
      }))
      .sort((a, b) => {
        if (a.daysAway == null && b.daysAway == null) return 0;
        if (a.daysAway == null) return 1;
        if (b.daysAway == null) return -1;
        return a.daysAway - b.daysAway;
      });
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
    const peerSymbols = peersOf(symbol, 4);
    const [daily, live, options, rawNews, spy, peers] = await Promise.all([
      fetchQuote(symbol, "1y"),
      fetchIntraday(symbol),
      fetchOptions(symbol),
      fetchNews(symbol),
      fetchQuote("SPY", "3mo"),
      fetchQuotes(peerSymbols),
    ]);
    const news = newsForTicker(rawNews, symbol, daily?.name);
    if (!daily) {
      return {
        quote: null,
        live,
        options,
        news,
        desk: null,
        setup: null,
        radar: null,
        confidence: null,
        date: null,
        correlates: [],
        marks: [],
        error: `No quote for ${symbol}. Yahoo may be rate-limiting or the symbol is invalid.`,
      };
    }
    const quote = applyLive(daily, live);
    const date = await resolveDates({
      symbol,
      name: daily.name,
      news,
      preferFda: sectorOf(symbol) === "bio",
    });
    const desk = auditDesk(quote, options, news, date);
    const setup = scorePotential(quote, spy);
    const correlates = correlate(quote, [...(spy ? [spy] : []), ...peers]);
    let marks: HouseMark[] = [];
    try {
      const { closeOpenWithQuotes, listMarksForSymbol } = await import("./ledger.server");
      await closeOpenWithQuotes(spy ? [quote, spy] : [quote], spy);
      marks = await listMarksForSymbol(symbol);
    } catch {
      marks = [];
    }
    return {
      quote,
      live,
      options,
      news,
      desk,
      setup,
      radar: desk.radar,
      confidence: scoreConfidence(quote, setup, spy, peers),
      date,
      correlates,
      marks,
      error: null,
    };
  });

export const loadLiveQuote = createServerFn({ method: "GET" })
  .validator((d: { symbol?: string }) => ({
    symbol: normalizeSymbol(String(d?.symbol ?? "AAPL")) || "AAPL",
  }))
  .handler(async ({ data }): Promise<LivePrint | null> => fetchIntraday(data.symbol));

export const loadNews = createServerFn({ method: "GET" })
  .validator((d: { q?: string }) => ({ q: String(d?.q ?? "US stocks") }))
  .handler(async ({ data }) => fetchNews(data.q));

export const loadOptions = createServerFn({ method: "GET" })
  .validator((d: { symbol?: string }) => ({
    symbol: normalizeSymbol(String(d?.symbol ?? "SPY")) || "SPY",
  }))
  .handler(async ({ data }) => fetchOptions(data.symbol));
