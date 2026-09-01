import { describe, it, expect } from 'vitest';
import { 
  calculateBlackScholes, 
  calculateImpliedVolatility, 
  calculateIVRank, 
  cdfNormal 
} from '@/lib/quant/blackScholes';

describe('Black-Scholes-Merton Pricing & Greeks Engine', () => {
  it('should accurately calculate Normal CDF Φ(0) = 0.5', () => {
    const cdfZero = cdfNormal(0);
    expect(cdfZero).toBeCloseTo(0.5, 4);
  });

  it('should accurately price European At-the-Money Call Options', () => {
    // type = 'call', S = 100, K = 100, T = 1.0 (1 year), r = 0.05, sigma = 0.20 (20%), q = 0
    const result = calculateBlackScholes('call', 100, 100, 1.0, 0.05, 0.20, 0);

    // Standard theoretical Black-Scholes call price is approx $10.45
    expect(result.theoreticalPrice).toBeGreaterThan(9.5);
    expect(result.theoreticalPrice).toBeLessThan(11.5);

    // Call Delta should be between 0.50 and 0.70
    expect(result.greeks.delta).toBeGreaterThan(0.5);
    expect(result.greeks.delta).toBeLessThan(0.7);

    // Gamma, Vega, Theta must be proper sign
    expect(result.greeks.gamma).toBeGreaterThan(0);
    expect(result.greeks.vega).toBeGreaterThan(0);
    expect(result.greeks.theta).toBeLessThan(0); // Daily decay is negative
  });

  it('should accurately solve Implied Volatility via continuous Newton-Raphson', () => {
    // S = 100, K = 100, T = 1.0, r = 0.05, marketPrice = 10.45
    const solvedIV = calculateImpliedVolatility(10.45, 'call', 100, 100, 1.0, 0.05, 0);

    // Should converge back to ~0.20 (20%)
    expect(solvedIV).toBeGreaterThan(0.18);
    expect(solvedIV).toBeLessThan(0.22);
  });

  it('should compute IV Rank correctly', () => {
    const ivr = calculateIVRank(40, 20, 60);
    expect(ivr).toBe(50); // (40-20)/(60-20) * 100 = 50%
  });
});
