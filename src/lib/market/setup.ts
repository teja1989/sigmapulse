import { ema, realizedVol } from "./pillars.ts";
import type { Quote } from "./types";

export type SetupKind = "coil" | "lag" | "spent" | "wash" | "room" | "none";

export interface Potential {
  kind: SetupKind;
  label: string;
  gainPct: number | null;
  riskPct: number | null;
  rr: number | null;
  atrPct: number | null;
  vsIndexPct: number | null;
  why: string;
}

export function isJump(setup: Potential): boolean {
  return setup.kind === "coil" || setup.kind === "lag";
}

function retN(closes: number[], n: number): number | null {
  if (closes.length < n + 1) return null;
  const last = closes[closes.length - 1];
  const prev = closes[closes.length - 1 - n];
  if (!last || !prev || prev <= 0) return null;
  return ((last - prev) / prev) * 100;
}

export function typicalDayPct(closes: number[], n = 14): number | null {
  if (closes.length < n + 1) return null;
  const slice = closes.slice(-(n + 1));
  const moves: number[] = [];
  for (let i = 1; i < slice.length; i++) {
    if (slice[i] > 0 && slice[i - 1] > 0) {
      moves.push(Math.abs((slice[i] - slice[i - 1]) / slice[i - 1]) * 100);
    }
  }
  if (!moves.length) return null;
  return moves.reduce((a, b) => a + b, 0) / moves.length;
}

export function scorePotential(quote: Quote, index?: Quote | null): Potential {
  const high = quote.high52;
  const low = quote.low52;
  const gainPct =
    high != null && high > quote.price
      ? Number((((high - quote.price) / quote.price) * 100).toFixed(1))
      : high != null && high > 0
        ? 0
        : null;
  const rangePct =
    high != null && low != null && high > low
      ? ((quote.price - low) / (high - low)) * 100
      : null;
  const atrPct = typicalDayPct(quote.closes);
  const e20 = ema(quote.closes, 20);
  const riskPct =
    e20 != null && quote.price > e20
      ? Number((((quote.price - e20) / quote.price) * 100).toFixed(1))
      : atrPct != null
        ? Number(atrPct.toFixed(1))
        : null;
  const rr =
    gainPct != null && riskPct != null && riskPct > 0.2
      ? Number((gainPct / riskPct).toFixed(1))
      : null;
  const rv10 = realizedVol(quote.closes, 10);
  const rv40 = realizedVol(quote.closes, 40);
  const compressed = rv10 != null && rv40 != null && rv40 > 0 && rv10 < rv40 * 0.65;
  const name20 = retN(quote.closes, 20);
  const idx20 = index?.closes ? retN(index.closes, 20) : null;
  const vsIndexPct =
    name20 != null && idx20 != null ? Number((name20 - idx20).toFixed(1)) : null;
  const spent = rangePct != null && rangePct >= 92;
  const wash = rangePct != null && rangePct <= 12;
  const lag = vsIndexPct != null && vsIndexPct <= -4;
  const hasRoom = gainPct != null && gainPct >= 8;

  if (spent) {
    return {
      kind: "spent",
      label: "Spent",
      gainPct,
      riskPct,
      rr,
      atrPct: atrPct != null ? Number(atrPct.toFixed(1)) : null,
      vsIndexPct,
      why: "Already at the highs. A Buy here is chasing the print, not jumping ahead of it.",
    };
  }
  if (compressed && hasRoom) {
    return {
      kind: "coil",
      label: "Coil",
      gainPct,
      riskPct,
      rr,
      atrPct: atrPct != null ? Number(atrPct.toFixed(1)) : null,
      vsIndexPct,
      why: `Range is quiet and there is ${gainPct}% to the 52-week high. Compression first, then the tape. This is the earlier read.`,
    };
  }
  if (lag && hasRoom) {
    return {
      kind: "lag",
      label: "Lag",
      gainPct,
      riskPct,
      rr,
      atrPct: atrPct != null ? Number(atrPct.toFixed(1)) : null,
      vsIndexPct,
      why: `This name is ${Math.abs(vsIndexPct ?? 0).toFixed(0)}% behind the index over 20 days, with ${gainPct}% room. Catch-up is the bet — not a guarantee.`,
    };
  }
  if (wash) {
    return {
      kind: "wash",
      label: "Wash",
      gainPct,
      riskPct,
      rr,
      atrPct: atrPct != null ? Number(atrPct.toFixed(1)) : null,
      vsIndexPct,
      why: "Sitting on the lows. Wait for a hold. Catching a knife is still reacting.",
    };
  }
  if (hasRoom) {
    return {
      kind: "room",
      label: "Room",
      gainPct,
      riskPct,
      rr,
      atrPct: atrPct != null ? Number(atrPct.toFixed(1)) : null,
      vsIndexPct,
      why: `${gainPct}% to the 52-week high if it tags it. That is room, not a forecast.`,
    };
  }
  return {
    kind: "none",
    label: "No setup",
    gainPct,
    riskPct,
    rr,
    atrPct: atrPct != null ? Number(atrPct.toFixed(1)) : null,
    vsIndexPct,
    why: "No coil, no lag, no room. Nothing to jump before the tape.",
  };
}
