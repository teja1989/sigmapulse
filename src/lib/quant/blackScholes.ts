/**
 * Institutional Black-Scholes-Merton Pricing Model & Greeks Engine
 * Calibrated for Wall Street institutional derivatives desks.
 */

export interface OptionGreeks {
  delta: number;
  gamma: number;
  theta: number; // Daily theta decay ($ per share / day)
  vega: number;  // $ change per 1% change in IV
  rho: number;   // $ change per 1% change in interest rate
}

export interface OptionPricingResult {
  theoreticalPrice: number;
  intrinsicValue: number;
  extrinsicValue: number;
  greeks: OptionGreeks;
  d1: number;
  d2: number;
}

// High-precision cumulative standard normal distribution approximation (Abramowitz & Stegun / Hart)
export function cdfNormal(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x) / Math.SQRT2;

  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

  return 0.5 * (1.0 + sign * y);
}

// Standard normal probability density function
export function pdfNormal(x: number): number {
  return (1.0 / Math.sqrt(2.0 * Math.PI)) * Math.exp(-0.5 * x * x);
}

/**
 * Calculate Black-Scholes price and complete Greeks suite
 * @param type 'call' | 'put'
 * @param S Current underlying spot price
 * @param K Strike price
 * @param T Time to expiration in years (e.g. 30 DTE = 30 / 365)
 * @param r Risk-free rate (e.g. 0.045 for 4.5%)
 * @param sigma Volatility as decimal (e.g. 0.35 for 35%)
 * @param q Continuous dividend yield (default 0.0)
 */
export function calculateBlackScholes(
  type: 'call' | 'put',
  S: number,
  K: number,
  T: number,
  r: number = 0.045,
  sigma: number = 0.30,
  q: number = 0.0
): OptionPricingResult {
  // Edge cases
  if (T <= 0.0001) {
    const intrinsic = type === 'call' ? Math.max(0, S - K) : Math.max(0, K - S);
    return {
      theoreticalPrice: intrinsic,
      intrinsicValue: intrinsic,
      extrinsicValue: 0,
      greeks: {
        delta: type === 'call' ? (S >= K ? 1 : 0) : (S <= K ? -1 : 0),
        gamma: 0,
        theta: 0,
        vega: 0,
        rho: 0,
      },
      d1: 0,
      d2: 0,
    };
  }

  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;

  const expNegQT = Math.exp(-q * T);
  const expNegRT = Math.exp(-r * T);

  const nd1 = cdfNormal(d1);
  const nd2 = cdfNormal(d2);
  const nNegD1 = cdfNormal(-d1);
  const nNegD2 = cdfNormal(-d2);
  const pdfD1 = pdfNormal(d1);

  let theoreticalPrice = 0;
  let delta = 0;
  let thetaAnnual = 0;
  let rho = 0;

  if (type === 'call') {
    theoreticalPrice = S * expNegQT * nd1 - K * expNegRT * nd2;
    delta = expNegQT * nd1;
    thetaAnnual =
      -(S * expNegQT * pdfD1 * sigma) / (2 * sqrtT) -
      r * K * expNegRT * nd2 +
      q * S * expNegQT * nd1;
    rho = (K * T * expNegRT * nd2) * 0.01; // 1% change
  } else {
    theoreticalPrice = K * expNegRT * nNegD2 - S * expNegQT * nNegD1;
    delta = -expNegQT * nNegD1;
    thetaAnnual =
      -(S * expNegQT * pdfD1 * sigma) / (2 * sqrtT) +
      r * K * expNegRT * nNegD2 -
      q * S * expNegQT * nNegD1;
    rho = (-K * T * expNegRT * nNegD2) * 0.01; // 1% change
  }

  // Common Greeks
  const gamma = (expNegQT * pdfD1) / (S * sigma * sqrtT);
  const vega = (S * expNegQT * pdfD1 * sqrtT) * 0.01; // 1% change in vol (0.01)
  const thetaDaily = thetaAnnual / 365;

  const intrinsicValue = type === 'call' ? Math.max(0, S - K) : Math.max(0, K - S);
  const extrinsicValue = Math.max(0, theoreticalPrice - intrinsicValue);

  return {
    theoreticalPrice: Math.max(0.01, theoreticalPrice),
    intrinsicValue,
    extrinsicValue,
    greeks: {
      delta: Number(delta.toFixed(4)),
      gamma: Number(gamma.toFixed(5)),
      theta: Number(thetaDaily.toFixed(4)),
      vega: Number(vega.toFixed(4)),
      rho: Number(rho.toFixed(4)),
    },
    d1: Number(d1.toFixed(4)),
    d2: Number(d2.toFixed(4)),
  };
}

/**
 * Implied Volatility Solver using Newton-Raphson method with Bisection fallback
 */
export function calculateImpliedVolatility(
  marketPrice: number,
  type: 'call' | 'put',
  S: number,
  K: number,
  T: number,
  r: number = 0.045,
  q: number = 0.0
): number {
  if (T <= 0.001 || marketPrice <= 0) return 0.20;

  // Intrinsic lower bound check
  const intrinsic = type === 'call' ? Math.max(0, S - K) : Math.max(0, K - S);
  if (marketPrice < intrinsic) {
    return 0.15;
  }

  let sigma = 0.35; // Initial guess
  const maxIterations = 50;
  const tolerance = 1e-4;

  for (let i = 0; i < maxIterations; i++) {
    const result = calculateBlackScholes(type, S, K, T, r, sigma, q);
    const diff = result.theoreticalPrice - marketPrice;

    if (Math.abs(diff) < tolerance) {
      return Math.min(3.0, Math.max(0.01, sigma));
    }

    const vega = result.greeks.vega * 100; // Convert 1% vega back to base scale
    if (Math.abs(vega) < 1e-6) {
      break;
    }

    sigma = sigma - diff / vega;

    if (sigma <= 0.001 || sigma > 5.0 || isNaN(sigma)) {
      break; // Fallback to bisection
    }
  }

  // Bisection fallback
  let low = 0.01;
  let high = 4.0;
  for (let i = 0; i < 40; i++) {
    const mid = (low + high) / 2;
    const midPrice = calculateBlackScholes(type, S, K, T, r, mid, q).theoreticalPrice;
    if (Math.abs(midPrice - marketPrice) < tolerance) {
      return mid;
    }
    if (midPrice < marketPrice) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return (low + high) / 2;
}

/**
 * Calculate Implied Volatility Rank (IVR) and Percentile (IVP)
 */
export function calculateIVRank(currentIV: number, iv52wLow: number, iv52wHigh: number): number {
  if (iv52wHigh <= iv52wLow) return 50;
  const ivr = ((currentIV - iv52wLow) / (iv52wHigh - iv52wLow)) * 100;
  return Math.min(100, Math.max(0, Number(ivr.toFixed(1))));
}
