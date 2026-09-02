import { fetchJson, yahooHosts } from "./http";
import { capFromMarketCap } from "./sectors";
import type { NewsItem, OptionContract, OptionSnapshot, Provenance, Quote } from "./types";

interface YahooChart {
  chart?: {
    result?: Array<{
      meta?: {
        symbol?: string;
        shortName?: string;
        longName?: string;
        exchangeName?: string;
        currency?: string;
        regularMarketPrice?: number;
        chartPreviousClose?: number;
        previousClose?: number;
        regularMarketVolume?: number;
        averageDailyVolume10Day?: number;
        fiftyTwoWeekHigh?: number;
        fiftyTwoWeekLow?: number;
        marketState?: string;
        regularMarketTime?: number;
      };
      timestamp?: number[];
      indicators?: { quote?: Array<{ close?: Array<number | null>; volume?: Array<number | null> }> };
    }>;
  };
}

interface YahooOptions {
  optionChain?: {
    result?: Array<{
      expirationDates?: number[];
      quote?: { symbol?: string };
      options?: Array<{
        expirationDate?: number;
        calls?: YahooContract[];
        puts?: YahooContract[];
      }>;
    }>;
  };
}

interface YahooContract {
  contractSymbol?: string;
  strike?: number;
  expiration?: number;
  lastPrice?: number;
  bid?: number;
  ask?: number;
  volume?: number;
  openInterest?: number;
  impliedVolatility?: number;
  inTheMoney?: boolean;
}

interface YahooSearch {
  news?: Array<{
    uuid?: string;
    title?: string;
    publisher?: string;
    link?: string;
    providerPublishTime?: number;
    relatedTickers?: string[];
  }>;
}

function nowIso() {
  return new Date().toISOString();
}

function delayed(label: string): Provenance {
  return { kind: "yahoo-delayed", label, asOf: nowIso() };
}

function normalizeSymbol(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9.-]/g, "").slice(0, 12);
}

export async function fetchQuote(symbolRaw: string, range = "6mo"): Promise<Quote | null> {
  const symbol = normalizeSymbol(symbolRaw);
  if (!symbol) return null;
  const data = await fetchJson<YahooChart>(
    yahooHosts(`/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=${range}`),
    45_000,
  );
  const result = data?.chart?.result?.[0];
  const meta = result?.meta;
  if (!result || !meta) return null;

  const price = Number(meta.regularMarketPrice ?? meta.chartPreviousClose ?? NaN);
  if (!Number.isFinite(price)) return null;
  const prevClose = Number(meta.chartPreviousClose ?? meta.previousClose ?? price);
  const change = price - prevClose;
  const changePct = prevClose ? (change / prevClose) * 100 : 0;
  const closes = (result.indicators?.quote?.[0]?.close ?? []).filter(
    (n): n is number => typeof n === "number" && Number.isFinite(n),
  );
  const timestamps = result.timestamp ?? [];
  const asOf = meta.regularMarketTime
    ? new Date(meta.regularMarketTime * 1000).toISOString()
    : nowIso();

  return {
    symbol,
    name: meta.longName || meta.shortName || symbol,
    exchange: meta.exchangeName || "US",
    currency: meta.currency || "USD",
    price: Number(price.toFixed(4)),
    prevClose: Number(prevClose.toFixed(4)),
    change: Number(change.toFixed(4)),
    changePct: Number(changePct.toFixed(3)),
    volume: meta.regularMarketVolume ?? null,
    avgVolume: meta.averageDailyVolume10Day ?? null,
    high52: meta.fiftyTwoWeekHigh ?? null,
    low52: meta.fiftyTwoWeekLow ?? null,
    marketCap: null,
    cap: null,
    marketState: meta.marketState || "UNKNOWN",
    sparkline: closes.slice(-30),
    closes,
    timestamps,
    provenance: {
      kind: "yahoo-delayed",
      label: "Yahoo Finance delayed quote",
      asOf,
    },
  };
}

function mapContract(
  row: YahooContract,
  type: "call" | "put",
  expirationIso: string,
): OptionContract | null {
  const strike = Number(row.strike);
  if (!Number.isFinite(strike)) return null;
  const bid = row.bid ?? null;
  const ask = row.ask ?? null;
  const last = row.lastPrice ?? null;
  const mid =
    bid != null && ask != null && bid > 0 && ask > 0 ? (bid + ask) / 2 : (last ?? bid ?? ask);
  const volume = Number(row.volume ?? 0);
  const openInterest = Number(row.openInterest ?? 0);
  const unusualScore = volume / Math.max(openInterest, 50);
  return {
    contractSymbol: row.contractSymbol || `${type}-${strike}`,
    type,
    strike,
    expiration: expirationIso,
    last,
    bid,
    ask,
    mid: mid != null ? Number(mid) : null,
    volume,
    openInterest,
    iv: typeof row.impliedVolatility === "number" ? row.impliedVolatility : null,
    inTheMoney: Boolean(row.inTheMoney),
    unusualScore,
  };
}

export async function fetchOptions(symbolRaw: string): Promise<OptionSnapshot | null> {
  const symbol = normalizeSymbol(symbolRaw);
  if (!symbol) return null;
  const data = await fetchJson<YahooOptions>(
    yahooHosts(`/v7/finance/options/${encodeURIComponent(symbol)}`),
    30_000,
    8_000,
  );
  const chain = data?.optionChain?.result?.[0];
  if (!chain) return null;
  const slice = chain.options?.[0];
  const expSec = slice?.expirationDate ?? chain.expirationDates?.[0];
  const expiration = expSec ? new Date(expSec * 1000).toISOString().slice(0, 10) : null;
  const expirations = (chain.expirationDates ?? []).map((s) =>
    new Date(s * 1000).toISOString().slice(0, 10),
  );
  const calls = (slice?.calls ?? [])
    .map((c) => mapContract(c, "call", expiration ?? ""))
    .filter((c): c is OptionContract => Boolean(c));
  const puts = (slice?.puts ?? [])
    .map((c) => mapContract(c, "put", expiration ?? ""))
    .filter((c): c is OptionContract => Boolean(c));
  const unusual = [...calls, ...puts]
    .filter((c) => c.volume >= 200 && c.unusualScore >= 1.2)
    .sort((a, b) => b.unusualScore - a.unusualScore)
    .slice(0, 40);

  const quote = await fetchQuote(symbol, "5d");
  const spot = quote?.price;
  const atmCandidates = [...calls, ...puts].filter((c) => c.iv && c.iv > 0.01);
  let atmIv: number | null = null;
  if (spot && atmCandidates.length) {
    const nearest = atmCandidates.reduce((best, cur) =>
      Math.abs(cur.strike - spot) < Math.abs(best.strike - spot) ? cur : best,
    );
    atmIv = nearest.iv;
  }

  return {
    symbol,
    expiration,
    expirations,
    calls,
    puts,
    unusual,
    atmIv,
    provenance: {
      kind: "yahoo-options",
      label: "Yahoo Finance options chain (delayed)",
      asOf: nowIso(),
    },
  };
}

export async function fetchNews(query = "US stocks"): Promise<NewsItem[]> {
  const data = await fetchJson<YahooSearch>(
    yahooHosts(
      `/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=0&newsCount=20&enableFuzzyQuery=false`,
    ),
    60_000,
  );
  const news = data?.news ?? [];
  const provenance: Provenance = {
    kind: "yahoo-news",
    label: "Yahoo Finance news search",
    asOf: nowIso(),
  };
  return news
    .filter((n) => n.title && n.link)
    .map((n) => ({
      id: n.uuid || n.link || n.title || crypto.randomUUID(),
      title: n.title || "Untitled",
      publisher: n.publisher || "Yahoo Finance",
      url: n.link || "",
      publishedAt: n.providerPublishTime
        ? new Date(n.providerPublishTime * 1000).toISOString()
        : null,
      related: n.relatedTickers ?? [],
      provenance,
    }));
}

interface YahooQuoteResponse {
  quoteResponse?: {
    result?: Array<{ symbol?: string; marketCap?: number }>;
  };
}

export async function fetchMarketCaps(symbols: readonly string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (!symbols.length) return map;
  const unique = [...new Set(symbols.map((s) => s.toUpperCase()))];
  const data = await fetchJson<YahooQuoteResponse>(
    yahooHosts(`/v7/finance/quote?symbols=${encodeURIComponent(unique.join(","))}`),
    30_000,
  );
  for (const row of data?.quoteResponse?.result ?? []) {
    const symbol = row.symbol?.toUpperCase();
    if (symbol && typeof row.marketCap === "number" && row.marketCap > 0) {
      map.set(symbol, row.marketCap);
    }
  }
  return map;
}

export async function fetchQuotes(symbols: readonly string[]): Promise<Quote[]> {
  const unique = [...new Set(symbols.map((s) => s.toUpperCase()).filter(Boolean))];
  const rows = await mapPool(unique, 10, (s) => fetchQuote(s, "3mo"));
  const out = rows.filter((row): row is Quote => Boolean(row));
  const caps = await fetchMarketCaps(out.map((q) => q.symbol));
  for (const q of out) {
    q.marketCap = caps.get(q.symbol) ?? null;
    q.cap = capFromMarketCap(q.marketCap);
  }
  return out;
}

async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  }
  const n = Math.min(Math.max(limit, 1), items.length || 1);
  await Promise.all(Array.from({ length: n }, () => worker()));
  return out;
}

export { delayed, normalizeSymbol };
