import assert from "node:assert/strict";
import { test } from "node:test";
import { decideAction, ema, realizedVol, rsi14, scoreFlow, scoreTrend } from "./pillars.ts";
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
    marketCap: null,
    cap: null,
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

test("rising unstretched series is Buy", () => {
  const base = Array.from({ length: 46 }, (_, i) => 80 + i * 0.35);
  const tail = [96, 96.4, 96.1, 96.8, 96.5, 97.1, 96.8, 97.4, 97.1, 97.6, 97.3, 97.9, 97.5, 98];
  const closes = [...base, ...tail];
  const q = quote(closes);
  q.low52 = 70;
  q.high52 = 130;
  q.price = 98;
  q.changePct = 0.3;
  const call = decideAction(q);
  assert.equal(call.action, "buy", call.why);
  assert.ok(call.reasons.length >= 3, "buy should list the checks");
  assert.ok(call.reasons.some((r) => /trend is up/i.test(r)));
});

test("hard downtrend is Avoid", () => {
  const head = Array.from({ length: 46 }, (_, i) => 140 - i * 0.2);
  // grind down with enough bounces that RSI is not washed out
  const last = [131, 131.8, 131.2, 132, 131.4, 131.9, 131.1, 131.6, 130.8, 131.3, 130.6, 131.1, 130.4, 130.9];
  const q = quote([...head, ...last]);
  q.changePct = -0.4;
  const call = decideAction(q);
  assert.equal(call.action, "avoid", call.why);
  assert.ok(call.reasons.some((r) => /trend is down/i.test(r)));
});

test("short history is Wait", () => {
  const call = decideAction(quote([100, 101, 102]));
  assert.equal(call.action, "wait");
});


