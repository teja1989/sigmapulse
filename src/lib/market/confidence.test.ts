import assert from "node:assert/strict";
import { test } from "node:test";
import { coilHistory, rsiMood, scoreConfidence } from "./confidence.ts";
import { scorePotential } from "./setup.ts";
import type { Quote } from "./types.ts";

function quote(closes: number[], extra: Partial<Quote> = {}): Quote {
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
    high52: Math.max(...closes) * 1.2,
    low52: Math.min(...closes) * 0.9,
    marketCap: null,
    cap: null,
    marketState: "REGULAR",
    sparkline: closes,
    timestamps: closes.map((_, i) => i),
    closes,
    provenance: { kind: "derived", label: "test", asOf: null },
    ...extra,
  };
}

function coilThenJump(cycles = 4): number[] {
  const out: number[] = [];
  let px = 100;
  for (let c = 0; c < cycles; c++) {
    for (let i = 0; i < 40; i++) {
      px = px * (1 + (i % 2 === 0 ? 0.018 : -0.017));
      out.push(px);
    }
    for (let i = 0; i < 12; i++) {
      px = px * (1 + (i % 2 === 0 ? 0.001 : -0.001));
      out.push(px);
    }
    for (let i = 0; i < 10; i++) {
      px = px * 1.012;
      out.push(px);
    }
  }
  for (let i = 0; i < 40; i++) {
    px = px * (1 + (i % 2 === 0 ? 0.018 : -0.017));
    out.push(px);
  }
  for (let i = 0; i < 16; i++) {
    px = px * (1 + (i % 2 === 0 ? 0.0008 : -0.0008));
    out.push(px);
  }
  return out;
}

test("RSI mood buckets: tired / washed / healthy / soft", () => {
  assert.equal(rsiMood(78), "tired");
  assert.equal(rsiMood(70), "tired");
  assert.equal(rsiMood(24), "washed");
  assert.equal(rsiMood(30), "washed");
  assert.equal(rsiMood(52), "healthy");
  assert.equal(rsiMood(40), "healthy");
  assert.equal(rsiMood(68), "healthy");
  assert.equal(rsiMood(69), "soft");
  assert.equal(rsiMood(35), "soft");
});

test("coil history records paid expansions after quiet", () => {
  const h = coilHistory(coilThenJump(4));
  assert.ok(h.samples >= 3, `samples ${h.samples}`);
  assert.ok((h.hitRate ?? 0) >= 50, `hitRate ${h.hitRate}`);
  assert.ok((h.medianFwd ?? 0) > 0, `median ${h.medianFwd}`);
  assert.match(h.sentence, /of \d+ past coils paid/i);
});

test("a noisy grind has no past coils", () => {
  const closes = Array.from({ length: 90 }, (_, i) => 80 + i * 0.15 + (i % 2 === 0 ? 1.8 : -1.8));
  const h = coilHistory(closes);
  assert.equal(h.samples, 0);
  assert.match(h.sentence, /no hit rate/i);
});

test("four agrees on an uptrend coil that has paid", () => {
  const closes = coilThenJump(4);
  const q = quote(closes);
  const setup = scorePotential(q);
  const conf = scoreConfidence(q, setup);
  assert.equal(conf.of, 4);
  assert.equal(conf.agreed, 4, `${conf.sentence} | rsi=${conf.rsi.value} ${conf.rsi.mood} | votes=${conf.votes.map((v) => `${v.id}:${v.yes}`).join(",")}`);
  assert.equal(conf.score, 100);
  assert.equal(conf.rsi.mood, "healthy");
  assert.match(conf.sentence, /jump, not a chase/i);
});

test("tired RSI caps confidence even if trend is up", () => {
  const base = Array.from({ length: 50 }, (_, i) => 80 + i * 0.8);
  const q = quote(base, { changePct: 2.4 });
  const setup = scorePotential(q);
  const conf = scoreConfidence(q, setup);
  assert.equal(conf.rsi.mood, "tired");
  assert.equal(conf.votes.find((v) => v.id === "rsi")?.yes, false);
  assert.ok(conf.score <= 50, String(conf.score));
  assert.match(conf.sentence, /tired/i);
});

test("downtrend caps confidence", () => {
  const closes = Array.from({ length: 60 }, (_, i) => 160 - i * 0.7);
  const q = quote(closes, { changePct: -1.2, high52: 180, low52: 90 });
  const setup = scorePotential(q);
  const conf = scoreConfidence(q, setup);
  assert.equal(conf.votes.find((v) => v.id === "trend")?.yes, false);
  assert.ok(conf.score <= 45, String(conf.score));
});
