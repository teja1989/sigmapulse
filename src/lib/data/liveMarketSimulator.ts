import { SECTORS, StockAsset } from './sectors';
import { INITIAL_NEWS_FEED, BREAKING_NEWS_TEMPLATES, NewsItem } from './newsCrawler';

export interface MarketMacroStats {
  sp500: { price: number; change: number; changePct: number };
  nasdaq: { price: number; change: number; changePct: number };
  vix: { price: number; change: number; changePct: number };
  us10y: { price: number; change: number; changePct: number };
  fedFundsRate: string;
  marketRegime: 'RISK_ON_GROWTH' | 'VOLATILITY_EXPANSION' | 'DEFENSIVE_ROTATION' | 'TECH_MOMENTUM';
  marketBreadthAdvancers: number; // e.g. 384
  marketBreadthDecliners: number; // e.g. 116
}

export const INITIAL_MACRO_STATS: MarketMacroStats = {
  sp500: { price: 5842.10, change: 48.60, changePct: 0.84 },
  nasdaq: { price: 18624.50, change: 242.30, changePct: 1.32 },
  vix: { price: 15.42, change: -0.85, changePct: -5.22 },
  us10y: { price: 3.92, change: -0.04, changePct: -1.01 },
  fedFundsRate: '4.75% - 5.00%',
  marketRegime: 'TECH_MOMENTUM',
  marketBreadthAdvancers: 395,
  marketBreadthDecliners: 105,
};

/**
 * Apply micro-tick to stock prices for live terminal streaming feel
 */
export function simulatePriceTick(stock: StockAsset): StockAsset {
  // Random small delta between -0.3% and +0.35% with positive drift bias
  const deltaPct = (Math.random() - 0.46) * 0.005;
  const newPrice = Number((stock.price * (1 + deltaPct)).toFixed(2));
  const newChange = Number((stock.change + (newPrice - stock.price)).toFixed(2));
  const newChangePercent = Number(((newChange / (newPrice - newChange)) * 100).toFixed(2));

  // Update sparkline
  const newSparkline = [...stock.sparkline.slice(1), newPrice];

  return {
    ...stock,
    price: newPrice,
    change: newChange,
    changePercent: newChangePercent,
    sparkline: newSparkline,
  };
}

/**
 * Generate a new breaking news event on the fly
 */
export function generateRandomBreakingNews(sectorId?: string): NewsItem {
  const templates = BREAKING_NEWS_TEMPLATES;
  const template = templates[Math.floor(Math.random() * templates.length)];
  const now = new Date();
  
  return {
    id: `live-news-${Date.now()}`,
    title: template.title || 'Breaking Institutional Flow Detected in S&P Top Holdings',
    summary: template.summary || 'Unusual institutional dark pool accumulation detected across leading high-beta components.',
    source: template.source || 'SigmaPulse Quant Engine',
    sourceType: template.sourceType || 'FINANCIAL_WIRE',
    timestamp: now.toISOString(),
    timeAgo: 'Just now',
    sectorId: sectorId || template.sectorId || 'tech-ai',
    relatedTickers: template.relatedTickers || ['NVDA', 'IONQ'],
    sentimentScore: template.sentimentScore || 0.85,
    sentimentLabel: template.sentimentLabel || 'VERY_BULLISH',
    urgency: template.urgency || 'HIGH',
    marketImpactMultiplier: template.marketImpactMultiplier || 2.0,
    catalystCategory: template.catalystCategory || 'CHIP_SUBSIDY_OR_RESTRICTION',
    suggestedAction: template.suggestedAction || 'Deploy Bull Call Vertical Spread',
    historicalWinRate: template.historicalWinRate || 82,
  };
}
