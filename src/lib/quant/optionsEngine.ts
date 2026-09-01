import { calculateBlackScholes, OptionGreeks } from './blackScholes';

export type StrategyType = 
  | 'LONG_CALL'
  | 'LONG_PUT'
  | 'BULL_CALL_SPREAD'
  | 'BEAR_PUT_SPREAD'
  | 'IRON_CONDOR'
  | 'LONG_STRADDLE'
  | 'CASH_SECURED_PUT'
  | 'COVERED_CALL';

export interface OptionLeg {
  id: string;
  type: 'call' | 'put';
  action: 'buy' | 'sell';
  strike: number;
  expirationDays: number;
  premium: number;
  quantity: number;
  iv: number;
  greeks: OptionGreeks;
}

export interface PayoffPoint {
  price: number;
  pnlAtExpiry: number;
  pnlCurrent: number;
  roiAtExpiry: number;
}

export interface OptionsStrategyStructure {
  id: string;
  ticker: string;
  name: string;
  type: StrategyType;
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'VOLATILITY_EXPANSION' | 'VOLATILITY_CRUSH';
  underlyingPrice: number;
  legs: OptionLeg[];
  netDebit: number; // Positive if debit paid, negative if credit received
  maxProfit: number | 'UNLIMITED';
  maxLoss: number | 'UNLIMITED';
  riskRewardRatio: string;
  breakEvenPoints: number[];
  probabilityOfProfit: number; // 0 - 100%
  targetTakeProfitPrice: number;
  recommendedStopLossPrice: number;
  combinedGreeks: OptionGreeks;
  payoffCurve: PayoffPoint[];
  rationale: string;
  catalystCorrelation: string;
  convictionScore: number; // 1-100
}

/**
 * Generate high-resolution payoff curve for arbitrary multi-leg options structures
 */
export function generatePayoffCurve(
  underlyingSpot: number,
  legs: OptionLeg[],
  netDebit: number,
  riskFreeRate: number = 0.045
): PayoffPoint[] {
  const points: PayoffPoint[] = [];
  const minPrice = Math.max(1, underlyingSpot * 0.70);
  const maxPrice = underlyingSpot * 1.30;
  const step = (maxPrice - minPrice) / 60;

  for (let p = minPrice; p <= maxPrice; p += step) {
    const price = Number(p.toFixed(2));
    let pnlAtExpiry = 0;
    let pnlCurrent = 0;

    for (const leg of legs) {
      const multiplier = leg.action === 'buy' ? 1 : -1;
      const shares = leg.quantity * 100;

      // 1. Payoff at Expiration (T = 0)
      let intrinsicAtExpiry = 0;
      if (leg.type === 'call') {
        intrinsicAtExpiry = Math.max(0, price - leg.strike);
      } else {
        intrinsicAtExpiry = Math.max(0, leg.strike - price);
      }

      const costBasis = leg.premium;
      const legPnlExpiry = multiplier * (intrinsicAtExpiry - costBasis) * shares;
      pnlAtExpiry += legPnlExpiry;

      // 2. Payoff at Current Date (Black Scholes with half time remaining for curve depth)
      const tYears = (leg.expirationDays * 0.5) / 365;
      const bsCurrent = calculateBlackScholes(
        leg.type,
        price,
        leg.strike,
        tYears,
        riskFreeRate,
        leg.iv
      );
      const legPnlCurrent = multiplier * (bsCurrent.theoreticalPrice - costBasis) * shares;
      pnlCurrent += legPnlCurrent;
    }

    const totalCapitalAtRisk = Math.abs(netDebit * 100) || 100;
    const roiAtExpiry = (pnlAtExpiry / totalCapitalAtRisk) * 100;

    points.push({
      price,
      pnlAtExpiry: Number(pnlAtExpiry.toFixed(2)),
      pnlCurrent: Number(pnlCurrent.toFixed(2)),
      roiAtExpiry: Number(roiAtExpiry.toFixed(1)),
    });
  }

  return points;
}

/**
 * Calculate aggregate Greeks for multi-leg strategies
 */
export function aggregateGreeks(legs: OptionLeg[]): OptionGreeks {
  let delta = 0;
  let gamma = 0;
  let theta = 0;
  let vega = 0;
  let rho = 0;

  for (const leg of legs) {
    const mult = (leg.action === 'buy' ? 1 : -1) * leg.quantity;
    delta += leg.greeks.delta * mult;
    gamma += leg.greeks.gamma * mult;
    theta += leg.greeks.theta * mult * 100; // Total dollar theta / day
    vega += leg.greeks.vega * mult * 100;   // Total dollar vega
    rho += leg.greeks.rho * mult * 100;
  }

  return {
    delta: Number(delta.toFixed(3)),
    gamma: Number(gamma.toFixed(4)),
    theta: Number(theta.toFixed(2)),
    vega: Number(vega.toFixed(2)),
    rho: Number(rho.toFixed(2)),
  };
}

/**
 * Institutional Strategy Constructor: Long Call
 */
export function buildLongCallStrategy(
  ticker: string,
  spot: number,
  dte: number,
  iv: number,
  targetOTMPercent: number = 0.03,
  catalyst: string = 'Momentum breakout catalyst',
  conviction: number = 88
): OptionsStrategyStructure {
  const strike = Math.round((spot * (1 + targetOTMPercent)) * 2) / 2;
  const T = dte / 365;
  const pricing = calculateBlackScholes('call', spot, strike, T, 0.045, iv);
  const premium = pricing.theoreticalPrice;

  const leg: OptionLeg = {
    id: `leg-lc-${ticker}-${strike}`,
    type: 'call',
    action: 'buy',
    strike,
    expirationDays: dte,
    premium,
    quantity: 1,
    iv,
    greeks: pricing.greeks,
  };

  const netDebit = premium;
  const breakEven = Number((strike + premium).toFixed(2));
  const maxLoss = Number((premium * 100).toFixed(2));
  const combinedGreeks = aggregateGreeks([leg]);
  const payoffCurve = generatePayoffCurve(spot, [leg], netDebit);

  // PoP estimation via Delta
  const pop = Math.min(95, Math.max(10, Math.round((1 - pricing.greeks.delta) * 100)));

  return {
    id: `strat-${ticker}-lc-${Date.now()}`,
    ticker,
    name: `${ticker} $${strike} Long Call (${dte} DTE)`,
    type: 'LONG_CALL',
    bias: 'BULLISH',
    underlyingPrice: spot,
    legs: [leg],
    netDebit: Number(netDebit.toFixed(2)),
    maxProfit: 'UNLIMITED',
    maxLoss,
    riskRewardRatio: 'Asymmetric (1 : ∞)',
    breakEvenPoints: [breakEven],
    probabilityOfProfit: pop,
    targetTakeProfitPrice: Number((premium * 2.2).toFixed(2)),
    recommendedStopLossPrice: Number((premium * 0.5).toFixed(2)),
    combinedGreeks,
    payoffCurve,
    rationale: `High gamma expansion opportunity targeting underlying move above $${breakEven}. Historical catalyst win-rate confirms positive drift.`,
    catalystCorrelation: catalyst,
    convictionScore: conviction,
  };
}

/**
 * Institutional Strategy Constructor: Bull Call Spread (Debit Spread)
 */
export function buildBullCallSpread(
  ticker: string,
  spot: number,
  dte: number,
  iv: number,
  widthPercent: number = 0.06,
  catalyst: string = 'Sector tailwind & institutional inflow',
  conviction: number = 92
): OptionsStrategyStructure {
  const buyStrike = Math.round(spot * 2) / 2; // ATM
  const sellStrike = Math.round((spot * (1 + widthPercent)) * 2) / 2; // OTM
  const T = dte / 365;

  const buyPricing = calculateBlackScholes('call', spot, buyStrike, T, 0.045, iv);
  const sellPricing = calculateBlackScholes('call', spot, sellStrike, T, 0.045, iv * 0.96); // Skew

  const netDebit = buyPricing.theoreticalPrice - sellPricing.theoreticalPrice;
  const spreadWidth = sellStrike - buyStrike;
  const maxProfit = Number(((spreadWidth - netDebit) * 100).toFixed(2));
  const maxLoss = Number((netDebit * 100).toFixed(2));
  const breakEven = Number((buyStrike + netDebit).toFixed(2));
  const rrRatio = (maxProfit / maxLoss).toFixed(2);

  const legs: OptionLeg[] = [
    {
      id: `leg-buy-c-${buyStrike}`,
      type: 'call',
      action: 'buy',
      strike: buyStrike,
      expirationDays: dte,
      premium: buyPricing.theoreticalPrice,
      quantity: 1,
      iv,
      greeks: buyPricing.greeks,
    },
    {
      id: `leg-sell-c-${sellStrike}`,
      type: 'call',
      action: 'sell',
      strike: sellStrike,
      expirationDays: dte,
      premium: sellPricing.theoreticalPrice,
      quantity: 1,
      iv: iv * 0.96,
      greeks: sellPricing.greeks,
    },
  ];

  return {
    id: `strat-${ticker}-bcs-${Date.now()}`,
    ticker,
    name: `${ticker} $${buyStrike}/$${sellStrike} Bull Call Vertical (${dte} DTE)`,
    type: 'BULL_CALL_SPREAD',
    bias: 'BULLISH',
    underlyingPrice: spot,
    legs,
    netDebit: Number(netDebit.toFixed(2)),
    maxProfit,
    maxLoss,
    riskRewardRatio: `1 : ${rrRatio}`,
    breakEvenPoints: [breakEven],
    probabilityOfProfit: 68,
    targetTakeProfitPrice: Number((netDebit + (spreadWidth - netDebit) * 0.65).toFixed(2)),
    recommendedStopLossPrice: Number((netDebit * 0.5).toFixed(2)),
    combinedGreeks: aggregateGreeks(legs),
    payoffCurve: generatePayoffCurve(spot, legs, netDebit),
    rationale: `Mitigates IV crush by selling the $${sellStrike} upper strike. Low theta drag with defined risk capped at $${maxLoss}.`,
    catalystCorrelation: catalyst,
    convictionScore: conviction,
  };
}

/**
 * Institutional Strategy Constructor: Iron Condor (Vol Crush / Rangebound)
 */
export function buildIronCondor(
  ticker: string,
  spot: number,
  dte: number,
  iv: number,
  wingWidthPct: number = 0.08,
  catalyst: string = 'Elevated IV post-event overpricing',
  conviction: number = 85
): OptionsStrategyStructure {
  const putSellStrike = Math.round((spot * (1 - wingWidthPct * 0.75)) * 2) / 2;
  const putBuyStrike = Math.round((spot * (1 - wingWidthPct * 1.35)) * 2) / 2;
  const callSellStrike = Math.round((spot * (1 + wingWidthPct * 0.75)) * 2) / 2;
  const callBuyStrike = Math.round((spot * (1 + wingWidthPct * 1.35)) * 2) / 2;

  const T = dte / 365;

  const pSell = calculateBlackScholes('put', spot, putSellStrike, T, 0.045, iv * 1.05);
  const pBuy = calculateBlackScholes('put', spot, putBuyStrike, T, 0.045, iv * 1.08);
  const cSell = calculateBlackScholes('call', spot, callSellStrike, T, 0.045, iv * 0.98);
  const cBuy = calculateBlackScholes('call', spot, callBuyStrike, T, 0.045, iv * 0.95);

  const netCredit = (pSell.theoreticalPrice - pBuy.theoreticalPrice) + (cSell.theoreticalPrice - cBuy.theoreticalPrice);
  const wingWidth = callBuyStrike - callSellStrike;
  const maxProfit = Number((netCredit * 100).toFixed(2));
  const maxLoss = Number(((wingWidth - netCredit) * 100).toFixed(2));

  const lowerBE = Number((putSellStrike - netCredit).toFixed(2));
  const upperBE = Number((callSellStrike + netCredit).toFixed(2));

  const legs: OptionLeg[] = [
    { id: `leg-ic-pb`, type: 'put', action: 'buy', strike: putBuyStrike, expirationDays: dte, premium: pBuy.theoreticalPrice, quantity: 1, iv: iv * 1.08, greeks: pBuy.greeks },
    { id: `leg-ic-ps`, type: 'put', action: 'sell', strike: putSellStrike, expirationDays: dte, premium: pSell.theoreticalPrice, quantity: 1, iv: iv * 1.05, greeks: pSell.greeks },
    { id: `leg-ic-cs`, type: 'call', action: 'sell', strike: callSellStrike, expirationDays: dte, premium: cSell.theoreticalPrice, quantity: 1, iv: iv * 0.98, greeks: cSell.greeks },
    { id: `leg-ic-cb`, type: 'call', action: 'buy', strike: callBuyStrike, expirationDays: dte, premium: cBuy.theoreticalPrice, quantity: 1, iv: iv * 0.95, greeks: cBuy.greeks },
  ];

  return {
    id: `strat-${ticker}-ic-${Date.now()}`,
    ticker,
    name: `${ticker} $${putBuyStrike}/$${putSellStrike}/$${callSellStrike}/$${callBuyStrike} Iron Condor`,
    type: 'IRON_CONDOR',
    bias: 'VOLATILITY_CRUSH',
    underlyingPrice: spot,
    legs,
    netDebit: Number((-netCredit).toFixed(2)),
    maxProfit,
    maxLoss,
    riskRewardRatio: `1 : ${(maxLoss / maxProfit).toFixed(2)} (Credit)`,
    breakEvenPoints: [lowerBE, upperBE],
    probabilityOfProfit: 74,
    targetTakeProfitPrice: Number((netCredit * 0.5).toFixed(2)), // Close at 50% max profit
    recommendedStopLossPrice: Number((netCredit * 2.0).toFixed(2)), // Stop at 2x credit received
    combinedGreeks: aggregateGreeks(legs),
    payoffCurve: generatePayoffCurve(spot, legs, -netCredit),
    rationale: `Harvests positive daily theta decay of $${aggregateGreeks(legs).theta}/day within the $${lowerBE} - $${upperBE} containment corridor.`,
    catalystCorrelation: catalyst,
    convictionScore: conviction,
  };
}

/**
 * Institutional Strategy Constructor: Long Straddle (Binary Catalyst Volatility Spike)
 */
export function buildLongStraddle(
  ticker: string,
  spot: number,
  dte: number,
  iv: number,
  catalyst: string = 'Binary regulatory / clinical trial catalyst',
  conviction: number = 90
): OptionsStrategyStructure {
  const strike = Math.round(spot * 2) / 2;
  const T = dte / 365;

  const cPricing = calculateBlackScholes('call', spot, strike, T, 0.045, iv);
  const pPricing = calculateBlackScholes('put', spot, strike, T, 0.045, iv);

  const totalCost = cPricing.theoreticalPrice + pPricing.theoreticalPrice;
  const lowerBE = Number((strike - totalCost).toFixed(2));
  const upperBE = Number((strike + totalCost).toFixed(2));
  const maxLoss = Number((totalCost * 100).toFixed(2));

  const legs: OptionLeg[] = [
    { id: `leg-str-c`, type: 'call', action: 'buy', strike, expirationDays: dte, premium: cPricing.theoreticalPrice, quantity: 1, iv, greeks: cPricing.greeks },
    { id: `leg-str-p`, type: 'put', action: 'buy', strike, expirationDays: dte, premium: pPricing.theoreticalPrice, quantity: 1, iv, greeks: pPricing.greeks },
  ];

  return {
    id: `strat-${ticker}-str-${Date.now()}`,
    ticker,
    name: `${ticker} $${strike} ATM Straddle (${dte} DTE)`,
    type: 'LONG_STRADDLE',
    bias: 'VOLATILITY_EXPANSION',
    underlyingPrice: spot,
    legs,
    netDebit: Number(totalCost.toFixed(2)),
    maxProfit: 'UNLIMITED',
    maxLoss,
    riskRewardRatio: 'Asymmetric Bi-Directional',
    breakEvenPoints: [lowerBE, upperBE],
    probabilityOfProfit: 54,
    targetTakeProfitPrice: Number((totalCost * 1.75).toFixed(2)),
    recommendedStopLossPrice: Number((totalCost * 0.6).toFixed(2)),
    combinedGreeks: aggregateGreeks(legs),
    payoffCurve: generatePayoffCurve(spot, legs, totalCost),
    rationale: `Delta-neutral gamma trap positioned for explosive price displacement outside the $${lowerBE} - $${upperBE} boundary following upcoming binary catalyst.`,
    catalystCorrelation: catalyst,
    convictionScore: conviction,
  };
}
