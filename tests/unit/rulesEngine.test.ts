import { describe, it, expect } from 'vitest';
import { analyzeTickerSignals } from '@/lib/quant/rulesEngine';

describe('5-Pillar Decision Framework & Quantitative Rules Engine', () => {
  it('should evaluate PLTR with 5 Pillars and calibrated market spot', () => {
    const report = analyzeTickerSignals('PLTR');

    expect(report.ticker).toBe('PLTR');
    expect(report.spotPrice).toBeCloseTo(186.38, 1);
    // NB: previously `> 70`, which the 85-point score floor made impossible to fail.
    // Assert the bounds only; discriminating power is covered in signalIntegrity.test.ts.
    expect(report.compositeScore).toBeGreaterThanOrEqual(0);
    expect(report.compositeScore).toBeLessThanOrEqual(100);

    // Verify 5 pillars exist
    expect(report.fivePillars.trendPillar).toBeDefined();
    expect(report.fivePillars.volatilityPillar).toBeDefined();
    expect(report.fivePillars.insiderPillar).toBeDefined();
    expect(report.fivePillars.catalystPillar).toBeDefined();
    expect(report.fivePillars.riskRewardPillar).toBeDefined();

    // Verify layman summary
    expect(report.laymanOneLiner.length).toBeGreaterThan(15);
    expect(report.recommendedStrategy.maxLoss).toBeGreaterThan(0);
  });

  it('should evaluate arbitrary ticker NFLX with correct baseline', () => {
    const report = analyzeTickerSignals('NFLX');

    expect(report.ticker).toBe('NFLX');
    expect(report.spotPrice).toBeCloseTo(81.05, 1);
    expect(report.fivePillars.trendPillar.score).toBeGreaterThanOrEqual(0);
    expect(report.fivePillars.trendPillar.score).toBeLessThanOrEqual(100);
  });

  it('should cap risk for all recommended strategies (net debit risk limit)', () => {
    const tickers = ['NVDA', 'IONQ', 'LLY', 'MSFT'];
    tickers.forEach((sym) => {
      const rep = analyzeTickerSignals(sym);
      expect(rep.recommendedStrategy.maxLoss).toBeGreaterThan(0);
      // Previously `probabilityOfProfit > 40`, which ASSERTED the inverted PoP as correct.
      // A long call legitimately has PoP below 40; only the bounds are universal.
      expect(rep.recommendedStrategy.probabilityOfProfit).not.toBeNull();
      expect(rep.recommendedStrategy.probabilityOfProfit!).toBeGreaterThanOrEqual(0);
      expect(rep.recommendedStrategy.probabilityOfProfit!).toBeLessThanOrEqual(100);
    });
  });
});
