import { createServerFn } from "@tanstack/react-start";
import { reportCardCopy, type HouseMark } from "./book";
import type { SessionJobResult } from "./session-job";
import { fetchQuote, fetchQuotes, normalizeSymbol } from "./yahoo";
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

/** Read + settle only. Page loads do not stamp. */
export async function readMarksForSymbols(
  symbols: string[],
  quotes: Quote[],
  spy: Quote | null,
): Promise<Map<string, HouseMark>> {
  return safe(async () => {
    const { closeOpenWithQuotes, latestForSymbols } = await import("./ledger.server");
    const bundle = spy ? [...quotes, spy] : quotes;
    await closeOpenWithQuotes(bundle, spy);
    return latestForSymbols(symbols);
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

export const runBookSession = createServerFn({ method: "POST" }).handler(async (): Promise<SessionJobResult> => {
  const { runDeskSession } = await import("./session-job");
  return runDeskSession();
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
