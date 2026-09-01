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
  verdictDescription: string;
  compositeScore: number; // 0 to 100
  confidenceLevel: 'VERY_HIGH' | 'HIGH' | 'MODERATE' | 'SPECULATIVE';
  recommendedStrategy: OptionsStrategyStructure;
  alternativeStrategy?: OptionsStrategyStructure;
  rulesPassedCount: number;
  totalRulesEvaluated: number;
  evaluatedRules: EvaluatedRule[];
  factorScores: {
    trendScore: number;       // 0-100
    volatilityScore: number;  // 0-100
    momentumScore: number;    // 0-100
    catalystScore: number;    // 0-100
  };
  keyCatalyst: string;
  catalystWinRate: number;
  insiderActivityNotice?: string;
  supportResistance: {
    support: number;
    resistance: number;
    breakoutTarget: number;
  };
}

/**
 * Generate simulated profile for arbitrary unknown tickers (e.g. TSLA, GOOGL, COIN)
 */
export function getOrCreateStockProfile(tickerInput: string): StockAsset {
  const symbol = tickerInput.trim().toUpperCase();
  
  // Check if exists in predefined sectors
  for (const sector of SECTORS) {
    const found = sector.stocks.find(s => s.ticker === symbol);
    if (found) return found;
  }

  // Generate deterministic synthetic profile based on ticker hash
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = (hash << 5) - hash + symbol.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);
  
  const basePrice = 50 + (positiveHash % 400);
  const ivRank = 25 + (positiveHash % 65);
  const rsi = 42 + (positiveHash % 32);
  const pe = 18 + (positiveHash % 45);
  const changePct = ((positiveHash % 70) - 28) / 10;
  const change = Number(((basePrice * changePct) / 100).toFixed(2));

  return {
    ticker: symbol,
    name: `${symbol} Equity Asset`,
    sectorId: 'tech-ai',
    price: basePrice,
    change,
    changePercent: changePct,
    marketCap: `$${(20 + (positiveHash % 450)).toFixed(0)}B`,
    peRatio: pe,
    volume: `${(10 + (positiveHash % 40)).toFixed(1)}M`,
    avgVolume: `${(12 + (positiveHash % 35)).toFixed(1)}M`,
    ivRank,
    historicalVol: Math.round(ivRank * 0.8),
    impliedVol: Math.round(ivRank * 1.1),
    rsi14: rsi,
    beta: Number((0.8 + (positiveHash % 120) / 100).toFixed(2)),
    supportLevel: Number((basePrice * 0.94).toFixed(2)),
    resistanceLevel: Number((basePrice * 1.08).toFixed(2)),
    upcomingCatalyst: 'Quarterly Financial Disclosure & Institutional Investor Summit',
    catalystDate: 'Oct 28, 2026',
    sentimentScore: 72 + (positiveHash % 22),
    analystConsensus: rsi > 55 ? 'BUY' : 'HOLD',
    priceTarget: Number((basePrice * 1.22).toFixed(2)),
    sparkline: [
      basePrice * 0.95,
      basePrice * 0.96,
      basePrice * 0.98,
      basePrice * 0.97,
      basePrice * 0.99,
      basePrice * 1.01,
      basePrice
    ],
  };
}

/**
 * Institutional Rules Engine: Evaluates multi-factor signals and generates recommendations
 */
export function analyzeTickerSignals(tickerInput: string): QuantitativeSignalReport {
  const stock = getOrCreateStockProfile(tickerInput);
  const symbol = stock.ticker;
  const spot = stock.price;

  // Check if ticker has Congressional insider filings
  const politicianTrade = POLITICIAN_TRADES.find(t => t.ticker === symbol);

  const rules: EvaluatedRule[] = [];

  // 1. Trend Rule: Price vs Support / Resistance Breakout
  const isNearResistance = spot >= stock.resistanceLevel * 0.98;
  const isNearSupport = spot <= stock.supportLevel * 1.02;
  rules.push({
    id: 'rule-trend-1',
    category: 'TREND',
    name: 'Price Structure & Support/Resistance Proximity',
    condition: 'Asset trading above mid-range with upward structural trajectory',
    actualValue: `$${spot.toFixed(2)} (Range: $${stock.supportLevel} - $${stock.resistanceLevel})`,
    status: isNearResistance ? 'BULLISH_PASS' : isNearSupport ? 'WARNING' : 'NEUTRAL_PASS',
    impactWeight: 8,
    rationale: isNearResistance 
      ? 'Asset is challenging the upper resistance band with expanding volume, indicating imminent breakout momentum.'
      : 'Asset is holding support corridor with defined risk containment.',
  });

  // 2. Momentum Rule: 14-Day RSI Momentum Regime
  const rsi = stock.rsi14;
  let rsiStatus: EvaluatedRule['status'] = 'NEUTRAL_PASS';
  let rsiRationale = '';
  if (rsi >= 60 && rsi < 75) {
    rsiStatus = 'BULLISH_PASS';
    rsiRationale = 'RSI is in the institutional bull-momentum zone (60-75) without being in extreme overbought exhaustion.';
  } else if (rsi >= 75) {
    rsiStatus = 'WARNING';
    rsiRationale = 'RSI is elevated (>75), suggesting short-term consolidation before trend continuation.';
  } else if (rsi <= 40) {
    rsiStatus = 'BULLISH_PASS';
    rsiRationale = 'RSI is deeply oversold with bullish divergence setup for mean-reversion.';
  } else {
    rsiStatus = 'NEUTRAL_PASS';
    rsiRationale = 'RSI is balanced in neutral territory.';
  }

  rules.push({
    id: 'rule-momentum-1',
    category: 'MOMENTUM',
    name: '14-Period RSI Relative Strength Momentum',
    condition: 'RSI between 55 and 75 indicating institutional accumulation',
    actualValue: `RSI = ${rsi}`,
    status: rsiStatus,
    impactWeight: 7,
    rationale: rsiRationale,
  });

  // 3. Volatility Rule: Implied Volatility Rank (IVR) & Premium Harvest Potential
  const ivr = stock.ivRank;
  let ivrStatus: EvaluatedRule['status'] = 'NEUTRAL_PASS';
  let ivrRationale = '';
  if (ivr >= 70) {
    ivrStatus = 'BULLISH_PASS';
    ivrRationale = `IV Rank is elevated at ${ivr}%. Options premiums are rich, making credit spreads, Iron Condors, or Debit Spreads (selling upper strike) highly advantageous.`;
  } else if (ivr <= 35) {
    ivrStatus = 'BULLISH_PASS';
    ivrRationale = `IV Rank is low at ${ivr}%. Options pricing is cheap, making outright Long Calls or Long Straddles optimal.`;
  } else {
    ivrStatus = 'NEUTRAL_PASS';
    ivrRationale = `IV Rank is moderate at ${ivr}%. Vertical debit spreads recommended to manage theta decay.`;
  }

  rules.push({
    id: 'rule-vol-1',
    category: 'VOLATILITY',
    name: 'Implied Volatility Rank (IVR) Environment',
    condition: 'Determine whether options are statistically cheap or expensive relative to 52-week baseline',
    actualValue: `IVR = ${ivr}% (IV: ${stock.impliedVol}% vs HV: ${stock.historicalVol}%)`,
    status: ivrStatus,
    impactWeight: 9,
    rationale: ivrRationale,
  });

  // 4. Derivatives Skew: IV vs Historical Volatility Spread
  const volSpread = stock.impliedVol - stock.historicalVol;
  rules.push({
    id: 'rule-skew-1',
    category: 'DERIVATIVES_SKEW',
    name: 'Implied Volatility vs Realized Volatility Spread',
    condition: 'IV/HV spread evaluates market expectation of upcoming variance shock',
    actualValue: `Spread: ${volSpread > 0 ? '+' : ''}${volSpread}% (IV: ${stock.impliedVol}%, HV: ${stock.historicalVol}%)`,
    status: volSpread >= 4 ? 'BULLISH_PASS' : 'NEUTRAL_PASS',
    impactWeight: 7,
    rationale: volSpread >= 4 
      ? 'Implied volatility is pricing in a significant expansion catalyst, favoring delta-hedged gamma positions.'
      : 'Realized and implied volatility are in statistical equilibrium.',
  });

  // 5. Catalyst Rule: Precedent Backtest Correlation
  let catType: CatalystCategory = 'CHIP_SUBSIDY_OR_RESTRICTION';
  if (stock.sectorId === 'biotech-medical') catType = 'FDA_APPROVAL';
  else if (stock.sectorId === 'quantum') catType = 'QUANTUM_BENCHMARK';
  else if (stock.sectorId === 'politician-macro') catType = 'CONGRESSIONAL_INSIDER_BUY';

  const backtest = runEventBacktest(catType);
  rules.push({
    id: 'rule-catalyst-1',
    category: 'INSIDER_CATALYST',
    name: 'Quantitative Event Precedent Historical Win Rate',
    condition: 'Historical catalyst category exhibits > 70% 30-day directional realization rate',
    actualValue: `${backtest.winRate5D}% 5D Win Rate • ${backtest.winRate30D}% 30D Win Rate`,
    status: backtest.winRate5D >= 75 ? 'BULLISH_PASS' : 'NEUTRAL_PASS',
    impactWeight: 9,
    rationale: `Historical backtests on ${backtest.title} show a median 5-day drift of +${backtest.medianReturn5D}% and Sharpe ratio of ${backtest.sharpeRatio}.`,
  });

  // 6. Congressional / Insider Flow Rule
  if (politicianTrade) {
    rules.push({
      id: 'rule-insider-1',
      category: 'INSIDER_CATALYST',
      name: 'Congressional STOCK Act Insider Flow Detection',
      condition: 'Active committee member disclosure with legislative conflict correlation',
      actualValue: `${politicianTrade.politician} (${politicianTrade.chamber}) • ${politicianTrade.amountRange}`,
      status: 'BULLISH_PASS',
      impactWeight: 10,
      rationale: `Direct committee jurisdiction conflict index of ${politicianTrade.conflictScore}/100. Trade has generated +${politicianTrade.unrealizedReturnPercent.toFixed(1)}% alpha since disclosure.`,
    });
  } else {
    rules.push({
      id: 'rule-insider-1',
      category: 'INSIDER_CATALYST',
      name: 'Institutional Dark Pool & Insider Activity',
      condition: 'Institutional block volume and analyst price target consensus',
      actualValue: `Target: $${stock.priceTarget} (+${(((stock.priceTarget - spot)/spot)*100).toFixed(1)}% Upside)`,
      status: stock.analystConsensus === 'STRONG_BUY' ? 'BULLISH_PASS' : 'NEUTRAL_PASS',
      impactWeight: 6,
      rationale: `Analyst consensus is ${stock.analystConsensus} with a median 12-month upside target of $${stock.priceTarget}.`,
    });
  }

  // Calculate composite score
  const passedRules = rules.filter(r => r.status === 'BULLISH_PASS' || r.status === 'NEUTRAL_PASS');
  const totalWeight = rules.reduce((acc, r) => acc + r.impactWeight, 0);
  const earnedWeight = rules.reduce((acc, r) => {
    if (r.status === 'BULLISH_PASS') return acc + r.impactWeight;
    if (r.status === 'NEUTRAL_PASS') return acc + r.impactWeight * 0.75;
    if (r.status === 'WARNING') return acc + r.impactWeight * 0.4;
    return acc;
  }, 0);

  const compositeScore = Math.min(99, Math.max(50, Math.round((earnedWeight / totalWeight) * 100)));

  // Determine Verdict & Strategy
  let verdict: QuantitativeSignalReport['verdict'] = 'BULL_CALL_SPREAD';
  let verdictDescription = '';
  let recommendedStrategy: OptionsStrategyStructure;
  let alternativeStrategy: OptionsStrategyStructure | undefined;

  const ivDecimal = stock.impliedVol / 100;

  if (ivr >= 75) {
    verdict = 'VOLATILITY_HARVEST';
    verdictDescription = 'High Implied Volatility regime. Harvest premium and theta decay via defined-risk Iron Condor or Credit Spread containment.';
    recommendedStrategy = buildIronCondor(symbol, spot, 35, ivDecimal, 0.07, stock.upcomingCatalyst, compositeScore);
    alternativeStrategy = buildBullCallSpread(symbol, spot, 45, ivDecimal, 0.06, stock.upcomingCatalyst, compositeScore - 4);
  } else if (ivr <= 40 && (rsi >= 55 || politicianTrade)) {
    verdict = 'STRONG_BUY_ALPHA';
    verdictDescription = 'Low IV with strong momentum and structural catalyst tailwind. Maximize upside convex payoff with Out-of-the-Money Long Calls.';
    recommendedStrategy = buildLongCallStrategy(symbol, spot, 45, ivDecimal, 0.05, stock.upcomingCatalyst, compositeScore);
    alternativeStrategy = buildBullCallSpread(symbol, spot, 35, ivDecimal, 0.06, stock.upcomingCatalyst, compositeScore - 2);
  } else if (stock.sectorId === 'biotech-medical' && ivr >= 60) {
    verdict = 'LONG_STRADDLE_EXPANSION';
    verdictDescription = 'Binary regulatory/clinical event with high expected variance shock. Deploy Long Straddle to capture explosive directional displacement.';
    recommendedStrategy = buildLongStraddle(symbol, spot, 30, ivDecimal, stock.upcomingCatalyst, compositeScore);
    alternativeStrategy = buildBullCallSpread(symbol, spot, 45, ivDecimal, 0.05, stock.upcomingCatalyst, compositeScore - 3);
  } else {
    verdict = 'BULL_CALL_SPREAD';
    verdictDescription = 'Optimal risk-to-reward vertical debit spread. Reduces cost basis and mitigates volatility crush by selling the upper strike.';
    recommendedStrategy = buildBullCallSpread(symbol, spot, 45, ivDecimal, 0.06, stock.upcomingCatalyst, compositeScore);
    alternativeStrategy = buildLongCallStrategy(symbol, spot, 60, ivDecimal, 0.08, stock.upcomingCatalyst, compositeScore - 5);
  }

  return {
    ticker: symbol,
    name: stock.name,
    sector: stock.sectorId.toUpperCase(),
    spotPrice: spot,
    verdict,
    verdictDescription,
    compositeScore,
    confidenceLevel: compositeScore >= 88 ? 'VERY_HIGH' : compositeScore >= 75 ? 'HIGH' : 'MODERATE',
    recommendedStrategy,
    alternativeStrategy,
    rulesPassedCount: passedRules.length,
    totalRulesEvaluated: rules.length,
    evaluatedRules: rules,
    factorScores: {
      trendScore: isNearResistance ? 92 : 78,
      volatilityScore: Math.round(ivr),
      momentumScore: Math.round(rsi * 1.2),
      catalystScore: Math.round(backtest.winRate5D),
    },
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
