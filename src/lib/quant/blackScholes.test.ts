import assert from "node:assert/strict";
import { test } from "node:test";
import {
  calculateBlackScholes,
  calculateIVRank,
  calculateImpliedVolatility,
  cdfNormal,
} from "./blackScholes.ts";

test("normal CDF at 0 is 0.5", () => {
  assert.ok(Math.abs(cdfNormal(0) - 0.5) < 1e-4);
});

test("ATM 1y 20% vol call prices near 10.45", () => {
  const result = calculateBlackScholes("call", 100, 100, 1, 0.05, 0.2, 0);
  assert.ok(result.theoreticalPrice > 9.5 && result.theoreticalPrice < 11.5);
  assert.ok(result.greeks.delta > 0.5 && result.greeks.delta < 0.7);
  assert.ok(result.greeks.gamma > 0);
  assert.ok(result.greeks.vega > 0);
  assert.ok(result.greeks.theta < 0);
});

test("IV solver recovers ~20% from the ATM call", () => {
  const iv = calculateImpliedVolatility(10.45, "call", 100, 100, 1, 0.05, 0);
  assert.ok(iv > 0.18 && iv < 0.22);
});

test("IV rank midpoint", () => {
  assert.equal(calculateIVRank(40, 20, 60), 50);
});
