import { createServerFn } from "@tanstack/react-start";
import { reportCardCopy, draftFromQuote, type HouseMark } from "./book";
import { scoreConfidence } from "./confidence";
import { auditDesk } from "./pillars";
import { scorePotential } from "./setup";
import { resolveDates } from "./calendar";
import { newsForTicker, peersOf, sectorOf } from "./sectors";
import { fetchNews, fetchQuote, fetchQuotes, normalizeSymbol } from "./yahoo";
import type { Quote } from "./types";

export interface BookPayload {
  open: HouseMark[];
  closed: HouseMark[];
  closedBuys: number;
  report: string;
  error: string | null;
}

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export async function persistPulseBook(names: Array<{
  quote: Quote;
  call: { action: HouseMark["stance"]; why: string };
  setup: { kind: HouseMark["setup"] };
  date?: import("./types").DateRead | null;
  confidence?: import("./types").ConfidenceRead | null;
}>, spy: Quote | null): Promise<Map<string, HouseMark>> {
  return safe(async () => {
    const { closeOpenWithQuotes, stampDrafts, latestForSymbols } = await import("./ledger.server");
    const quotes = names.map((n) => n.quote);
    if (spy) quotes.push(spy);
    await closeOpenWithQuotes(quotes, spy);
    await stampDrafts(
      names.map((n) => ({
        symbol: n.quote.symbol,
        price: n.quote.price,
        closes: n.quote.closes,
        timestamps: n.quote.timestamps,
        high52: n.quote.high52,
        stance: n.call.action,
        setup: n.setup.kind,
        why: n.call.why,
        date: n.date,
        confidence: n.confidence ?? null,
      })),
      spy,
      "auto",
    );
    return latestForSymbols(names.map((n) => n.quote.symbol));
  }, new Map());
}

export const loadBook = createServerFn({ method: "GET" }).handler(async (): Promise<BookPayload> => {
  try {
    const { closeOpenWithQuotes, countClosedBuys, listClosedMarks, listOpenMarks } = await import("./ledger.server");
    const open = await listOpenMarks();
    const symbols = [...new Set(open.map((m) => m.symbol))];
    if (symbols.length) {
      const [quotes, spy] = await Promise.all([fetchQuotes(symbols), fetchQuote("SPY", "3mo")]);
      await closeOpenWithQuotes(spy ? [...quotes, spy] : quotes, spy);
    }
    const [openAfter, closed, closedBuys] = await Promise.all([
      listOpenMarks(),
      listClosedMarks(40),
      countClosedBuys(),
    ]);
    return {
      open: openAfter,
      closed,
      closedBuys,
      report: reportCardCopy(closedBuys),
      error: null,
    };
  } catch (err) {
    return {
      open: [],
      closed: [],
      closedBuys: 0,
      report: reportCardCopy(0),
      error: err instanceof Error ? err.message : "Book ledger is unavailable.",
    };
  }
});

export const stampTicker = createServerFn({ method: "POST" })
  .validator((d: { symbol?: string }) => ({
    symbol: normalizeSymbol(String(d?.symbol ?? "")) || "",
  }))
  .handler(async ({ data }): Promise<{ mark: HouseMark | null; created: boolean; error: string | null }> => {
    const symbol = data.symbol;
    if (!symbol) return { mark: null, created: false, error: "No symbol." };
    try {
      const [daily, spy, rawNews] = await Promise.all([
        fetchQuote(symbol, "1y"),
        fetchQuote("SPY", "3mo"),
        fetchNews(symbol),
      ]);
      if (!daily) return { mark: null, created: false, error: `No quote for ${symbol}.` };
      const news = newsForTicker(rawNews, symbol, daily.name);
      const date = await resolveDates({
        symbol,
        name: daily.name,
        news,
        preferFda: sectorOf(symbol) === "bio",
      });
      const peers = await fetchQuotes(peersOf(symbol, 4));
      const setup = scorePotential(daily, spy);
      const desk = auditDesk(daily, null, news, date);
      const confidence = scoreConfidence(daily, setup, spy, peers);
      const draft = draftFromQuote({
        symbol,
        price: daily.price,
        closes: daily.closes,
        timestamps: daily.timestamps,
        high52: daily.high52,
        spyPrice: spy?.price ?? null,
        spyCloses: spy?.closes ?? null,
        stance: desk.call.action,
        setup: setup.kind,
        why: desk.call.why,
        source: "manual",
        date,
        confidence,
        radar: desk.radar,
      });
      if (!draft) return { mark: null, created: false, error: "Cannot stamp a bad print." };
      const { closeOpenWithQuotes, insertMark, listMarksForSymbol } = await import("./ledger.server");
      await closeOpenWithQuotes(spy ? [daily, spy] : [daily], spy);
      const inserted = await insertMark(draft);
      if (inserted) return { mark: inserted, created: true, error: null };
      const existing = (await listMarksForSymbol(symbol)).find(
        (m) => m.sessionDate === draft.sessionDate && m.source === "manual",
      );
      return { mark: existing ?? draft, created: false, error: null };
    } catch (err) {
      return {
        mark: null,
        created: false,
        error: err instanceof Error ? err.message : "Stamp failed.",
      };
    }
  });

export const loadTickerMarks = createServerFn({ method: "GET" })
  .validator((d: { symbol?: string }) => ({
    symbol: normalizeSymbol(String(d?.symbol ?? "")) || "",
  }))
  .handler(async ({ data }): Promise<HouseMark[]> => {
    if (!data.symbol) return [];
    return safe(async () => {
      const { listMarksForSymbol } = await import("./ledger.server");
      return listMarksForSymbol(data.symbol);
    }, []);
  });
