'use client';

import React from 'react';
import { StockAsset } from '@/lib/data/sectors';
import { TrendingUp, TrendingDown, Flame } from 'lucide-react';

interface TickerRibbonProps {
  stocks: StockAsset[];
  onSelectStock: (ticker: string) => void;
}

export const TickerRibbon: React.FC<TickerRibbonProps> = ({ stocks, onSelectStock }) => {
  // Duplicate for smooth seamless infinite scroll loop
  const displayStocks = [...stocks, ...stocks];

  return (
    <div className="bg-[#05080f] border-b border-white/5 overflow-hidden py-1.5 select-none">
      <div className="flex animate-ticker whitespace-nowrap space-x-6 hover:[animation-play-state:paused]">
        {displayStocks.map((stock, idx) => {
          const isUp = stock.change >= 0;
          return (
            <div
              key={`${stock.ticker}-${idx}`}
              onClick={() => onSelectStock(stock.ticker)}
              className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded hover:bg-white/5 cursor-pointer font-mono text-xs transition-colors"
            >
              <span className="font-bold text-slate-200 tracking-wider">{stock.ticker}</span>
              <span className="text-slate-300 tabular-nums">${stock.price.toFixed(2)}</span>
              <span
                className={`inline-flex items-center text-[11px] font-semibold tabular-nums ${
                  isUp ? 'text-terminal-green' : 'text-terminal-red'
                }`}
              >
                {isUp ? <TrendingUp className="w-3 h-3 mr-0.5 inline" /> : <TrendingDown className="w-3 h-3 mr-0.5 inline" />}
                {isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%
              </span>
              
              {stock.ivRank >= 75 && (
                <span className="inline-flex items-center text-[9px] bg-purple-950/80 text-purple-300 border border-purple-800/40 px-1 py-0.2 rounded font-mono">
                  <Flame className="w-2.5 h-2.5 text-purple-400 mr-0.5" />
                  IVR {stock.ivRank}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
