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
    return { action: "wait", label: "Wait", why: "Not enough tape yet." };
  }

  const up = e20 > e50;
  const down = e20 < e50 * 0.995;
  const stretched = rangePct != null && rangePct >= 92;
  const washed = rangePct != null && rangePct <= 12;
  const hot = rsi >= 75;
  const cold = rsi <= 30;
  const dump = quote.changePct <= -2.5;
  const richVol = iv != null && iv >= 0.55;

  if (down && dump) {
    return { action: "avoid", label: "Avoid", why: "Trend and today both point down." };
  }
  if (down && !cold) {
    return { action: "avoid", label: "Avoid", why: "Trend is down." };
  }
  if (down && cold) {
    return { action: "watch", label: "Watch", why: "Washed out. Wait for a turn." };
  }
  if (up && stretched && hot) {
    return { action: "wait", label: "Wait", why: "Too extended. Let it cool." };
  }
  if (up && hot) {
    return { action: "watch", label: "Watch", why: "Hot. Add it, don’t chase." };
  }
  if (up && richVol) {
    return { action: "watch", label: "Watch", why: "Trend is fine. Options are expensive." };
  }
  if (up && rsi >= 40 && rsi <= 74 && !stretched) {
    return { action: "buy", label: "Buy", why: "Uptrend and not stretched." };
  }
  if (up && washed) {
    return { action: "watch", label: "Watch", why: "Uptrend, sitting near the lows." };
  }
  if (up) {
    return { action: "watch", label: "Watch", why: "Uptrend, but the entry isn’t clean." };
  }
  if (cold) {
    return { action: "watch", label: "Watch", why: "Oversold. Wait for a bounce." };
  }
  return { action: "wait", label: "Wait", why: "Sideways. No reason to act." };
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

