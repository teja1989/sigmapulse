import assert from "node:assert/strict";
import { test } from "node:test";
import { ema, realizedVol, rsi14, scoreFlow, scoreTrend } from "./pillars.ts";
import type { Quote } from "./types.ts";

function quote(closes: number[]): Quote {
  const price = closes[closes.length - 1];
  return {
    symbol: "TEST",
    name: "Test",
    exchange: "NMS",
    currency: "USD",
    price,
    prevClose: closes[closes.length - 2] ?? price,
    change: 0,
    changePct: 0,
    volume: 1,
    avgVolume: 1,
    high52: Math.max(...closes),
    low52: Math.min(...closes),
    marketState: "REGULAR",
    sparkline: closes,
    closes,
    timestamps: closes.map((_, i) => i),
    provenance: { kind: "derived", label: "test", asOf: null },
  };
}

test("RSI of a flat series sits near 50", () => {
  const closes = Array.from({ length: 30 }, () => 100);
  const rsi = rsi14(closes);
  assert.ok(rsi != null && rsi > 45 && rsi < 55);
});

test("realized vol is null without enough history", () => {
  assert.equal(realizedVol([1, 2, 3], 20), null);
});

test("EMA follows a rising series", () => {
  const closes = Array.from({ length: 40 }, (_, i) => 100 + i);
  const e = ema(closes, 20);
  assert.ok(e != null && e > 110);
});

test("trend pillar is unobserved on short history", () => {
  const p = scoreTrend(quote([100, 101, 102]));
  assert.equal(p.observed, false);
  assert.equal(p.score, null);
});

test("flow pillar stays unobserved", () => {
  const p = scoreFlow();
  assert.equal(p.observed, false);
  assert.equal(p.score, null);
});
