import { getSql } from "@/lib/db";
import {
  barsFromSeries,
  closeMark,
  draftFromQuote,
  type HouseMark,
  type MarkOutcome,
  type MarkSource,
} from "./book";
import type { ConfidenceRead, DateRead, Quote, RadarRead } from "./types";
import type { Action } from "./types";
import type { SetupKind } from "./setup";

interface MarkRow {
  id: string;
  symbol: string;
  session_date: string;
  source: string;
  engine_version: string;
  stance: string;
  setup: string;
  entry_print: number;
  spy_print: number | null;
  stop_pct: number | null;
  stop_kind: string | null;
  take_pct: number | null;
  time_horizon_td: number;
  event_date: string | null;
  event_label: string | null;
  regime: string;
  confidence_score: number | null;
  confidence_agreed: number | null;
  radar_tape: number | null;
  radar_quiet: number | null;
  radar_date: number | null;
  radar_gap: number | null;
  why: string;
  status: string;
  outcome: string | null;
  close_reason: string | null;
  closed_at: string | null;
  close_print: number | null;
  close_session_date: string | null;
  fwd_5d_pct: number | null;
  fwd_10d_pct: number | null;
  vs_spy_5d: number | null;
  vs_spy_10d: number | null;
  vs_spy_close: number | null;
  sentence: string;
  created_at: string;
}

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function fromRow(row: MarkRow): HouseMark {
  return {
    id: row.id,
    symbol: row.symbol,
    sessionDate: String(row.session_date).slice(0, 10),
    source: row.source as MarkSource,
    engineVersion: row.engine_version,
    stance: row.stance as HouseMark["stance"],
    setup: row.setup as HouseMark["setup"],
    entryPrint: num(row.entry_print) ?? 0,
    spyPrint: num(row.spy_print),
    stopPct: num(row.stop_pct),
    stopKind: (row.stop_kind as HouseMark["stopKind"]) ?? null,
    takePct: num(row.take_pct),
    timeHorizonTd: Number(row.time_horizon_td) || 10,
    eventDate: row.event_date ? String(row.event_date).slice(0, 10) : null,
    eventLabel: row.event_label,
    regime: row.regime as HouseMark["regime"],
    confidenceScore: num(row.confidence_score),
    confidenceAgreed: num(row.confidence_agreed),
    radarTape: num(row.radar_tape),
    radarQuiet: num(row.radar_quiet),
    radarDate: num(row.radar_date),
    radarGap: num(row.radar_gap),
    why: row.why,
    status: row.status as HouseMark["status"],
    outcome: (row.outcome as MarkOutcome | null) ?? null,
    closeReason: (row.close_reason as HouseMark["closeReason"]) ?? null,
    closedAt: row.closed_at,
    closePrint: num(row.close_print),
    closeSessionDate: row.close_session_date ? String(row.close_session_date).slice(0, 10) : null,
    fwd5dPct: num(row.fwd_5d_pct),
    fwd10dPct: num(row.fwd_10d_pct),
    vsSpy5d: num(row.vs_spy_5d),
    vsSpy10d: num(row.vs_spy_10d),
    vsSpyClose: num(row.vs_spy_close),
    sentence: row.sentence,
    createdAt: row.created_at,
  };
}

export async function insertMark(mark: HouseMark): Promise<HouseMark | null> {
  const sql = await getSql();
  const rows = await sql<MarkRow>`
    insert into house_marks (
      id, symbol, session_date, source, engine_version, stance, setup,
      entry_print, spy_print, stop_pct, stop_kind, take_pct, time_horizon_td,
      event_date, event_label, regime, confidence_score, confidence_agreed,
      radar_tape, radar_quiet, radar_date, radar_gap, why, status, outcome,
      close_reason, closed_at, close_print, close_session_date,
      fwd_5d_pct, fwd_10d_pct, vs_spy_5d, vs_spy_10d, vs_spy_close, sentence, created_at
    ) values (
      ${mark.id}, ${mark.symbol}, ${mark.sessionDate}::date, ${mark.source},
      ${mark.engineVersion}, ${mark.stance}, ${mark.setup},
      ${mark.entryPrint}, ${mark.spyPrint}, ${mark.stopPct}, ${mark.stopKind},
      ${mark.takePct}, ${mark.timeHorizonTd},
      ${mark.eventDate}::date, ${mark.eventLabel}, ${mark.regime},
      ${mark.confidenceScore}, ${mark.confidenceAgreed},
      ${mark.radarTape}, ${mark.radarQuiet}, ${mark.radarDate}, ${mark.radarGap},
      ${mark.why}, ${mark.status}, ${mark.outcome},
      ${mark.closeReason}, ${mark.closedAt}::timestamptz, ${mark.closePrint},
      ${mark.closeSessionDate}::date,
      ${mark.fwd5dPct}, ${mark.fwd10dPct}, ${mark.vsSpy5d}, ${mark.vsSpy10d},
      ${mark.vsSpyClose}, ${mark.sentence}, ${mark.createdAt}::timestamptz
    )
    on conflict (symbol, session_date, source) do nothing
    returning *
  `;
  return rows[0] ? fromRow(rows[0]) : null;
}

async function updateClosed(mark: HouseMark): Promise<void> {
  const sql = await getSql();
  await sql`
    update house_marks set
      status = ${mark.status},
      outcome = ${mark.outcome},
      close_reason = ${mark.closeReason},
      closed_at = ${mark.closedAt}::timestamptz,
      close_print = ${mark.closePrint},
      close_session_date = ${mark.closeSessionDate}::date,
      fwd_5d_pct = ${mark.fwd5dPct},
      fwd_10d_pct = ${mark.fwd10dPct},
      vs_spy_5d = ${mark.vsSpy5d},
      vs_spy_10d = ${mark.vsSpy10d},
      vs_spy_close = ${mark.vsSpyClose},
      sentence = ${mark.sentence}
    where id = ${mark.id}
  `;
}

export async function listOpenMarks(symbol?: string): Promise<HouseMark[]> {
  const sql = await getSql();
  const rows = symbol
    ? await sql<MarkRow>`select * from house_marks where status = 'open' and symbol = ${symbol} order by session_date desc`
    : await sql<MarkRow>`select * from house_marks where status = 'open' order by session_date desc, symbol`;
  return rows.map(fromRow);
}

export async function listClosedMarks(limit = 40): Promise<HouseMark[]> {
  const sql = await getSql();
  const rows = await sql<MarkRow>`
    select * from house_marks
    where status = 'closed'
    order by close_session_date desc, created_at desc
    limit ${limit}
  `;
  return rows.map(fromRow);
}

export async function listMarksForSymbol(symbol: string): Promise<HouseMark[]> {
  const sql = await getSql();
  const rows = await sql<MarkRow>`
    select * from house_marks
    where symbol = ${symbol}
    order by session_date desc, created_at desc
    limit 24
  `;
  return rows.map(fromRow);
}

export async function countClosedBuys(): Promise<number> {
  const sql = await getSql();
  const rows = await sql<{ n: number }>`
    select count(*)::int as n from house_marks
    where status = 'closed' and stance = 'buy' and outcome in ('paid', 'failed')
  `;
  return Number(rows[0]?.n ?? 0);
}

export async function latestForSymbols(symbols: string[]): Promise<Map<string, HouseMark>> {
  const want = new Set(symbols.map((s) => s.toUpperCase()));
  const out = new Map<string, HouseMark>();
  if (!want.size) return out;
  const sql = await getSql();
  const rows = await sql<MarkRow>`
    select * from house_marks
    order by session_date desc, created_at desc
    limit 400
  `;
  for (const row of rows) {
    const m = fromRow(row);
    if (want.has(m.symbol) && !out.has(m.symbol)) out.set(m.symbol, m);
  }
  return out;
}

export async function closeOpenWithQuotes(quotes: Quote[], spy: Quote | null): Promise<number> {
  const open = await listOpenMarks();
  if (!open.length) return 0;
  const spyPath = spy ? barsFromSeries(spy.timestamps, spy.closes) : null;
  const bySym = new Map(quotes.map((q) => [q.symbol.toUpperCase(), q]));
  let n = 0;
  for (const m of open) {
    const q = bySym.get(m.symbol);
    if (!q) continue;
    const next = closeMark(m, barsFromSeries(q.timestamps, q.closes), spyPath);
    const changed =
      next.status !== m.status ||
      next.fwd5dPct !== m.fwd5dPct ||
      next.fwd10dPct !== m.fwd10dPct ||
      next.sentence !== m.sentence;
    if (changed) {
      await updateClosed(next);
      n += 1;
    }
  }
  return n;
}

export async function stampDrafts(
  drafts: Array<{
    symbol: string;
    price: number;
    closes: number[];
    timestamps: number[];
    high52: number | null;
    stance: Action;
    setup: SetupKind;
    why: string;
    date?: DateRead | null;
    confidence?: ConfidenceRead | null;
    radar?: RadarRead | null;
  }>,
  spy: Quote | null,
  source: MarkSource,
): Promise<number> {
  let n = 0;
  for (const d of drafts) {
    const mark = draftFromQuote({
      ...d,
      spyPrice: spy?.price ?? null,
      spyCloses: spy?.closes ?? null,
      source,
    });
    if (!mark) continue;
    const inserted = await insertMark(mark);
    if (inserted) n += 1;
  }
  return n;
}
