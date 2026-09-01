import { StockAsset, SECTORS } from '../data/sectors';
import { calculateBlackScholes, calculateImpliedVolatility, calculateIVRank, OptionGreeks } from './blackScholes';
import { 
  buildLongCallStrategy, 
  buildBullCallSpread, 
  buildIronCondor, 
  buildLongStraddle, 
  OptionsStrategyStructure 
} from './optionsEngine';
import { runEventBacktest, CatalystCategory } from './backtester';
import { POLITICIAN_TRADES } from '../data/politicianTracker';

export interface DecisionPillar {
  id: string;
  name: string;
  shortLabel: string;
  score: number; // 0 - 100
  status: 'EXCELLENT' | 'STRONG' | 'NEUTRAL' | 'CAUTION';
  laymanMeaning: string;
  plainEnglishSummary: string;
  color: string;
  iconName: string;
  metricsSummary: string;
}

export interface EvaluatedRule {
  id: string;
  category: 'TREND' | 'VOLATILITY' | 'MOMENTUM' | 'INSIDER_CATALYST' | 'DERIVATIVES_SKEW';
  name: string;
  condition: string;
  actualValue: string;
  status: 'BULLISH_PASS' | 'BEARISH_PASS' | 'NEUTRAL_PASS' | 'FAIL' | 'WARNING';
  impactWeight: number; // 1 to 10
  rationale: string;
}

export interface QuantitativeSignalReport {
  ticker: string;
  name: string;
  sector: string;
  spotPrice: number;
  verdict: 'STRONG_BUY_ALPHA' | 'BULL_CALL_SPREAD' | 'VOLATILITY_HARVEST' | 'LONG_STRADDLE_EXPANSION' | 'BEAR_HEDGE_PUT' | 'WAIT_RANGEBOUND';
  verdictTitle: string;
  verdictDescription: string;
  laymanOneLiner: string;
  compositeScore: number; // 0 to 100
  confidenceLevel: 'VERY_HIGH' | 'HIGH' | 'MODERATE' | 'SPECULATIVE';
  
  // 5-Pillar Decision Framework
  fivePillars: {
    trendPillar: DecisionPillar;       // Pillar 1: Price Trend & Momentum
    volatilityPillar: DecisionPillar;  // Pillar 2: Volatility & Pricing Value
    insiderPillar: DecisionPillar;     // Pillar 3: Insider & Political Flow
    catalystPillar: DecisionPillar;    // Pillar 4: Catalyst & Event Power
    riskRewardPillar: DecisionPillar;  // Pillar 5: Downside Safety & PoP
  };

  recommendedStrategy: OptionsStrategyStructure;
  alternativeStrategy?: OptionsStrategyStructure;
  rulesPassedCount: number;
  totalRulesEvaluated: number;
  evaluatedRules: EvaluatedRule[];
  keyCatalyst: string;
  catalystWinRate: number;
  insiderActivityNotice?: string;
  supportResistance: {
    support: number;
    resistance: number;
    breakoutTarget: number;
  };
}

// Well-known accurate market baselines for top tickers
const KNOWN_MARKET_TICKERS: Record<string, Partial<StockAsset>> = {
  NFLX: { name: 'Netflix, Inc.', price: 81.05, change: -0.67, changePercent: -0.82, ivRank: 48, rsi14: 62, supportLevel: 76.00, resistanceLevel: 88.00, priceTarget: 98.00 },
  TSLA: { name: 'Tesla, Inc.', price: 328.60, change: 8.40, changePercent: 2.62, ivRank: 72, rsi14: 65, supportLevel: 310.00, resistanceLevel: 345.00, priceTarget: 390.00 },
  AAPL: { name: 'Apple Inc.', price: 248.50, change: 3.20, changePercent: 1.30, ivRank: 38, rsi14: 59, supportLevel: 240.00, resistanceLevel: 256.00, priceTarget: 280.00 },
  GOOGL: { name: 'Alphabet Inc.', price: 195.40, change: 2.80, changePercent: 1.45, ivRank: 42, rsi14: 60, supportLevel: 188.00, resistanceLevel: 205.00, priceTarget: 230.00 },
  AMZN: { name: 'Amazon.com, Inc.', price: 224.80, change: 4.10, changePercent: 1.86, ivRank: 45, rsi14: 63, supportLevel: 216.00, resistanceLevel: 235.00, priceTarget: 265.00 },
  META: { name: 'Meta Platforms, Inc.', price: 685.20, change: 12.50, changePercent: 1.86, ivRank: 52, rsi14: 67, supportLevel: 660.00, resistanceLevel: 710.00, priceTarget: 780.00 },
  COIN: { name: 'Coinbase Global, Inc.', price: 278.40, change: 14.20, changePercent: 5.37, ivRank: 82, rsi14: 71, supportLevel: 255.00, resistanceLevel: 298.00, priceTarget: 350.00 },
};

/**
 * Generate synthetic or real profile for any ticker
 */
export function getOrCreateStockProfile(tickerInput: string): StockAsset {
  const symbol = tickerInput.trim().toUpperCase();
  
  // 1. Check if exists in predefined sectors
  for (const sector of SECTORS) {
    const found = sector.stocks.find(s => s.ticker === symbol);
    if (found) return found;
  }

  // 2. Check if known popular ticker
  if (KNOWN_MARKET_TICKERS[symbol]) {
    const k = KNOWN_MARKET_TICKERS[symbol];
    const basePrice = k.price || 100;
    return {
      ticker: symbol,
      name: k.name || `${symbol} Corp`,
      sectorId: 'tech-ai',
      price: basePrice,
      change: k.change || 1.20,
      changePercent: k.changePercent || 1.15,
      marketCap: `$${Math.round(basePrice * 2.8)}B`,
      peRatio: 34.0,
      volume: '24.5M',
      avgVolume: '22.0M',
      ivRank: k.ivRank || 50,
      historicalVol: 32,
      impliedVol: 38,
      rsi14: k.rsi14 || 60,
      beta: 1.35,
      supportLevel: k.supportLevel || Number((basePrice * 0.94).toFixed(2)),
      resistanceLevel: k.resistanceLevel || Number((basePrice * 1.08).toFixed(2)),
      upcomingCatalyst: 'Quarterly Financial Disclosure & Institutional Earnings Release',
      catalystDate: 'Nov 14, 2026',
      sentimentScore: 84,
      analystConsensus: 'STRONG_BUY',
      priceTarget: k.priceTarget || Number((basePrice * 1.22).toFixed(2)),
      sparkline: [basePrice * 0.96, basePrice * 0.97, basePrice * 0.99, basePrice * 0.98, basePrice * 1.01, basePrice],
    };
  }

  // 3. Fallback deterministic generator
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = (hash << 5) - hash + symbol.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);
  const basePrice = 45 + (positiveHash % 180);
  const ivRank = 30 + (positiveHash % 55);
  const rsi = 45 + (positiveHash % 30);
  const changePct = ((positiveHash % 60) - 25) / 10;
  const change = Number(((basePrice * changePct) / 100).toFixed(2));

  return {
    ticker: symbol,
    name: `${symbol} Asset`,
    sectorId: 'tech-ai',
    price: basePrice,
    change,
    changePercent: changePct,
    marketCap: `$${(25 + (positiveHash % 350)).toFixed(0)}B`,
    peRatio: 28,
    volume: `${(10 + (positiveHash % 30)).toFixed(1)}M`,
    avgVolume: `${(12 + (positiveHash % 25)).toFixed(1)}M`,
    ivRank,
    historicalVol: Math.round(ivRank * 0.8),
    impliedVol: Math.round(ivRank * 1.1),
    rsi14: rsi,
    beta: Number((0.8 + (positiveHash % 120) / 100).toFixed(2)),
    supportLevel: Number((basePrice * 0.94).toFixed(2)),
    resistanceLevel: Number((basePrice * 1.08).toFixed(2)),
    upcomingCatalyst: 'Quarterly Financial Disclosure & Institutional Investor Summit',
    catalystDate: 'Oct 28, 2026',
    sentimentScore: 75 + (positiveHash % 20),
    analystConsensus: rsi > 55 ? 'BUY' : 'HOLD',
    priceTarget: Number((basePrice * 1.22).toFixed(2)),
    sparkline: [basePrice * 0.95, basePrice * 0.96, basePrice * 0.98, basePrice * 0.97, basePrice * 0.99, basePrice * 1.01, basePrice],
  };
}


/** Clamp to the 0-100 score domain. */
function clamp100(x: number): number {
  if (!isFinite(x)) return 0;
  return Math.min(100, Math.max(0, Math.round(x)));
}

/**
 * Trend score from position within the support/resistance channel.
 * Peaks in the upper-middle of the channel (a trend with room left) and falls off at
 * BOTH ends: below support is a broken structure, pinned at resistance is an extended
 * entry. Previously returned one of three constants, none below 68.
 */
export function scoreTrend(spot: number, support: number, resistance: number): number {
  if (!isFinite(spot) || !isFinite(support) || !isFinite(resistance) || resistance <= support) return 0;
  const pos = (spot - support) / (resistance - support);
  return clamp100(100 - 120 * Math.abs(pos - 0.7));
}

/**
 * Momentum from 14-period RSI. Peaks near 58 (advancing, not yet extended) and decays
 * symmetrically into both overbought and oversold. Previously floored at 70.
 */
export function scoreMomentum(rsi14: number): number {
  if (!isFinite(rsi14)) return 0;
  return clamp100(100 - 2.2 * Math.abs(rsi14 - 58));
}

/**
 * Volatility-edge score. Deliberately U-shaped: an edge exists when options are clearly
 * cheap OR clearly rich. A mid-range IV Rank means there is no volatility trade here and
 * must score LOW — previously this floored at 82.
 */
export function scoreVolatilityEdge(ivRank: number): number {
  if (!isFinite(ivRank)) return 0;
  return clamp100(40 + 60 * (Math.abs(ivRank - 50) / 50));
}

/**
 * Catalyst score with small-sample shrinkage toward a 50% base rate (Beta(2,2) prior).
 * A 2-for-2 record scores 67, not 100. Note the underlying precedent set is still
 * survivorship-selected; shrinkage limits the damage but does not repair it.
 */
export function scoreCatalyst(winRatePercent: number, sampleSize: number): number {
  if (!isFinite(winRatePercent) || !isFinite(sampleSize) || sampleSize <= 0) return 50;
  const wins = (winRatePercent / 100) * sampleSize;
  return clamp100(((wins + 2) / (sampleSize + 4)) * 100);
}

/**
 * Risk/reward score from the structure's own expected value per dollar at risk.
 * Previously hardcoded to EXCELLENT for every position.
 */
export function scoreRiskReward(
  pop: number | null,
  maxProfit: number | 'UNLIMITED',
  maxLoss: number | 'UNLIMITED'
): number {
  if (pop === null || maxLoss === 'UNLIMITED' || typeof maxLoss !== 'number' || maxLoss <= 0) return 0;
  const p = pop / 100;
  const profit = maxProfit === 'UNLIMITED' ? maxLoss * 3 : maxProfit;
  if (typeof profit !== 'number' || !isFinite(profit)) return 0;
  const ev = p * profit - (1 - p) * maxLoss;
  return clamp100(50 + (ev / maxLoss) * 50);
}

/**
 * Evaluates the 5-Pillar Decision Framework and institutional quantitative rules
 * Accepts either ticker symbol string or a resolved StockAsset with live market prices.
 */
export function analyzeTickerSignals(tickerOrStock: string | StockAsset): QuantitativeSignalReport {
  const stock = typeof tickerOrStock === 'string' ? getOrCreateStockProfile(tickerOrStock) : tickerOrStock;
  const symbol = stock.ticker;
  const spot = stock.price;

  const politicianTrade = POLITICIAN_TRADES.find(t => t.ticker === symbol);
  const rules: EvaluatedRule[] = [];

  // 1. Evaluate Trend
  const isNearResistance = spot >= stock.resistanceLevel * 0.98;
  const isNearSupport = spot <= stock.supportLevel * 1.02;
  const trendScore = scoreTrend(spot, stock.supportLevel, stock.resistanceLevel);
  rules.push({
    id: 'rule-trend-1',
    category: 'TREND',
    name: 'Price Momentum & Channel Breakout',
    condition: 'Asset holding upward structural trajectory above 50-day baseline',
    actualValue: `$${spot.toFixed(2)} (Range: $${stock.supportLevel} - $${stock.resistanceLevel})`,
    status: isNearResistance ? 'BULLISH_PASS' : 'NEUTRAL_PASS',
    impactWeight: 8,
    rationale: isNearResistance 
      ? 'Challenging upper resistance with expanding buyer volume.'
      : 'Trading securely within bullish accumulation channel.',
  });

  // 2. Evaluate Momentum (RSI)
  const rsi = stock.rsi14;
  const momentumScore = scoreMomentum(rsi);
  rules.push({
    id: 'rule-momentum-1',
    category: 'MOMENTUM',
    name: '14-Period RSI Accumulation Velocity',
    condition: 'RSI confirms strong institutional buyer accumulation without exhaustion',
    actualValue: `RSI = ${rsi}`,
    status: rsi >= 55 && rsi < 75 ? 'BULLISH_PASS' : 'NEUTRAL_PASS',
    impactWeight: 7,
    rationale: `RSI is at ${rsi}, showing sustained upward buying velocity.`,
  });

  // 3. Evaluate Volatility (IVR)
  const ivr = stock.ivRank;
  const volScore = scoreVolatilityEdge(ivr);
  rules.push({
    id: 'rule-vol-1',
    category: 'VOLATILITY',
    name: 'Implied Volatility Rank (Pricing Value)',
    condition: 'Options pricing relative to historical 52-week baseline',
    actualValue: `IVR = ${ivr}% (IV: ${stock.impliedVol}% vs HV: ${stock.historicalVol}%)`,
    status: 'BULLISH_PASS',
    impactWeight: 9,
    rationale: ivr >= 70
      ? 'Options are richly priced — selling upper strike spread legs yields high theta decay.'
      : 'Options are statistically inexpensive, maximizing convex payoff.',
  });

  // 4. Evaluate Catalyst
  let catType: CatalystCategory = 'CHIP_SUBSIDY_OR_RESTRICTION';
  if (stock.sectorId === 'biotech-medical') catType = 'FDA_APPROVAL';
  else if (stock.sectorId === 'quantum') catType = 'QUANTUM_BENCHMARK';
  else if (stock.sectorId === 'politician-macro') catType = 'CONGRESSIONAL_INSIDER_BUY';

  const backtest = runEventBacktest(catType);
  const catalystScore = scoreCatalyst(backtest.winRate5D, backtest.sampleSize);
  rules.push({
    id: 'rule-catalyst-1',
    category: 'INSIDER_CATALYST',
    name: 'Event Precedent Realization Rate',
    condition: '10-year historical backtest win-rate on similar catalysts > 70%',
    actualValue: `${backtest.winRate5D}% 5-Day Win Rate (${backtest.historicalPrecedents.length} Cases)`,
    status: backtest.winRate5D >= 75 ? 'BULLISH_PASS' : 'NEUTRAL_PASS',
    impactWeight: 9,
    rationale: `Historical precedent confirms median 5-day move of +${backtest.medianReturn5D}%.`,
  });

  // 5. Evaluate Insider & Political Flow
  // No disclosed insider flow is NEUTRAL evidence (50), not a 78-point endorsement.
  const insiderScore = politicianTrade
    ? clamp100(60 + politicianTrade.conflictScore * 0.4)
    : stock.analystConsensus === 'STRONG_BUY'
      ? 62
      : stock.analystConsensus === 'BUY'
        ? 55
        : 50;
  if (politicianTrade) {
    rules.push({
      id: 'rule-insider-1',
      category: 'INSIDER_CATALYST',
      name: 'Congressional STOCK Act Flow',
      condition: 'Active committee member disclosure with high conflict score',
      actualValue: `${politicianTrade.politician} (${politicianTrade.chamber}) • ${politicianTrade.amountRange}`,
      status: 'BULLISH_PASS',
      impactWeight: 10,
      rationale: `Conflict index of ${politicianTrade.conflictScore}/100. Trade is up +${politicianTrade.unrealizedReturnPercent.toFixed(1)}% alpha.`,
    });
  } else {
    rules.push({
      id: 'rule-insider-1',
      category: 'INSIDER_CATALYST',
      name: 'Institutional Target Consensus',
      condition: 'Analyst price targets and dark pool volume interest',
      actualValue: `Target: $${stock.priceTarget} (+${(((stock.priceTarget - spot)/spot)*100).toFixed(1)}%)`,
      status: 'BULLISH_PASS',
      impactWeight: 6,
      rationale: `Consensus is ${stock.analystConsensus} with price target upside.`,
    });
  }

  // Calculate Composite Score (Weighted average of the 5 pillars)
  // No floor, no ceiling clamp: a weak setup must be able to score weakly, or the score
  // carries no information. Risk/reward folds in after the structure is built.
  const preStrategyScore = clamp100(
    trendScore * 0.26 + momentumScore * 0.21 + volScore * 0.24 + catalystScore * 0.29
  );

  // Build 5 Decision Pillars with Layman Plain-English Interpretations
  const trendPillar: DecisionPillar = {
    id: 'pillar-1',
    name: 'Price Trend & Momentum',
    shortLabel: 'Trend Power',
    score: trendScore,
    status: trendScore >= 85 ? 'EXCELLENT' : trendScore >= 70 ? 'STRONG' : trendScore >= 45 ? 'NEUTRAL' : 'CAUTION',
    laymanMeaning: 'Is the stock moving up with real buyer strength?',
    plainEnglishSummary: isNearResistance
      ? 'Strong upward surge — buyers are aggressively pushing the stock toward new highs.'
      : 'Solid upward baseline — steady accumulation with low sell pressure.',
    color: '#00F0FF',
    iconName: 'TrendingUp',
    metricsSummary: `Spot $${spot.toFixed(2)} • Support $${stock.supportLevel} • Target $${stock.priceTarget}`,
  };

  const volatilityPillar: DecisionPillar = {
    id: 'pillar-2',
    name: 'Volatility & Pricing Value',
    shortLabel: 'Option Value',
    score: volScore,
    status: volScore >= 85 ? 'EXCELLENT' : volScore >= 70 ? 'STRONG' : volScore >= 50 ? 'NEUTRAL' : 'CAUTION',
    laymanMeaning: 'Are options cheap to buy, or rich enough to sell for daily income?',
    plainEnglishSummary: ivr >= 70
      ? 'Options are expensive — our strategy sells higher strikes so you collect time decay while minimizing cost.'
      : 'Options are on sale — you get maximum leverage and explosive upside for a small entry cost.',
    color: '#A855F7',
    iconName: 'Flame',
    metricsSummary: `IV Rank: ${ivr}% • IV: ${stock.impliedVol}% vs Realized: ${stock.historicalVol}%`,
  };

  const insiderPillar: DecisionPillar = {
    id: 'pillar-3',
    name: 'Smart Money & Congressional Flow',
    shortLabel: 'Insider Flow',
    score: insiderScore,
    status: insiderScore >= 85 ? 'EXCELLENT' : insiderScore >= 70 ? 'STRONG' : insiderScore >= 52 ? 'NEUTRAL' : 'CAUTION',
    laymanMeaning: 'Are politicians, corporate insiders, and big institutions buying?',
    plainEnglishSummary: politicianTrade
      ? `High-confidence signal — ${politicianTrade.politician} filed a large position ahead of key legislation.`
      : `No disclosed congressional or insider flow in $${symbol}. Analyst consensus is ${stock.analystConsensus}, which is not by itself evidence of accumulation.`,
    color: '#FFB000',
    iconName: 'Landmark',
    metricsSummary: politicianTrade ? `STOCK Act: ${politicianTrade.politician}` : `Consensus: ${stock.analystConsensus}`,
  };

  const catalystPillar: DecisionPillar = {
    id: 'pillar-4',
    name: 'Catalyst & Event Power',
    shortLabel: 'Event Impact',
    score: catalystScore,
    status: catalystScore >= 80 ? 'EXCELLENT' : catalystScore >= 65 ? 'STRONG' : catalystScore >= 50 ? 'NEUTRAL' : 'CAUTION',
    laymanMeaning: 'What news event is coming, and how reliably has the stock jumped in the past?',
    plainEnglishSummary: `${backtest.sampleSize} historical precedent${backtest.sampleSize === 1 ? '' : 's'} for this catalyst type, ${backtest.winRate5D}% positive over 5 days (median +${backtest.medianReturn5D}%). Adjusted for the small sample, the estimated base rate is ${catalystScore}%.`,
    color: '#00FF66',
    iconName: 'Sparkles',
    metricsSummary: `${stock.upcomingCatalyst.slice(0, 40)}... (n=${backtest.sampleSize}, adj. ${catalystScore}%)`,
  };

  // Strategy construction. Built BEFORE the composite so risk/reward is scored from the
  // structure's real economics rather than echoing the composite back at itself.
  const ivDecimal = stock.impliedVol / 100;
  let verdict: QuantitativeSignalReport['verdict'];
  let verdictTitle: string;
  let verdictDescription: string;
  let laymanOneLiner: string;
  let recommendedStrategy: OptionsStrategyStructure;

  const channelPos = stock.resistanceLevel > stock.supportLevel
    ? (spot - stock.supportLevel) / (stock.resistanceLevel - stock.supportLevel)
    : 0.5;
  const structureBroken = channelPos < 0.15;
  const noEdge = preStrategyScore < 45;

  if (structureBroken && rsi < 45) {
    // Previously unreachable. The bearish branch now actually fires.
    verdict = 'BEAR_HEDGE_PUT';
    verdictTitle = 'BEARISH — HEDGE OR STAND ASIDE';
    verdictDescription = `Price has broken below the $${stock.supportLevel} support shelf and momentum confirms it (RSI ${rsi}). Long exposure here is against the trend.`;
    laymanOneLiner = 'The stock has broken its floor and momentum is still falling. This is not a buy — hedge existing exposure or stay out.';
    recommendedStrategy = buildLongStraddle(symbol, spot, 30, ivDecimal, stock.upcomingCatalyst, preStrategyScore);
  } else if (noEdge) {
    // Previously unreachable. Most names, most days, are not setups.
    verdict = 'WAIT_RANGEBOUND';
    verdictTitle = 'NO EDGE — STAND ASIDE';
    verdictDescription = `Composite ${preStrategyScore}/100. Trend, momentum, volatility and catalyst evidence do not combine into an actionable asymmetry at this price.`;
    laymanOneLiner = 'Nothing here is worth your capital right now. The setup does not pay you enough for the risk — wait for a better entry.';
    recommendedStrategy = buildBullCallSpread(symbol, spot, 45, ivDecimal, 0.06, stock.upcomingCatalyst, preStrategyScore);
  } else if (ivr >= 75) {
    verdict = 'VOLATILITY_HARVEST';
    verdictTitle = 'VOLATILITY HARVEST (IRON CONDOR)';
    verdictDescription = 'Elevated implied volatility. Harvest premium via a defined-risk Iron Condor while price stays inside the corridor.';
    recommendedStrategy = buildIronCondor(symbol, spot, 35, ivDecimal, 0.07, stock.upcomingCatalyst, preStrategyScore);
    laymanOneLiner = `Option premiums are rich here. This corridor collects about $${Math.abs(recommendedStrategy.combinedGreeks.theta * 100).toFixed(2)}/day in time decay while the stock stays between $${recommendedStrategy.breakEvenPoints[0]} and $${recommendedStrategy.breakEvenPoints[1]}.`;
  } else if (ivr <= 40 && (rsi >= 55 || politicianTrade)) {
    verdict = 'STRONG_BUY_ALPHA';
    verdictTitle = 'DIRECTIONAL LONG CALL (CONVEX UPSIDE)';
    verdictDescription = 'Low implied volatility with momentum confirmation. Convex payoff via out-of-the-money long calls.';
    recommendedStrategy = buildLongCallStrategy(symbol, spot, 45, ivDecimal, 0.05, stock.upcomingCatalyst, preStrategyScore);
    laymanOneLiner = `Options are cheap and momentum is with you. Modelled odds of finishing profitable: ${recommendedStrategy.probabilityOfProfit === null ? 'n/a' : recommendedStrategy.probabilityOfProfit + '%'} — a low-probability, high-payoff position, so size it as one.`;
  } else {
    verdict = 'BULL_CALL_SPREAD';
    verdictTitle = 'BULL CALL VERTICAL (DEFINED RISK)';
    verdictDescription = 'Vertical debit spread. Selling the upper strike cuts cost basis and dampens volatility crush, in exchange for a capped payoff.';
    recommendedStrategy = buildBullCallSpread(symbol, spot, 45, ivDecimal, 0.06, stock.upcomingCatalyst, preStrategyScore);
    laymanOneLiner = `Balanced structure: risk capped at $${recommendedStrategy.maxLoss}, upside $${recommendedStrategy.maxProfit}, break-even $${recommendedStrategy.breakEvenPoints[0]}. Modelled odds of profit: ${recommendedStrategy.probabilityOfProfit === null ? 'n/a' : recommendedStrategy.probabilityOfProfit + '%'}.`;
  }

  // Pillar 5 scores the actual structure's expected value per dollar at risk.
  const riskRewardScore = scoreRiskReward(
    recommendedStrategy.probabilityOfProfit,
    recommendedStrategy.maxProfit,
    recommendedStrategy.maxLoss
  );

  const compositeScore = clamp100(preStrategyScore * 0.82 + riskRewardScore * 0.18);

  const riskRewardPillar: DecisionPillar = {
    id: 'pillar-5',
    name: 'Risk / Reward Efficiency',
    shortLabel: 'Risk/Reward',
    score: riskRewardScore,
    status: riskRewardScore >= 75 ? 'EXCELLENT' : riskRewardScore >= 60 ? 'STRONG' : riskRewardScore >= 45 ? 'NEUTRAL' : 'CAUTION',
    laymanMeaning: 'Does this trade pay you enough for the risk you are taking?',
    plainEnglishSummary: recommendedStrategy.maxLoss === 'UNLIMITED'
      ? 'This structure has undefined downside. Size it accordingly.'
      : `Maximum loss is $${recommendedStrategy.maxLoss} per contract, known before you enter. Modelled probability of profit is ${recommendedStrategy.probabilityOfProfit === null ? 'not computable from these inputs' : recommendedStrategy.probabilityOfProfit + '%'}.`,
    color: '#3B82F6',
    iconName: 'ShieldCheck',
    metricsSummary: `Max loss $${recommendedStrategy.maxLoss} • R:R ${recommendedStrategy.riskRewardRatio} • PoP ${recommendedStrategy.probabilityOfProfit ?? 'n/a'}%`,
  };

  return {
    ticker: symbol,
    name: stock.name,
    sector: stock.sectorId.toUpperCase(),
    spotPrice: spot,
    verdict,
    verdictTitle,
    verdictDescription,
    laymanOneLiner,
    compositeScore,
    confidenceLevel: compositeScore >= 88 ? 'VERY_HIGH' : compositeScore >= 75 ? 'HIGH' : compositeScore >= 55 ? 'MODERATE' : 'SPECULATIVE',
    fivePillars: {
      trendPillar,
      volatilityPillar,
      insiderPillar,
      catalystPillar,
      riskRewardPillar,
    },
    recommendedStrategy,
    rulesPassedCount: rules.filter(r => r.status.includes('PASS')).length,
    totalRulesEvaluated: rules.length,
    evaluatedRules: rules,
    keyCatalyst: `${stock.upcomingCatalyst} (${stock.catalystDate})`,
    catalystWinRate: backtest.winRate5D,
    insiderActivityNotice: politicianTrade 
      ? `Congressional Alert: ${politicianTrade.politician} filed $${politicianTrade.estimatedValue.toLocaleString()} purchase in $${symbol}.`
      : undefined,
    supportResistance: {
      support: stock.supportLevel,
      resistance: stock.resistanceLevel,
      breakoutTarget: stock.priceTarget,
    }
  };
}
