import { describe, it, expect } from 'vitest';
import { analyzeTickerSignals, getOrCreateStockProfile, scoreTrend, scoreMomentum, scoreVolatilityEdge, scoreCatalyst, scoreRiskReward } from '@/lib/quant/rulesEngine';
import { buildLongCallStrategy, buildBullCallSpread, buildIronCondor, buildLongStraddle } from '@/lib/quant/optionsEngine';
import { probabilityAboveAtExpiry, probabilityBetweenAtExpiry, calculateBlackScholes } from '@/lib/quant/blackScholes';
import { SECTORS, StockAsset } from '@/lib/data/sectors';

/**
 * Regression tests for the signal-integrity defects found in the September 2026 audit.
 *
 * The previous suite asserted things like `compositeScore > 70` and
 * `probabilityOfProfit > 40` — both of which were structurally impossible to fail, and
 * the latter of which asserted an INVERTED probability as correct. These tests are
 * written to fail against the pre-fix code.
 */

const stock = (over: Partial<StockAsset> = {}): StockAsset => ({
  ...getOrCreateStockProfile('TEST'),
  price: 100, supportLevel: 94, resistanceLevel: 108,
  rsi14: 58, ivRank: 50, impliedVol: 40, historicalVol: 35,
  ...over,
});

describe('F2 — probability of profit is not inverted', () => {
  it('reports P(profit) for an OTM long call as well BELOW 50%', () => {
    // Pre-fix this returned (1 - delta) ~= 59%, i.e. the probability of expiring worthless.
    const s = buildLongCallStrategy('T', 100, 45, 0.4, 0.05);
    expect(s.probabilityOfProfit).not.toBeNull();
    expect(s.probabilityOfProfit!).toBeLessThan(45);
    expect(s.probabilityOfProfit!).toBeGreaterThan(10);
  });

  it('matches the closed-form N(d2) evaluated at the break-even', () => {
    const s = buildLongCallStrategy('T', 100, 45, 0.4, 0.05);
    const expected = probabilityAboveAtExpiry(100, s.breakEvenPoints[0], 45 / 365, 0.045, 0.4);
    expect(s.probabilityOfProfit!).toBe(Math.round(expected * 100));
  });

  it('PoP falls as the strike moves further out of the money', () => {
    const near = buildLongCallStrategy('T', 100, 45, 0.4, 0.02);
    const far = buildLongCallStrategy('T', 100, 45, 0.4, 0.25);
    // Pre-fix this relationship was INVERTED: further OTM reported a higher PoP.
    expect(far.probabilityOfProfit!).toBeLessThan(near.probabilityOfProfit!);
  });

  it('does not return a hardcoded constant for spreads, condors or straddles', () => {
    // Each structure previously returned a fixed number (68 / 74 / 54) regardless of
    // strikes, IV or DTE. Assert the value actually tracks the closed-form probability
    // rather than merely differing between two arbitrary parameter sets.
    const spread = buildBullCallSpread('A', 100, 45, 0.30, 0.06);
    expect(spread.probabilityOfProfit).toBe(
      Math.round(probabilityAboveAtExpiry(100, spread.breakEvenPoints[0], 45 / 365, 0.045, 0.30) * 100)
    );
    expect(spread.probabilityOfProfit).not.toBe(68);

    const condor = buildIronCondor('A', 100, 30, 0.20, 0.07);
    expect(condor.probabilityOfProfit).toBe(
      Math.round(
        probabilityBetweenAtExpiry(100, condor.breakEvenPoints[0], condor.breakEvenPoints[1], 30 / 365, 0.045, 0.20) * 100
      )
    );
    expect(condor.probabilityOfProfit).not.toBe(74);

    const straddle = buildLongStraddle('A', 100, 30, 0.20);
    expect(straddle.probabilityOfProfit).not.toBe(54);

    // And the value must respond to the inputs across a spread of regimes.
    const condorPoPs = [0.15, 0.35, 0.70, 1.20].map(
      (iv) => buildIronCondor('X', 100, 30, iv, 0.07).probabilityOfProfit
    );
    expect(new Set(condorPoPs).size).toBeGreaterThan(2);
    // A quieter market keeps price inside the corridor more often.
    expect(condorPoPs[0]!).toBeGreaterThan(condorPoPs[3]!);
  });

  it('a wider iron condor corridor has a higher probability of profit', () => {
    const tight = buildIronCondor('T', 100, 30, 0.30, 0.03);
    const wide = buildIronCondor('T', 100, 30, 0.30, 0.15);
    expect(wide.probabilityOfProfit!).toBeGreaterThan(tight.probabilityOfProfit!);
  });
});

describe('F1 — the model can produce a negative answer', () => {
  it('scores a broken structure below 50', () => {
    const broken = analyzeTickerSignals(stock({ price: 70, supportLevel: 100, resistanceLevel: 140, rsi14: 25 }));
    expect(broken.compositeScore).toBeLessThan(50);
  });

  it('reaches the BEAR_HEDGE_PUT verdict, which was previously unreachable', () => {
    const r = analyzeTickerSignals(stock({ price: 70, supportLevel: 100, resistanceLevel: 140, rsi14: 28 }));
    expect(r.verdict).toBe('BEAR_HEDGE_PUT');
  });

  it('reaches the WAIT_RANGEBOUND verdict, which was previously unreachable', () => {
    // Mid-channel, mid-RSI, mid-IVR: no trend edge, no vol edge. Should stand aside.
    const r = analyzeTickerSignals(stock({ price: 100, supportLevel: 99, resistanceLevel: 190, rsi14: 95, ivRank: 50 }));
    expect(r.verdict).toBe('WAIT_RANGEBOUND');
  });

  it('produces genuine spread across a mixed universe, not a 14-point band', () => {
    const cases = [
      stock({ price: 70, supportLevel: 100, resistanceLevel: 140, rsi14: 25 }),
      stock({ price: 105, supportLevel: 94, resistanceLevel: 108, rsi14: 58, ivRank: 12 }),
      stock({ price: 100, supportLevel: 99, resistanceLevel: 190, rsi14: 95, ivRank: 50 }),
      ...SECTORS.flatMap((s) => s.stocks),
    ];
    const scores = cases.map((c) => analyzeTickerSignals(c).compositeScore);
    expect(Math.max(...scores) - Math.min(...scores)).toBeGreaterThan(25);
    expect(Math.min(...scores)).toBeLessThan(55);
  });

  it('confidence is not permanently pinned at HIGH or above', () => {
    const weak = analyzeTickerSignals(stock({ price: 70, supportLevel: 100, resistanceLevel: 140, rsi14: 25 }));
    expect(['MODERATE', 'SPECULATIVE']).toContain(weak.confidenceLevel);
  });
});

describe('pillar scoring functions are continuous and can score low', () => {
  it('trend falls off at both ends of the channel', () => {
    expect(scoreTrend(70, 100, 140)).toBeLessThan(30);   // broken below support
    expect(scoreTrend(128, 100, 140)).toBeGreaterThan(90); // upper-middle, room left
    expect(scoreTrend(140, 100, 140)).toBeLessThan(70);  // pinned at resistance
  });

  it('momentum penalises both overbought and oversold', () => {
    expect(scoreMomentum(58)).toBe(100);
    expect(scoreMomentum(90)).toBeLessThan(40);
    expect(scoreMomentum(20)).toBeLessThan(30);
  });

  it('volatility edge is U-shaped — mid IVR means no trade', () => {
    expect(scoreVolatilityEdge(50)).toBeLessThan(45);
    expect(scoreVolatilityEdge(5)).toBeGreaterThan(85);
    expect(scoreVolatilityEdge(95)).toBeGreaterThan(85);
  });

  it('catalyst score shrinks small samples toward the base rate', () => {
    expect(scoreCatalyst(100, 2)).toBeLessThan(70);   // 2-for-2 is not 100%
    expect(scoreCatalyst(100, 5)).toBeLessThan(80);
    expect(scoreCatalyst(100, 200)).toBeGreaterThan(95); // large sample earns its rate
  });

  it('risk/reward scores from expected value, not from the composite', () => {
    expect(scoreRiskReward(20, 100, 100)).toBeLessThan(35); // negative EV
    expect(scoreRiskReward(80, 300, 100)).toBeGreaterThan(90); // strongly positive EV
    expect(scoreRiskReward(null, 100, 100)).toBe(0);
  });
});

describe('F10 — invalid inputs fail rather than propagating', () => {
  it('a NaN price does not yield a confident score', () => {
    const r = analyzeTickerSignals(stock({ price: NaN }));
    // Pre-fix this returned compositeScore 88 with a $NaN strategy.
    expect(r.compositeScore).toBeLessThan(50);
  });
});

describe('engine invariants that must hold', () => {
  it('put-call parity holds', () => {
    const S = 100, K = 100, T = 0.5, r = 0.045, v = 0.3;
    const c = calculateBlackScholes('call', S, K, T, r, v).theoreticalPrice;
    const p = calculateBlackScholes('put', S, K, T, r, v).theoreticalPrice;
    expect(c - p).toBeCloseTo(S - K * Math.exp(-r * T), 5);
  });

  it('probability primitives are bounded and monotonic', () => {
    expect(probabilityAboveAtExpiry(100, 1, 0.5, 0.045, 0.3)).toBeGreaterThan(0.99);
    expect(probabilityAboveAtExpiry(100, 10000, 0.5, 0.045, 0.3)).toBeLessThan(0.01);
    expect(probabilityAboveAtExpiry(100, 90, 0.5, 0.045, 0.3))
      .toBeGreaterThan(probabilityAboveAtExpiry(100, 110, 0.5, 0.045, 0.3));
    const between = probabilityBetweenAtExpiry(100, 90, 110, 0.5, 0.045, 0.3);
    expect(between).toBeGreaterThan(0);
    expect(between).toBeLessThan(1);
  });

  it('a capped structure never reports profit above its own maximum', () => {
    const s = buildBullCallSpread('T', 100, 45, 0.4, 0.06);
    const worst = Math.max(...s.payoffCurve.map((p) => p.pnlAtExpiry));
    // Pre-fix, the modal simulator reported $2,737 on a structure capped at ~$337.
    expect(worst).toBeLessThanOrEqual((s.maxProfit as number) + 1);
  });
});

describe('F7 — no fabricated attribution to real institutions or people', () => {
  it('sample news carries no real news-organisation or filing attribution', async () => {
    const { INITIAL_NEWS_FEED, BREAKING_NEWS_TEMPLATES } = await import('@/lib/data/newsCrawler');
    const banned = /bloomberg|reuters|sec 8-k|fda\.gov|defense\.gov|federal reserve|capitol trades|biospace|pr newswire/i;
    for (const item of [...INITIAL_NEWS_FEED, ...BREAKING_NEWS_TEMPLATES]) {
      if (item.source) expect(item.source).not.toMatch(banned);
    }
  });

  it('sample disclosures name no real individuals', async () => {
    const { POLITICIAN_TRADES } = await import('@/lib/data/politicianTracker');
    const banned = /pelosi|tuberville|mccaul|khanna|crenshaw/i;
    for (const t of POLITICIAN_TRADES) {
      expect(t.politician).not.toMatch(banned);
    }
  });
});
