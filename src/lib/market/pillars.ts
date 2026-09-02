import type { DeskAudit, NewsItem, OptionSnapshot, Pillar, Quote } from "./types";

function mean(xs: number[]): number {
  if (!xs.length) return NaN;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function stdev(xs: number[]): number {
  if (xs.length < 2) return NaN;
  const m = mean(xs);
  const v = mean(xs.map((x) => (x - m) ** 2));
  return Math.sqrt(v);
}

export function realizedVol(closes: number[], periods = 20): number | null {
  if (closes.length < periods + 1) return null;
  const slice = closes.slice(-periods - 1);
  const rets: number[] = [];
  for (let i = 1; i < slice.length; i++) {
    if (slice[i] > 0 && slice[i - 1] > 0) rets.push(Math.log(slice[i] / slice[i - 1]));
  }
  const s = stdev(rets);
  if (!Number.isFinite(s)) return null;
  return s * Math.sqrt(252);
}

export function rsi14(closes: number[]): number | null {
  if (closes.length < 15) return null;
  const slice = closes.slice(-15);
  let gains = 0;
  let losses = 0;
  for (let i = 1; i < slice.length; i++) {
    const d = slice[i] - slice[i - 1];
    if (d >= 0) gains += d;
    else losses += -d;
  }
  const ag = gains / 14;
  const al = losses / 14;
  if (ag === 0 && al === 0) return 50;
  if (al === 0) return 100;
  return 100 - 100 / (1 + ag / al);
}

export function ema(closes: number[], n: number): number | null {
  if (closes.length < n) return null;
  const k = 2 / (n + 1);
  let e = mean(closes.slice(0, n));
  for (let i = n; i < closes.length; i++) e = closes[i] * k + e * (1 - k);
  return e;
}

function clamp(n: number, lo = 0, hi = 100) {
  return Math.min(hi, Math.max(lo, n));
}

export function scoreTrend(quote: Quote): Pillar {
  const rsi = rsi14(quote.closes);
  const e20 = ema(quote.closes, 20);
  const e50 = ema(quote.closes, 50);
  let score: number | null = null;
  const bits: string[] = [];
  if (rsi != null) {
    bits.push(`RSI14 ${rsi.toFixed(0)}`);
    score = rsi > 70 ? 62 : rsi < 30 ? 38 : 45 + (rsi - 50) * 0.9;
  }
  if (e20 != null && e50 != null) {
    bits.push(`EMA20 ${e20.toFixed(2)} vs EMA50 ${e50.toFixed(2)}`);
    const trendBoost = e20 > e50 ? 12 : -12;
    score = clamp((score ?? 50) + trendBoost);
  }
  if (quote.changePct > 1.5) score = clamp((score ?? 50) + 8);
  if (quote.changePct < -1.5) score = clamp((score ?? 50) - 8);
  const observed = quote.closes.length >= 20;
  return {
    id: "trend",
    name: "Price trend & momentum",
    weight: 0.22,
    score: observed ? Number((score ?? 50).toFixed(0)) : null,
    layman: observed
      ? quote.changePct >= 0
        ? "Buyers still have the tape."
        : "Sellers have the tape today."
      : "Not enough daily history to score trend.",
    detail: observed ? bits.join(" · ") : "Need ~20 daily closes from Yahoo chart.",
    observed,
  };
}

export function scoreVol(quote: Quote, options: OptionSnapshot | null): Pillar {
  const hv = realizedVol(quote.closes, 20);
  const iv = options?.atmIv ?? null;
  if (iv == null && hv == null) {
    return {
      id: "vol",
      name: "Volatility & pricing value",
      weight: 0.2,
      score: null,
      layman: "No ATM implied vol and not enough history for realized vol.",
      detail: "IVR is not estimated from the 52-week price range.",
      observed: false,
    };
  }
  let score = 50;
  const bits: string[] = [];
  if (iv != null) {
    bits.push(`ATM IV ${(iv * 100).toFixed(1)}% (Yahoo chain)`);
    // Cheap vol (low IV) scores higher for long premium; rich vol scores for selling.
    // Desk score here is "is this a clean long-vol setup?" — cheap IV is high.
    score = clamp(100 - iv * 120);
  }
  if (hv != null) {
    bits.push(`20d HV ${(hv * 100).toFixed(1)}%`);
    if (iv != null) {
      const spread = iv - hv;
      bits.push(`IV-HV ${(spread * 100).toFixed(1)} pts`);
      if (spread < -0.05) score = clamp(score + 10);
      if (spread > 0.08) score = clamp(score - 10);
    }
  }
  bits.push("IV rank is not shown — no 1-year IV history in this feed.");
  return {
    id: "vol",
    name: "Volatility & pricing value",
    weight: 0.2,
    score: Number(score.toFixed(0)),
    layman:
      iv != null && iv < 0.28
        ? "Options look relatively cheap versus a high-vol tape."
        : iv != null && iv > 0.5
          ? "Options are expensive. Prefer defined-risk spreads."
          : "Vol is mid-range. No automatic cheap/rich call.",
    detail: bits.join(" · "),
    observed: true,
  };
}

export function scoreFlow(): Pillar {
  return {
    id: "flow",
    name: "Smart money & congressional flow",
    weight: 0.18,
    score: null,
    layman: "Not scored. No live STOCK Act / Form 4 feed is wired.",
    detail: "This pillar stays blank rather than inventing insider flow.",
    observed: false,
  };
}

export function scoreCatalyst(news: NewsItem[]): Pillar {
  const observed = news.length > 0;
  const score = observed ? clamp(40 + Math.min(news.length, 8) * 5) : null;
  return {
    id: "catalyst",
    name: "Catalyst & event power",
    weight: 0.22,
    score,
    layman: observed
      ? `${news.length} related headlines in the delayed Yahoo news search.`
      : "No headlines returned for this ticker.",
    detail:
      "This is news density, not a 10-year event backtest. Historical win-rate is unobserved.",
    observed,
  };
}

export function scoreSafety(options: OptionSnapshot | null): Pillar {
  const hasChain = Boolean(options && (options.calls.length || options.puts.length));
  if (!hasChain) {
    return {
      id: "safety",
      name: "Downside safety & protection",
      weight: 0.18,
      score: null,
      layman: "No options chain — cannot size defined-risk structures.",
      detail: "Safety is scored only when a delayed chain is present.",
      observed: false,
    };
  }
  const liquid = [...(options?.calls ?? []), ...(options?.puts ?? [])].filter(
    (c) => (c.bid ?? 0) > 0 && (c.ask ?? 0) > 0,
  );
  const score = clamp(35 + Math.min(liquid.length, 40));
  return {
    id: "safety",
    name: "Downside safety & protection",
    weight: 0.18,
    score,
    layman: "Defined-risk spreads are constructible from the listed chain.",
    detail: `${liquid.length} contracts with a live bid/ask. Max loss is the debit you pay — not a forecast.`,
    observed: true,
  };
}

export function auditDesk(
  quote: Quote,
  options: OptionSnapshot | null,
  news: NewsItem[],
): DeskAudit {
  const pillars = [
    scoreTrend(quote),
    scoreVol(quote, options),
    scoreFlow(),
    scoreCatalyst(news),
    scoreSafety(options),
  ];
  const observed = pillars.filter((p) => p.observed && p.score != null);
  const weightSum = observed.reduce((s, p) => s + p.weight, 0);
  const composite =
    observed.length && weightSum
      ? Number(
          (
            observed.reduce((s, p) => s + (p.score as number) * p.weight, 0) / weightSum
          ).toFixed(0),
        )
      : null;
  const notes = [
    quote.provenance.label,
    options?.provenance.label ?? "Options chain unobserved",
    "Congressional / Form 4 flow unobserved",
    "Event backtest unobserved",
  ];
  let verdict = "Insufficient observed inputs.";
  if (composite != null) {
    if (composite >= 70) verdict = "Constructive on observed pillars. Still not a recommendation.";
    else if (composite >= 50) verdict = "Mixed tape. Size small or wait for cleaner vol.";
    else verdict = "Defensive posture on observed pillars.";
  }
  return { symbol: quote.symbol, composite, verdict, pillars, provenanceNotes: notes };
}
