import { OptionsStrategyStructure } from '../quant/optionsEngine';

export interface BrokerExecutionOption {
  id: 'robinhood' | 'schwab' | 'ibkr' | 'webull';
  name: string;
  badge: string;
  color: string;
  iconName: string;
  getTradeUrl: (ticker: string, strategy?: OptionsStrategyStructure) => string;
  getOrderSummary: (ticker: string, strategy: OptionsStrategyStructure) => string;
}

export const BROKERS: BrokerExecutionOption[] = [
  {
    id: 'robinhood',
    name: 'Robinhood',
    badge: '1-Click Direct Chain',
    color: '#00C805',
    iconName: 'Feather',
    getTradeUrl: (ticker: string) => `https://robinhood.com/stocks/${ticker.toUpperCase()}`,
    getOrderSummary: (ticker: string, strategy: OptionsStrategyStructure) => {
      const legsDesc = strategy.legs.map(l => `${l.action} ${l.strike} ${l.type}`).join(' & ');
      return `Robinhood Order: ${ticker} ${strategy.name} (${legsDesc}) @ $${Math.abs(strategy.netDebit).toFixed(2)} Limit`;
    }
  },
  {
    id: 'webull',
    name: 'Webull',
    badge: 'Options Chain Deep Link',
    color: '#185BFF',
    iconName: 'Smartphone',
    getTradeUrl: (ticker: string) => `https://app.webull.com/trade?symbol=${ticker.toUpperCase()}`,
    getOrderSummary: (ticker: string, strategy: OptionsStrategyStructure) => {
      return `Webull Multi-Leg: ${ticker} ${strategy.name} with Max Risk capped at $${strategy.maxLoss}`;
    }
  },
  {
    id: 'schwab',
    name: 'Charles Schwab (thinkorswim)',
    badge: 'Institutional Spread Ticket',
    color: '#00A3E0',
    iconName: 'Terminal',
    getTradeUrl: (ticker: string) => `https://client.schwab.com/app/trade/tom/#/trade?symbol=${ticker.toUpperCase()}`,
    getOrderSummary: (ticker: string, strategy: OptionsStrategyStructure) => {
      return `thinkorswim Order: ${ticker} ${strategy.legs.length}-Leg Spread, PoP: ${strategy.probabilityOfProfit}%`;
    }
  },
  {
    id: 'ibkr',
    name: 'Interactive Brokers (TWS)',
    badge: 'SmartRouting Algo',
    color: '#D4141E',
    iconName: 'Layers',
    getTradeUrl: (ticker: string) => `https://www.interactivebrokers.com/portal/#/trade/option?symbol=${ticker.toUpperCase()}`,
    getOrderSummary: (ticker: string, strategy: OptionsStrategyStructure) => {
      return `IBKR Combo Order: ${ticker} ${strategy.name} Net Debit $${Math.abs(strategy.netDebit).toFixed(2)}`;
    }
  }
];
