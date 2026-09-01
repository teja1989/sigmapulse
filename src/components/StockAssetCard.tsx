'use client';

import React from 'react';
import { StockAsset } from '@/lib/data/sectors';
import { 
  TrendingUp, 
  TrendingDown, 
  Flame, 
  Calendar, 
  Target, 
  Zap, 
  ArrowUpRight,
  BarChart2,
  ShieldAlert
} from 'lucide-react';

interface StockAssetCardProps {
  stock: StockAsset;
  onSelectStock: (ticker: string) => void;
  onOpenOptions: (ticker: string) => void;
  onOpenBacktest: (catalystCategory?: string) => void;
}

export const StockAssetCard: React.FC<StockAssetCardProps> = ({
  stock,
  onSelectStock,
  onOpenOptions,
  onOpenBacktest,
}) => {
  const isUp = stock.change >= 0;
  const upsidePercent = Number((((stock.priceTarget - stock.price) / stock.price) * 100).toFixed(1));

  // Sparkline SVG generator
  const minVal = Math.min(...stock.sparkline);
  const maxVal = Math.max(...stock.sparkline);
  const range = maxVal - minVal || 1;
  const width = 140;
  const height = 36;
  const points = stock.sparkline
    .map((val, idx) => {
      const x = (idx / (stock.sparkline.length - 1)) * width;
      const y = height - ((val - minVal) / range) * (height - 6) - 3;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="bg-surface-200/80 hover:bg-surface-100/90 border border-white/10 hover:border-cyan-500/40 rounded-xl p-4 transition-all duration-200 flex flex-col justify-between group shadow-md hover:shadow-glow-cyan">
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono font-bold text-lg text-white tracking-wider group-hover:text-cyan-300 transition-colors">
                {stock.ticker}
              </span>
              <span className="text-[11px] font-mono text-slate-400 truncate max-w-[130px]">
                {stock.name}
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-500 mt-0.5">
              Cap: {stock.marketCap} • P/E: {stock.peRatio > 0 ? stock.peRatio : 'N/A'} • Vol: {stock.volume}
            </div>
          </div>

          {/* Sparkline Graphic */}
          <div className="w-[120px] h-[36px] flex items-center justify-end">
            <svg width={width} height={height} className="overflow-visible">
              <defs>
                <linearGradient id={`grad-${stock.ticker}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={isUp ? '#00FF66' : '#FF3366'} stopOpacity="0.4" />
                  <stop offset="100%" stopColor={isUp ? '#00FF66' : '#FF3366'} stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <polyline
                fill="none"
                stroke={isUp ? '#00FF66' : '#FF3366'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
              />
            </svg>
          </div>
        </div>

        {/* Spot Price & Change */}
        <div className="mt-3 flex items-baseline justify-between">
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              ${stock.price.toFixed(2)}
            </span>
            <span
              className={`inline-flex items-center text-xs font-mono font-semibold tabular-nums px-2 py-0.5 rounded ${
                isUp
                  ? 'bg-emerald-950/60 text-terminal-green border border-emerald-800/40'
                  : 'bg-red-950/60 text-terminal-red border border-red-800/40'
              }`}
            >
              {isUp ? <TrendingUp className="w-3 h-3 mr-1 inline" /> : <TrendingDown className="w-3 h-3 mr-1 inline" />}
              {isUp ? '+' : ''}${stock.change.toFixed(2)} ({isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%)
            </span>
          </div>

          {/* Implied Volatility Rank Tag */}
          <div className="flex items-center space-x-1 font-mono text-xs">
            <span
              className={`px-2 py-0.5 rounded font-semibold text-[11px] flex items-center space-x-1 ${
                stock.ivRank >= 70
                  ? 'bg-purple-950/80 text-purple-300 border border-purple-500/40'
                  : stock.ivRank >= 45
                  ? 'bg-blue-950/80 text-blue-300 border border-blue-500/40'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              <Flame className="w-3 h-3 text-purple-400" />
              <span>IVR {stock.ivRank}%</span>
            </span>
          </div>
        </div>

        {/* Institutional Quant Grid */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/5 text-[11px] font-mono">
          <div className="bg-black/30 p-2 rounded border border-white/5">
            <div className="text-slate-500 text-[10px]">RSI (14D)</div>
            <div className={`font-semibold ${stock.rsi14 >= 70 ? 'text-amber-400' : stock.rsi14 <= 35 ? 'text-cyan-400' : 'text-slate-200'}`}>
              {stock.rsi14} {stock.rsi14 >= 70 ? '• Overbought' : stock.rsi14 <= 35 ? '• Oversold' : '• Neutral'}
            </div>
          </div>

          <div className="bg-black/30 p-2 rounded border border-white/5">
            <div className="text-slate-500 text-[10px]">IV / HV SPREAD</div>
            <div className="font-semibold text-slate-200">
              {stock.impliedVol}% / {stock.historicalVol}%
            </div>
          </div>

          <div className="bg-black/30 p-2 rounded border border-white/5">
            <div className="text-slate-500 text-[10px]">TARGET UPSIDE</div>
            <div className="font-semibold text-terminal-green">
              ${stock.priceTarget} (+{upsidePercent}%)
            </div>
          </div>
        </div>

        {/* Catalyst Preview */}
        <div className="mt-3 bg-gradient-to-r from-cyan-950/30 to-blue-950/20 border border-cyan-500/20 p-2.5 rounded-lg text-xs">
          <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400 mb-1">
            <span className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>NEXT CATALYST: {stock.catalystDate}</span>
            </span>
            <span className="font-bold text-amber-300">Sentiment {stock.sentimentScore}%</span>
          </div>
          <p className="text-[11px] text-slate-300 line-clamp-1 font-sans">
            {stock.upcomingCatalyst}
          </p>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
        <button
          onClick={() => onOpenOptions(stock.ticker)}
          className="flex-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:border-cyan-500/60 py-1.5 px-2.5 rounded-lg text-xs font-mono font-semibold flex items-center justify-center space-x-1 transition-all"
        >
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <span>Options Alpha</span>
        </button>

        <button
          onClick={() => onSelectStock(stock.ticker)}
          className="bg-surface-100 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 py-1.5 px-3 rounded-lg text-xs font-mono flex items-center justify-center space-x-1 transition-all"
        >
          <BarChart2 className="w-3.5 h-3.5 text-slate-400" />
          <span>Terminal</span>
        </button>
      </div>
    </div>
  );
};
