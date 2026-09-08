import assert from "node:assert/strict";
import { test } from "node:test";
import { alignedReturns, corrMeaning, correlate, pearson } from "./correlate.ts";
import type { Quote } from "./types.ts";

function series(symbol: string, closes: number[]): Quote {
  const start = Date.UTC(2026, 0, 2) / 1000;
  return {
    symbol,
    name: symbol,
    exchange: "NMS",
    currency: "USD",
    price: closes[closes.length - 1],
    prevClose: closes[closes.length - 2] ?? closes[closes.length - 1],
    change: 0,
    changePct: 1.2,
    volume: 1,
    avgVolume: 1,
    high52: Math.max(...closes),
    low52: Math.min(...closes),
    marketCap: null,
    cap: null,
    marketState: "CLOSED",
    sparkline: closes,
    closes,
    timestamps: closes.map((_, i) => start + i * 86400),
    provenance: { kind: "derived", label: "test", asOf: null },
  };
}

test("pearson of identical series is 1", () => {
  const xs = Array.from({ length: 20 }, (_, i) => Math.sin(i / 3));
  const r = pearson(xs, xs);
  assert.ok(r != null && r > 0.99);
});

test("pearson of inverse series is near -1", () => {
  const xs = Array.from({ length: 20 }, (_, i) => i);
  const ys = xs.map((x) => -x);
  const r = pearson(xs, ys);
  assert.ok(r != null && r < -0.99);
});

test("aligned returns skip a missing day on the peer", () => {
  const a = series("NVDA", [100, 101, 102, 103, 104, 106, 108, 110, 111, 112, 113, 114]);
  const b = series("SPY", [200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211]);
  b.timestamps = b.timestamps.filter((_, i) => i !== 4);
  b.closes = b.closes.filter((_, i) => i !== 4);
  const { ra, rb } = alignedReturns(a, b);
  assert.equal(ra.length, rb.length);
  assert.ok(ra.length >= 9);
});

test("correlate ranks the tighter peer first", () => {
  const base = Array.from({ length: 40 }, (_, i) => 100 + i * 0.4 + Math.sin(i));
  const tight = base.map((x) => x * 1.01);
  const loose = base.map((x, i) => 80 + (i % 7) * 3);
  const q = series("NVDA", base);
  const rows = correlate(q, [series("AMD", tight), series("JPM", loose)]);
  assert.equal(rows[0].symbol, "AMD");
  assert.ok((rows[0].corr ?? 0) > (rows[1].corr ?? 0));
});

test("corr meaning is English", () => {
  assert.equal(corrMeaning(0.82), "Usually moves together");
  assert.equal(corrMeaning(-0.2), "Goes its own way");
});
