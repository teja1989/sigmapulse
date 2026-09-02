import assert from "node:assert/strict";
import { test } from "node:test";
import { isJump, scorePotential } from "./setup.ts";
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
    high52: 200,
    low52: 50,
    marketCap: null,
    cap: null,
    marketState: "REGULAR",
    sparkline: closes,
    closes,
    timestamps: closes.map((_, i) => i),
    provenance: { kind: "derived", label: "test", asOf: null },
    ...extra,
  };
}

test("price at the high is Spent — chasing, not jumping", () => {
  const closes = Array.from({ length: 60 }, (_, i) => 80 + i * 2);
  const q = quote(closes, { price: 200, high52: 200, low52: 80 });
  const p = scorePotential(q);
  assert.equal(p.kind, "spent");
  assert.equal(p.gainPct, 0);
});

test("quiet tape below the high is Coil", () => {
  const wild = Array.from({ length: 45 }, (_, i) => 100 + Math.sin(i) * 12);
  const quiet = Array.from({ length: 12 }, () => 110);
  const q = quote([...wild, ...quiet], { price: 110, high52: 160, low52: 80 });
  const p = scorePotential(q);
  assert.equal(p.kind, "coil");
  assert.ok((p.gainPct ?? 0) > 8);
});

test("name lagging the index with room is Lag", () => {
  const name = Array.from({ length: 30 }, (_, i) => 100 - i * 0.4);
  const spy = Array.from({ length: 30 }, (_, i) => 100 + i * 0.3);
  const q = quote(name, { price: name[name.length - 1], high52: 140, low52: 70 });
  const idx = quote(spy, { symbol: "SPY", price: spy[spy.length - 1] });
  const p = scorePotential(q, idx);
  assert.equal(p.kind, "lag");
  assert.ok((p.vsIndexPct ?? 0) < -4);
});

test("near the lows is Wash", () => {
  const closes = Array.from({ length: 40 }, (_, i) => 120 - i);
  const last = closes[closes.length - 1];
  const q = quote(closes, { price: last, high52: 200, low52: last - 1 });
  const p = scorePotential(q);
  assert.equal(p.kind, "wash");
});

test("coil and lag are the jump setups, spent is not", () => {
  const wild = Array.from({ length: 45 }, (_, i) => 100 + Math.sin(i) * 12);
  const quiet = Array.from({ length: 12 }, () => 110);
  const coil = scorePotential(quote([...wild, ...quiet], { price: 110, high52: 160, low52: 80 }));
  const spent = scorePotential(quote(Array.from({ length: 60 }, (_, i) => 80 + i * 2), { price: 200, high52: 200, low52: 80 }));
  assert.equal(coil.kind, "coil");
  assert.equal(isJump(coil), true);
  assert.equal(isJump(spent), false);
});
