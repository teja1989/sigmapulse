import { stampSessionReady, sessionDateFromBars } from "./book.ts";
import { resolveDatesForSymbols } from "./calendar.ts";
import { scoreConfidence } from "./confidence.ts";
import { auditDesk } from "./pillars.ts";
import { deskUniverse, sectorOf } from "./sectors.ts";
import { scorePotential } from "./setup.ts";
import { fetchQuote, fetchQuotes } from "./yahoo.ts";
import type { Quote } from "./types.ts";

export { deskJobAuthorized } from "./job-auth.ts";

export interface SessionJobResult {
  ready: boolean;
  lastBarDate: string | null;
  stamped: number;
  closed: number;
  names: number;
  skipped: string;
  asOf: string;
  error: string | null;
}

function emptyResult(partial: Partial<SessionJobResult> = {}): SessionJobResult {
  return {
    ready: false,
    lastBarDate: null,
    stamped: 0,
    closed: 0,
    names: 0,
    skipped: "",
    asOf: new Date().toISOString(),
    error: null,
    ...partial,
  };
}

/**
 * House session: close open marks, then stamp today's (or last finished session's)
 * call for every name. Visitors do not write the book.
 */
export async function runDeskSession(): Promise<SessionJobResult> {
  try {
    const universe = deskUniverse();
    const [quotes, spy] = await Promise.all([fetchQuotes(universe), fetchQuote("SPY", "3mo")]);
    const spyQuote = spy;
    const bySymbol = new Map(quotes.map((q) => [q.symbol, q]));
    const lastBarDate = spyQuote
      ? sessionDateFromBars(spyQuote.timestamps)
      : quotes[0]
        ? sessionDateFromBars(quotes[0].timestamps)
        : null;
    if (!lastBarDate) {
      return emptyResult({ skipped: "No daily bars.", names: universe.length });
    }
    const { closeOpenWithQuotes, listOpenMarks, stampDrafts } = await import("./ledger.server");
    const open = await listOpenMarks();
    const extra = open.map((m) => m.symbol).filter((s) => !bySymbol.has(s));
    const extraQuotes = extra.length ? await fetchQuotes(extra) : [];
    const allQuotes: Quote[] = [...quotes, ...extraQuotes];
    if (spyQuote) allQuotes.push(spyQuote);
    const closed = await closeOpenWithQuotes(allQuotes, spyQuote);

    if (!stampSessionReady(lastBarDate)) {
      return emptyResult({
        ready: false,
        lastBarDate,
        closed,
        names: quotes.length,
        skipped: "Too early. The house writes after the close.",
      });
    }

    const dates = await resolveDatesForSymbols(
      quotes.map((q) => ({
        symbol: q.symbol,
        name: q.name,
        preferFda: sectorOf(q.symbol) === "bio",
      })),
    );

    const stamped = await stampDrafts(
      quotes.map((quote) => {
        const peers = quotes.filter((p) => p.symbol !== quote.symbol && sectorOf(p.symbol) === sectorOf(quote.symbol));
        const setup = scorePotential(quote, spyQuote);
        const date = dates.get(quote.symbol) ?? null;
        const desk = auditDesk(quote, null, [], date);
        return {
          symbol: quote.symbol,
          price: quote.price,
          closes: quote.closes,
          timestamps: quote.timestamps,
          high52: quote.high52,
          stance: desk.call.action,
          setup: setup.kind,
          why: desk.call.why,
          date,
          confidence: scoreConfidence(quote, setup, spyQuote, peers),
          radar: desk.radar,
        };
      }),
      spyQuote,
      "auto",
    );

    return {
      ready: true,
      lastBarDate,
      stamped,
      closed,
      names: quotes.length,
      skipped: stamped === 0 ? "Already on the book for this session." : "",
      asOf: new Date().toISOString(),
      error: null,
    };
  } catch (err) {
    return emptyResult({
      error: err instanceof Error ? err.message : "Session job failed.",
    });
  }
}
