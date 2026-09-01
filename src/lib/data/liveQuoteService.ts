import { StockAsset } from './sectors';
import { getOrCreateStockProfile } from '../quant/rulesEngine';

/**
 * Fetch real-time live stock quote from server API route
 */
export async function fetchLiveStockQuote(symbol: string): Promise<StockAsset> {
  const cleanSymbol = symbol.trim().toUpperCase();

  try {
    const res = await fetch(`/api/quote?ticker=${cleanSymbol}`);
    if (!res.ok) throw new Error('Live API unreachable');
    const data = await res.json();

    // A live payload must carry a usable price. Without this guard NaN propagates
    // through strike selection, Black-Scholes, the Greeks and the composite score,
    // and renders to the user as "$NaN" instead of failing.
    const price = Number(data?.price);
    if (data && data.success && isFinite(price) && price > 0) {
      return {
        ticker: cleanSymbol,
        name: data.name || `${cleanSymbol} Asset`,
        sectorId: 'tech-ai',
        price,
        change: Number(data.change) || 0,
        changePercent: Number(data.changePercent) || 0,
        marketCap: `$${Math.round(data.price * 2.5)}B`,
        peRatio: 32.0,
        volume: data.volume ?? 'n/a',
        avgVolume: data.avgVolume ?? 'n/a',
        ivRank: data.ivRank ?? 50,
        historicalVol: data.historicalVol ?? 35,
        impliedVol: data.impliedVol ?? 42,
        rsi14: data.rsi14 ?? 60,
        beta: 1.25,
        supportLevel: data.supportLevel ?? Number((price * 0.94).toFixed(2)),
        resistanceLevel: data.resistanceLevel ?? Number((price * 1.08).toFixed(2)),
        upcomingCatalyst: 'Quarterly Earnings & Institutional Growth Outlook',
        catalystDate: 'Nov 12, 2026',
        sentimentScore: Number(data.changePercent) >= 0 ? 82 : 65,
        analystConsensus: Number(data.rsi14) >= 55 ? 'BUY' : 'HOLD',
        priceTarget: data.priceTarget ?? Number((price * 1.20).toFixed(2)),
        sparkline: data.sparkline && data.sparkline.length >= 2 ? data.sparkline : [price * 0.98, price],
      };
    }
  } catch (err) {
    // Fall through to the placeholder profile below.
  }

  // No feed was reachable. The returned profile is derived from the ticker STRING and
  // carries no market information — callers must surface this as PLACEHOLDER provenance
  // rather than rendering it identically to a live quote.
  return getOrCreateStockProfile(cleanSymbol);
}
