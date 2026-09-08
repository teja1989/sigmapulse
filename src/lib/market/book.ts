import { etYmd, daysAway } from "./calendar.ts";
import { ema } from "./pillars.ts";
import { typicalDayPct, type SetupKind } from "./setup.ts";
import type { Action, ConfidenceRead, DateRead, RadarRead } from "./types.ts";

export const ENGINE_VERSION = "desk-v4";
export const MIN_CLOSED_BUYS = 20;
export const DEFAULT_HORIZON_TD = 10;

export type MarkSource = "auto" | "manual";
export type MarkStatus = "open" | "closed";
export type MarkOutcome = "paid" | "failed" | "expired";
export type CloseReason = "stop" | "take" | "time" | "event";
export type StopKind = "ema20" | "atr";
export type Regime = "index_up" | "index_down" | "unknown";

export interface ExitPlan {
  stopPct: number | null;
  stopKind: StopKind | null;
  takePct: number | null;
  timeHorizonTd: number;
  eventDate: string | null;
  eventLabel: string | null;
}

export interface HouseMark {
  id: string;
  symbol: string;
  sessionDate: string;
  source: MarkSource;
  engineVersion: string;
  stance: Action;
  setup: SetupKind;
  entryPrint: number;
  spyPrint: number | null;
  stopPct: number | null;
  stopKind: StopKind | null;
  takePct: number | null;
  timeHorizonTd: number;
  eventDate: string | null;
  eventLabel: string | null;
  regime: Regime;
  confidenceScore: number | null;
  confidenceAgreed: number | null;
  radarTape: number | null;
  radarQuiet: number | null;
  radarDate: number | null;
  radarGap: number | null;
  why: string;
  status: MarkStatus;
  outcome: MarkOutcome | null;
  closeReason: CloseReason | null;
  closedAt: string | null;
  closePrint: number | null;
  closeSessionDate: string | null;
  fwd5dPct: number | null;
  fwd10dPct: number | null;
  vsSpy5d: number | null;
  vsSpy10d: number | null;
  vsSpyClose: number | null;
  sentence: string;
  createdAt: string;
}

export interface BarPath {
  dates: string[];
  closes: number[];
}

export function canStamp(price: number, symbol: string): boolean {
  return Boolean(symbol) && Number.isFinite(price) && price > 0;
}

export function pctChange(from: number, to: number): number | null {
  if (!Number.isFinite(from) || !Number.isFinite(to) || from <= 0) return null;
  return Number((((to - from) / from) * 100).toFixed(2));
}

function axisScore(radar: RadarRead | null | undefined, id: string): number | null {
  const n = radar?.axes.find((a) => a.id === id)?.score;
  return n == null || !Number.isFinite(n) ? null : n;
}

export function planExit(opts: {
  stance: Action;
  price: number;
  ema20: number | null;
  atrPct: number | null;
  roomPct: number | null;
  eventDate: string | null;
  eventLabel: string | null;
  sessionDate: string;
}): ExitPlan {
  let eventDate: string | null = null;
  let eventLabel: string | null = null;
  let timeHorizonTd = DEFAULT_HORIZON_TD;
  if (opts.eventDate) {
    const away = daysAway(opts.eventDate, new Date(`${opts.sessionDate}T16:00:00-04:00`));
    if (Number.isFinite(away) && away >= 0 && away <= 14) {
      eventDate = opts.eventDate;
      eventLabel = opts.eventLabel;
      timeHorizonTd = Math.max(1, Math.min(DEFAULT_HORIZON_TD, away === 0 ? 1 : away));
    }
  }

  if (opts.stance !== "buy") {
    return {
      stopPct: null,
      stopKind: null,
      takePct: null,
      timeHorizonTd,
      eventDate,
      eventLabel,
    };
  }

  let stopPct: number | null = null;
  let stopKind: StopKind | null = null;
  if (opts.ema20 != null && opts.ema20 > 0 && opts.price > opts.ema20) {
    stopPct = Number((((opts.price - opts.ema20) / opts.price) * 100).toFixed(2));
    stopKind = "ema20";
  } else if (opts.atrPct != null && opts.atrPct > 0.2) {
    stopPct = Number(opts.atrPct.toFixed(2));
    stopKind = "atr";
  }
  if (stopPct != null && stopPct <= 0.15) {
    stopPct = null;
    stopKind = null;
  }

  const week = opts.atrPct != null && opts.atrPct > 0 ? opts.atrPct * Math.sqrt(5) : null;
  const room = opts.roomPct != null && opts.roomPct > 0.4 ? opts.roomPct : null;
  let takePct: number | null = null;
  if (week != null && week > 0.4) takePct = week;
  if (room != null) takePct = takePct == null ? room : Math.min(takePct, room);
  if (takePct != null) takePct = Number(takePct.toFixed(2));
  if (takePct != null && takePct <= 0.4) takePct = null;

  return { stopPct, stopKind, takePct, timeHorizonTd, eventDate, eventLabel };
}

export function regimeOf(spyCloses: number[] | null | undefined): Regime {
  if (!spyCloses || spyCloses.length < 21) return "unknown";
  const last = spyCloses[spyCloses.length - 1];
  const prev = spyCloses[spyCloses.length - 21];
  if (!last || !prev || prev <= 0) return "unknown";
  return last >= prev ? "index_up" : "index_down";
}

export function draftMark(opts: {
  id?: string;
  symbol: string;
  price: number;
  spyPrice: number | null;
  sessionDate: string;
  source: MarkSource;
  stance: Action;
  setup: SetupKind;
  why: string;
  ema20: number | null;
  atrPct: number | null;
  roomPct: number | null;
  eventDate: string | null;
  eventLabel: string | null;
  spyCloses?: number[] | null;
  confidence?: ConfidenceRead | null;
  radar?: RadarRead | null;
  now?: Date;
}): HouseMark | null {
  const symbol = opts.symbol.toUpperCase();
  if (!canStamp(opts.price, symbol)) return null;
  const exit = planExit({
    stance: opts.stance,
    price: opts.price,
    ema20: opts.ema20,
    atrPct: opts.atrPct,
    roomPct: opts.roomPct,
    eventDate: opts.eventDate,
    eventLabel: opts.eventLabel,
    sessionDate: opts.sessionDate,
  });
  const now = opts.now ?? new Date();
  return {
    id: opts.id ?? crypto.randomUUID(),
    symbol,
    sessionDate: opts.sessionDate,
    source: opts.source,
    engineVersion: ENGINE_VERSION,
    stance: opts.stance,
    setup: opts.setup,
    entryPrint: Number(opts.price.toFixed(4)),
    spyPrint: opts.spyPrice != null && opts.spyPrice > 0 ? Number(opts.spyPrice.toFixed(4)) : null,
    stopPct: exit.stopPct,
    stopKind: exit.stopKind,
    takePct: exit.takePct,
    timeHorizonTd: exit.timeHorizonTd,
    eventDate: exit.eventDate,
    eventLabel: exit.eventLabel,
    regime: regimeOf(opts.spyCloses),
    confidenceScore: opts.confidence?.score ?? null,
    confidenceAgreed: opts.confidence?.agreed ?? null,
    radarTape: axisScore(opts.radar, "tape"),
    radarQuiet: axisScore(opts.radar, "quiet"),
    radarDate: axisScore(opts.radar, "date"),
    radarGap: axisScore(opts.radar, "gap"),
    why: opts.why,
    status: "open",
    outcome: null,
    closeReason: null,
    closedAt: null,
    closePrint: null,
    closeSessionDate: null,
    fwd5dPct: null,
    fwd10dPct: null,
    vsSpy5d: null,
    vsSpy10d: null,
    vsSpyClose: null,
    sentence: openSentence(opts.stance, exit, opts.sessionDate),
    createdAt: now.toISOString(),
  };
}

export function openSentence(stance: Action, exit: ExitPlan, sessionDate: string): string {
  if (stance !== "buy") {
    return `We said ${stance[0]!.toUpperCase()}${stance.slice(1)}, not Buy. This is a note. We score it in ${exit.timeHorizonTd} trading days — not a trade.`;
  }
  const bits = [`Stamped Buy on ${sessionDate}.`];
  if (exit.stopPct != null) {
    bits.push(
      exit.stopKind === "ema20"
        ? `Stop is the 20-day average, ${exit.stopPct.toFixed(1)}% under the print.`
        : `Stop is one typical day, ${exit.stopPct.toFixed(1)}% under the print.`,
    );
  } else {
    bits.push("No stop we can write — time is the exit.");
  }
  if (exit.takePct != null) {
    bits.push(`Take is +${exit.takePct.toFixed(1)}% (a typical week, capped by room to the high).`);
  }
  if (exit.eventDate) {
    bits.push(`Date fuse: ${exit.eventLabel ?? "event"} on ${exit.eventDate}. We flatten into that print.`);
  } else {
    bits.push(`Time stop: ${exit.timeHorizonTd} trading days.`);
  }
  return bits.join(" ");
}

export function barsFromSeries(timestamps: number[], closes: number[]): BarPath {
  const dates: string[] = [];
  const cs: number[] = [];
  const n = Math.min(timestamps.length, closes.length);
  for (let i = 0; i < n; i++) {
    const c = closes[i];
    const t = timestamps[i];
    if (!Number.isFinite(c) || c <= 0 || !Number.isFinite(t)) continue;
    dates.push(etYmd(new Date(t * 1000)));
    cs.push(c);
  }
  return { dates, closes: cs };
}

export function pathAfter(path: BarPath, sessionDate: string): BarPath {
  let idx = -1;
  for (let i = 0; i < path.dates.length; i++) {
    if (path.dates[i] <= sessionDate) idx = i;
  }
  if (idx < 0) return { dates: [], closes: [] };
  return { dates: path.dates.slice(idx + 1), closes: path.closes.slice(idx + 1) };
}

function spyCloseOn(spy: BarPath, date: string): number | null {
  for (let i = spy.dates.length - 1; i >= 0; i--) {
    if (spy.dates[i] <= date) return spy.closes[i];
  }
  return null;
}

function fillFwds(mark: HouseMark, name: BarPath, spy: BarPath | null): HouseMark {
  const next = { ...mark };
  const p5 = name.closes[4];
  const p10 = name.closes[9];
  if (p5 != null) {
    next.fwd5dPct = pctChange(mark.entryPrint, p5);
    const s5 = spy ? spyCloseOn(spy, name.dates[4]!) : null;
    next.vsSpy5d =
      next.fwd5dPct != null && mark.spyPrint != null && s5 != null
        ? Number((next.fwd5dPct - (pctChange(mark.spyPrint, s5) ?? 0)).toFixed(2))
        : null;
  }
  if (p10 != null) {
    next.fwd10dPct = pctChange(mark.entryPrint, p10);
    const s10 = spy ? spyCloseOn(spy, name.dates[9]!) : null;
    next.vsSpy10d =
      next.fwd10dPct != null && mark.spyPrint != null && s10 != null
        ? Number((next.fwd10dPct - (pctChange(mark.spyPrint, s10) ?? 0)).toFixed(2))
        : null;
  }
  return next;
}

function scoreHorizon(
  fwd: number | null,
  vsSpy: number | null,
): { outcome: MarkOutcome; vs: number | null } {
  if (fwd == null) return { outcome: "expired", vs: vsSpy };
  if (fwd > 0 && (vsSpy == null || vsSpy > 0)) return { outcome: "paid", vs: vsSpy };
  return { outcome: "failed", vs: vsSpy };
}

export function outcomeSentence(mark: HouseMark): string {
  const money = (n: number | null) => (n == null ? "n/a" : `${n > 0 ? "+" : ""}${n.toFixed(1)}%`);
  if (mark.status === "open") return mark.sentence;
  if (mark.stance !== "buy") {
    return `We said ${mark.stance[0]!.toUpperCase()}${mark.stance.slice(1)}, not Buy. ${mark.closeSessionDate ?? "Later"} the print was ${money(mark.fwd10dPct ?? mark.fwd5dPct)} from the stamp. A note, not a trade.`;
  }
  if (mark.closeReason === "take") {
    return `Hit the written take. Buy at $${mark.entryPrint.toFixed(2)} reached the take at $${(mark.closePrint ?? 0).toFixed(2)} on ${mark.closeSessionDate}. ${mark.vsSpyClose == null ? "SPY was not observed." : mark.vsSpyClose > 0 ? "Ahead of SPY." : "Behind SPY on the way."}`;
  }
  if (mark.closeReason === "stop") {
    return `Hit the written stop. Buy at $${mark.entryPrint.toFixed(2)} closed through the stop at $${(mark.closePrint ?? 0).toFixed(2)} on ${mark.closeSessionDate}.`;
  }
  if (mark.outcome === "paid") {
    return `The Buy was ahead of the print (${money(mark.fwd10dPct ?? mark.fwd5dPct)}) and ${mark.vsSpyClose == null ? "SPY was not observed, so we will not call the market." : `ahead of SPY (${money(mark.vsSpyClose)}).`}`;
  }
  if (mark.outcome === "failed") {
    const fwd = mark.fwd10dPct ?? mark.fwd5dPct;
    if (fwd != null && fwd > 0 && mark.vsSpyClose != null && mark.vsSpyClose <= 0) {
      return `Ahead of the print (${money(fwd)}) but behind SPY (${money(mark.vsSpyClose)}). That call is wrong vs sitting in the index.`;
    }
    return `The Buy was behind the print (${money(fwd)}) by ${mark.closeReason === "event" ? "the event" : "the time stop"}.`;
  }
  return mark.sentence;
}

export function closeMark(mark: HouseMark, name: BarPath, spy: BarPath | null, now: Date = new Date()): HouseMark {
  const path = pathAfter(name, mark.sessionDate);
  let next = fillFwds({ ...mark }, path, spy);
  if (mark.status === "closed") {
    next.sentence = outcomeSentence(next);
    return next;
  }

  const finish = (
    i: number,
    reason: CloseReason,
    outcome: MarkOutcome,
  ): HouseMark => {
    const closePrint = path.closes[i]!;
    const closeDate = path.dates[i]!;
    const spyC = spy ? spyCloseOn(spy, closeDate) : null;
    const fwd = pctChange(mark.entryPrint, closePrint);
    const spyFwd = mark.spyPrint != null && spyC != null ? pctChange(mark.spyPrint, spyC) : null;
    const vs = fwd != null && spyFwd != null ? Number((fwd - spyFwd).toFixed(2)) : null;
    const closed: HouseMark = {
      ...next,
      status: "closed",
      outcome,
      closeReason: reason,
      closedAt: now.toISOString(),
      closePrint,
      closeSessionDate: closeDate,
      vsSpyClose: vs,
    };
    closed.sentence = outcomeSentence(closed);
    return closed;
  };

  if (mark.stance !== "buy") {
    if (path.closes.length >= mark.timeHorizonTd) {
      return finish(mark.timeHorizonTd - 1, mark.eventDate ? "event" : "time", "expired");
    }
    return next;
  }

  for (let i = 0; i < path.closes.length; i++) {
    const px = path.closes[i]!;
    const d = path.dates[i]!;
    const td = i + 1;
    const stopLevel =
      mark.stopPct != null ? mark.entryPrint * (1 - mark.stopPct / 100) : null;
    const takeLevel =
      mark.takePct != null ? mark.entryPrint * (1 + mark.takePct / 100) : null;
    if (stopLevel != null && px <= stopLevel) return finish(i, "stop", "failed");
    if (takeLevel != null && px >= takeLevel) return finish(i, "take", "paid");
    const eventHit = Boolean(mark.eventDate && d >= mark.eventDate);
    const timeHit = td >= mark.timeHorizonTd;
    if (eventHit || timeHit) {
      const fwd = pctChange(mark.entryPrint, px);
      const spyC = spy ? spyCloseOn(spy, d) : null;
      const spyFwd = mark.spyPrint != null && spyC != null ? pctChange(mark.spyPrint, spyC) : null;
      const vs = fwd != null && spyFwd != null ? Number((fwd - spyFwd).toFixed(2)) : null;
      const { outcome } = scoreHorizon(fwd, vs);
      return finish(i, eventHit ? "event" : "time", outcome);
    }
  }
  return next;
}

export function draftFromQuote(opts: {
  symbol: string;
  price: number;
  closes: number[];
  timestamps: number[];
  high52: number | null;
  spyPrice: number | null;
  spyCloses: number[] | null;
  stance: Action;
  setup: SetupKind;
  why: string;
  source: MarkSource;
  date?: DateRead | null;
  confidence?: ConfidenceRead | null;
  radar?: RadarRead | null;
  now?: Date;
}): HouseMark | null {
  const now = opts.now ?? new Date();
  const sessionDate = etYmd(now);
  const e20 = ema(opts.closes, 20);
  const atrPct = typicalDayPct(opts.closes);
  const roomPct =
    opts.high52 != null && opts.high52 > opts.price
      ? ((opts.high52 - opts.price) / opts.price) * 100
      : opts.high52 != null
        ? 0
        : null;
  const ev = opts.date?.event;
  return draftMark({
    symbol: opts.symbol,
    price: opts.price,
    spyPrice: opts.spyPrice,
    sessionDate,
    source: opts.source,
    stance: opts.stance,
    setup: opts.setup,
    why: opts.why,
    ema20: e20,
    atrPct,
    roomPct,
    eventDate: ev && ev.daysAway >= 0 ? ev.date : null,
    eventLabel: ev?.label ?? null,
    spyCloses: opts.spyCloses,
    confidence: opts.confidence,
    radar: opts.radar,
    now,
  });
}

export function reportCardCopy(closedBuys: number): string {
  if (closedBuys < MIN_CLOSED_BUYS) {
    return `No honest hit rate yet. The first number we will trust is after ${MIN_CLOSED_BUYS} closed Buys. We have ${closedBuys}.`;
  }
  return `Closed Buys: ${closedBuys}. Hit rate belongs on this page once we slice by setup.`;
}
