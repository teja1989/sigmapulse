import type { ActionCall, DeskAudit, NewsItem, OptionSnapshot, Pillar, Quote } from "./types";

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
        ? "Price is holding up."
        : "Price is under pressure today."
      : "Not enough history yet.",
    detail: observed ? bits.join(" · ") : "Need more daily closes.",
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
      layman: "No vol reading yet.",
      detail: "Need an options print or more daily history.",
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
  bits.push("No 1-year IV rank in this feed.");
  return {
    id: "vol",
    name: "Volatility",
    weight: 0.2,
    score: Number(score.toFixed(0)),
    layman:
      iv != null && iv < 0.28
        ? "Options look cheap."
        : iv != null && iv > 0.5
          ? "Options are expensive."
          : "Vol is ordinary.",
    detail: bits.join(" · "),
    observed: true,
  };
}

export function scoreFlow(): Pillar {
  return {
    id: "flow",
    name: "Smart money",
    weight: 0.18,
    score: null,
    layman: "Skipped — no insider feed.",
    detail: "",
    observed: false,
  };
}

export function scoreCatalyst(news: NewsItem[]): Pillar {
  const observed = news.length > 0;
  const score = observed ? clamp(40 + Math.min(news.length, 8) * 5) : null;
  return {
    id: "catalyst",
    name: "News",
    weight: 0.22,
    score,
    layman: observed
      ? `${news.length} recent headlines.`
      : "Quiet. No headlines.",
    detail: "",
    observed,
  };
}

export function scoreSafety(options: OptionSnapshot | null): Pillar {
  const hasChain = Boolean(options && (options.calls.length || options.puts.length));
  if (!hasChain) {
    return {
      id: "safety",
      name: "Protection",
      weight: 0.18,
      score: null,
      layman: "No options chain.",
      detail: "",
      observed: false,
    };
  }
  const liquid = [...(options?.calls ?? []), ...(options?.puts ?? [])].filter(
    (c) => (c.bid ?? 0) > 0 && (c.ask ?? 0) > 0,
  );
  const score = clamp(35 + Math.min(liquid.length, 40));
  return {
    id: "safety",
    name: "Protection",
    weight: 0.18,
    score,
    layman: "You can cap risk with a spread.",
    detail: "",
    observed: true,
  };
}

function trendWord(up: boolean, down: boolean): "up" | "down" | "flat" {
  if (up) return "up";
  if (down) return "down";
  return "flat";
}

function rsiWord(rsi: number): string {
  if (rsi >= 75) return `RSI ${rsi.toFixed(0)} — overbought.`;
  if (rsi <= 30) return `RSI ${rsi.toFixed(0)} — oversold.`;
  if (rsi >= 60) return `RSI ${rsi.toFixed(0)} — firm, not blown off.`;
  if (rsi <= 40) return `RSI ${rsi.toFixed(0)} — soft, not washed out.`;
  return `RSI ${rsi.toFixed(0)} — mid-range.`;
}

function rangeWord(rangePct: number | null): string {
  if (rangePct == null) return "52-week range is missing.";
  if (rangePct >= 92) return `Price is ${rangePct.toFixed(0)}% of the 52-week range — stretched.`;
  if (rangePct <= 12) return `Price is ${rangePct.toFixed(0)}% of the 52-week range — near the lows.`;
  return `Price is ${rangePct.toFixed(0)}% of the 52-week range — not stretched.`;
}

function dayWord(changePct: number): string {
  if (changePct <= -2.5) return `Today ${changePct.toFixed(1)}% — selling.`;
  if (changePct >= 2.5) return `Today +${changePct.toFixed(1)}% — buying.`;
  if (changePct >= 0) return `Today ${changePct.toFixed(1)}% — holding up.`;
  return `Today ${changePct.toFixed(1)}% — a quiet red day.`;
}

function makeCall(
  action: ActionCall["action"],
  why: string,
  reasons: string[],
): ActionCall {
  const labels = { buy: "Buy", watch: "Watch", wait: "Wait", avoid: "Avoid" } as const;
  return { action, label: labels[action], why, reasons };
}

export function decideAction(quote: Quote, options?: OptionSnapshot | null): ActionCall {
  const rsi = rsi14(quote.closes);
  const e20 = ema(quote.closes, 20);
  const e50 = ema(quote.closes, 50);
  const high = quote.high52;
  const low = quote.low52;
  const rangePct =
    high != null && low != null && high > low
      ? ((quote.price - low) / (high - low)) * 100
      : null;
  const iv = options?.atmIv ?? null;

  if (quote.closes.length < 20 || e20 == null || e50 == null || rsi == null) {
    return makeCall("wait", "Not enough daily history to take a side.", [
      "Need about 50 sessions for a 20/50-day trend.",
      "Without that, a Buy or Avoid would just be a guess.",
    ]);
  }

  const up = e20 > e50;
  const down = e20 < e50 * 0.995;
  const stretched = rangePct != null && rangePct >= 92;
  const washed = rangePct != null && rangePct <= 12;
  const hot = rsi >= 75;
  const cold = rsi <= 30;
  const dump = quote.changePct <= -2.5;
  const richVol = iv != null && iv >= 0.55;
  const trend = trendWord(up, down);

  const facts = [
    trend === "up"
      ? "20-day average is above the 50-day — trend is up."
      : trend === "down"
        ? "20-day average is below the 50-day — trend is down."
        : "20-day and 50-day averages are flat — no trend.",
    rsiWord(rsi),
    rangeWord(rangePct),
    dayWord(quote.changePct),
  ];
  if (iv != null) {
    facts.push(
      richVol
        ? `ATM options IV ${(iv * 100).toFixed(0)}% — expensive.`
        : `ATM options IV ${(iv * 100).toFixed(0)}%.`,
    );
  }

  if (down && dump) {
    return makeCall("avoid", "Trend is down and today is selling. Don't catch this.", facts);
  }
  if (down && !cold) {
    return makeCall("avoid", "Trend is down and it isn't washed out. Stand aside.", facts);
  }
  if (down && cold) {
    return makeCall("watch", "Downtrend, but it's washed out. Wait for a turn, don't short the low.", facts);
  }
  if (up && stretched && hot) {
    return makeCall("wait", "Uptrend, but it's too extended to pay up here.", facts);
  }
  if (up && hot) {
    return makeCall("watch", "Uptrend, but RSI is hot. Add to the list — don't chase.", facts);
  }
  if (up && richVol) {
    return makeCall("watch", "Trend is fine. Options are rich, so don't pay up for premium.", facts);
  }
  if (up && rsi >= 40 && rsi <= 74 && !stretched) {
    return makeCall("buy", "Uptrend, momentum is healthy, and it isn't stretched.", facts);
  }
  if (up && washed) {
    return makeCall("watch", "Uptrend, but price is sitting near the lows. Wait for it to hold.", facts);
  }
  if (up) {
    return makeCall("watch", "Trend is up, but the entry isn't clean yet.", facts);
  }
  if (cold) {
    return makeCall("watch", "No trend, but it's oversold. Wait for a bounce to confirm.", facts);
  }
  return makeCall("wait", "Sideways tape. No reason to act today.", facts);
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
  const call = decideAction(quote, options);
  return {
    symbol: quote.symbol,
    composite,
    verdict: call.why,
    call,
    pillars,
    provenanceNotes: [],
  };
}

