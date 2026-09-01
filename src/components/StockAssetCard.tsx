'use client';

import React from 'react';
import { StockAsset } from '@/lib/data/sectors';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Sliders, 
  Sparkles, 
  Star,
  ArrowRight
} from 'lucide-react';
import { useWatchlist } from '@/context/WatchlistContext';

interface StockAssetCardProps {
  stock: StockAsset;
  onSelectStock: (ticker: string) => void;
  onOpenOptions: (ticker: string) => void;
  onOpenBacktest: () => void;
}

export const StockAssetCard: React.FC<StockAssetCardProps> = ({
  stock,
  onSelectStock,
  onOpenOptions,
  onOpenBacktest,
}) => {
  const { isWatchlisted, toggleWatchlist } = useWatchlist();
  const isStarred = isWatchlisted(stock.ticker);
  const isPositive = stock.change >= 0;

  // Normalize sparkline
  const minSpark = Math.min(...stock.sparkline);
  const maxSpark = Math.max(...stock.sparkline);
  const sparkRange = maxSpark - minSpark || 1;

  const sparkPoints = stock.sparkline
    .map((val, idx) => {
      const x = (idx / (stock.sparkline.length - 1)) * 100;
      const y = 30 - ((val - minSpark) / sparkRange) * 25;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="bg-surface-200 hover:bg-surface-100 border border-white/10 hover:border-institutional-blue/50 rounded-xl p-4 transition-all duration-150 flex flex-col justify-between shadow-card hover:shadow-card-hover group">
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleWatchlist(stock.ticker);
              }}
              title={isStarred ? 'Remove from Watchlist' : 'Add to Watchlist'}
              className="p-1 rounded text-slate-500 hover:text-amber-400 transition-colors"
            >
              <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
            </button>

            <div>
              <div className="flex items-center space-x-2">
                <span 
                  onClick={() => onSelectStock(stock.ticker)}
                  className="font-mono font-bold text-lg text-slate-100 hover:text-sky-400 cursor-pointer tracking-wide"
                >
                  ${stock.ticker}
                </span>
                <span className="text-xs font-sans text-slate-400 truncate max-w-[130px]">
                  {stock.name}
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                Vol: <span className="text-slate-300 font-semibold">{stock.volume}</span> • MktCap: <span className="text-slate-300 font-semibold">{stock.marketCap}</span>
              </div>
            </div>
          </div>

          {/* Price & Change */}
          <div className="text-right">
            <div className="font-mono font-bold text-lg text-slate-100 tabular-nums">
              ${stock.price.toFixed(2)}
            </div>
            <div className={`text-xs font-mono font-semibold flex items-center justify-end space-x-0.5 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>{isPositive ? '+' : ''}{stock.change.toFixed(2)} ({isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%)</span>
            </div>
          </div>
        </div>

        {/* Mini Sparkline & Technical Gauges */}
        <div className="grid grid-cols-12 gap-3 my-3 items-center">
          <div className="col-span-6 h-8 flex items-center">
            <svg viewBox="0 0 100 35" className="w-full h-full overflow-visible">
              <polyline
                fill="none"
                stroke={isPositive ? '#10b981' : '#ef4444'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={sparkPoints}
              />
            </svg>
          </div>

          <div className="col-span-6 grid grid-cols-2 gap-1.5 text-[11px] font-mono text-right">
            <div className="bg-surface-300 p-1.5 rounded border border-white/5">
              <span className="text-slate-500 block text-[9px] font-semibold">IV RANK</span>
              <span className={`font-bold ${stock.ivRank >= 70 ? 'text-purple-400' : 'text-sky-400'}`}>
                {stock.ivRank}%
              </span>
            </div>
            <div className="bg-surface-300 p-1.5 rounded border border-white/5">
              <span className="text-slate-500 block text-[9px] font-semibold">RSI (14D)</span>
              <span className="font-bold text-emerald-400">
                {stock.rsi14}
              </span>
            </div>
          </div>
        </div>

        {/* Catalyst Ribbon */}
        <div className="bg-surface-300 border border-white/5 rounded-lg p-2 text-xs flex items-start space-x-2">
          <Calendar className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
          <div className="font-sans text-[11px] text-slate-300 leading-tight">
            <strong className="text-slate-100 font-mono">{stock.catalystDate}:</strong> {stock.upcomingCatalyst}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs font-mono">
        <button
          onClick={() => onSelectStock(stock.ticker)}
          className="text-sky-400 hover:text-sky-300 flex items-center space-x-1 transition-colors text-[11px] font-semibold"
        >
          <Sparkles className="w-3 h-3 text-sky-400" />
          <span>5-Pillar Audit</span>
          <ArrowRight className="w-3 h-3 text-sky-400 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onOpenOptions(stock.ticker)}
            className="bg-institutional-blue/15 hover:bg-institutional-blue/25 text-sky-300 border border-institutional-blue/30 px-2.5 py-1 rounded text-[11px] font-semibold flex items-center space-x-1 transition-colors"
          >
            <Sliders className="w-3 h-3 text-sky-400" />
            <span>Options</span>
          </button>

          <button
            onClick={onOpenBacktest}
            className="bg-surface-300 hover:bg-surface-100 text-slate-400 hover:text-slate-200 border border-white/10 px-2 py-1 rounded text-[11px] transition-colors"
          >
            Backtest
          </button>
        </div>
      </div>
    </div>
  );
};
