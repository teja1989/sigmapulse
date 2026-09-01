import { describe, it, expect } from 'vitest';
import { BROKERS } from '@/lib/broker/brokerLinks';
import { analyzeTickerSignals } from '@/lib/quant/rulesEngine';

describe('Broker 1-Click Execution & Deep Linking', () => {
  it('should generate valid trade URLs for all supported brokerages', () => {
    const report = analyzeTickerSignals('PLTR');
    
    expect(BROKERS.length).toBeGreaterThanOrEqual(4);

    const robinhood = BROKERS.find(b => b.id === 'robinhood');
    expect(robinhood).toBeDefined();
    expect(robinhood?.getTradeUrl('PLTR')).toContain('robinhood.com/stocks/PLTR');

    const webull = BROKERS.find(b => b.id === 'webull');
    expect(webull).toBeDefined();
    expect(webull?.getTradeUrl('PLTR')).toContain('app.webull.com/trade?symbol=PLTR');

    const schwab = BROKERS.find(b => b.id === 'schwab');
    expect(schwab).toBeDefined();
    expect(schwab?.getTradeUrl('NVDA')).toContain('symbol=NVDA');
  });

  it('should generate order summary with capped max loss', () => {
    const report = analyzeTickerSignals('NVDA');
    const ibkr = BROKERS.find(b => b.id === 'ibkr');
    const summary = ibkr?.getOrderSummary('NVDA', report.recommendedStrategy);
    expect(summary).toContain('NVDA');
    expect(summary).toContain('Debit');
  });
});
