'use client';

import React, { useState } from 'react';
import { StockAsset } from '@/lib/data/sectors';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  Flame, 
  Calendar, 
  Target, 
  Zap, 
  ShieldCheck, 
  Layers, 
  BarChart2, 
  Activity,
  DollarSign
} from 'lucide-react';

interface StockDetailModalProps {
  stock: StockAsset | null;
  onClose: () => void;
  onOpenOptions: (ticker: string) => void;
}

export const StockDetailModal: React.FC<StockDetailModalProps> = ({
  stock,
  onClose,
  onOpenOptions,
}) => {
  const [timeframe, setTimeframe] = useState<'1D' | '5D' | '1M' | '3M' | '1Y'>('1M');

  if (!stock) return null;

  const isUp = stock.change >= 0;
  const upside = Number((((stock.priceTarget - stock.price) / stock.price) * 100).toFixed(1));

  // Generate simulated candle / area chart data
  const chartHeight = 200;
  const chartWidth = 620;
  const points = stock.sparkline;
  const minP = Math.min(...points) * 0.98;
  const maxP = Math.max(...points) * 1.02;
  const range = maxP - minP || 1;

  const svgPoints = points.map((p, idx) => {
    const x = (idx / (points.length - 1)) * (chartWidth - 40) + 20;
    const y = chartHeight - ((p - minP) / range) * (chartHeight - 40) - 20;
    return `${x},${y}`;
  }).join(' ');

  const areaSvg = `${svgPoints} ${chartWidth - 20},${chartHeight} 20,${chartHeight}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-surface-300 border border-cyan-500/40 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl shadow-cyan-950/50 flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-start justify-between bg-surface-200/90 sticky top-0 z-10">
          <div>
            <div className="flex items-center space-x-3">
              <span className="font-mono font-extrabold text-2xl text-white tracking-wider">
                ${stock.ticker}
              </span>
              <span className="text-sm font-mono text-slate-300">
                {stock.name}
              </span>
              <span className="bg-cyan-500/20 text-cyan-300 text-xs font-mono px-2 py-0.5 rounded font-semibold border border-cyan-500/30">
                {stock.sectorId.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center space-x-3 mt-2 font-mono">
              <span className="text-2xl font-bold text-white tabular-nums">
                ${stock.price.toFixed(2)}
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                isUp ? 'bg-emerald-950 text-terminal-green border border-emerald-800' : 'bg-red-950 text-terminal-red border border-red-800'
              }`}>
                {isUp ? '+' : ''}${stock.change.toFixed(2)} ({isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%)
              </span>
              <span className="text-xs text-slate-400">
                Vol: <strong className="text-slate-200">{stock.volume}</strong> (Avg: {stock.avgVolume})
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-surface-100 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5">
          {/* Chart Section */}
          <div className="bg-black/60 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3 text-xs font-mono">
              <span className="text-slate-400 font-semibold">PRICE ACTION & MOMENTUM PROFILE</span>
              <div className="flex items-center space-x-1 bg-surface-200 p-0.5 rounded border border-white/5">
                {(['1D', '5D', '1M', '3M', '1Y'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-2 py-0.5 rounded ${
                      timeframe === tf ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* SVG Interactive Area Chart */}
            <div className="w-full">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto select-none">
                <defs>
                  <linearGradient id="stockAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#00F0FF" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <polygon
                  fill="url(#stockAreaGrad)"
                  points={areaSvg}
                />
                <polyline
                  fill="none"
                  stroke="#00F0FF"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={svgPoints}
                />
              </svg>
            </div>
          </div>

          {/* Institutional Metrics Grid & Order Book Depth */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
            {/* Quantitative Profile */}
            <div className="bg-surface-200/90 border border-white/10 rounded-xl p-4 space-y-3">
              <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                Quantitative Derivatives & Factor Profile
              </h4>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-black/30 p-2.5 rounded border border-white/5">
                  <div className="text-slate-500 text-[10px]">IV RANK (IVR)</div>
                  <div className="font-bold text-purple-300 text-sm mt-0.5">{stock.ivRank}%</div>
                </div>

                <div className="bg-black/30 p-2.5 rounded border border-white/5">
                  <div className="text-slate-500 text-[10px]">14D RSI OSCILLATOR</div>
                  <div className="font-bold text-cyan-300 text-sm mt-0.5">{stock.rsi14}</div>
                </div>

                <div className="bg-black/30 p-2.5 rounded border border-white/5">
                  <div className="text-slate-500 text-[10px]">BETA TO SPX</div>
                  <div className="font-bold text-slate-200 text-sm mt-0.5">{stock.beta}</div>
                </div>

                <div className="bg-black/30 p-2.5 rounded border border-white/5">
                  <div className="text-slate-500 text-[10px]">SUPPORT / RESISTANCE</div>
                  <div className="font-bold text-slate-200 text-sm mt-0.5">${stock.supportLevel} / ${stock.resistanceLevel}</div>
                </div>
              </div>

              <div className="bg-black/30 p-2.5 rounded border border-white/5 flex items-center justify-between">
                <div>
                  <div className="text-slate-500 text-[10px]">CONSENSUS TARGET</div>
                  <div className="font-bold text-terminal-green text-sm">${stock.priceTarget} (+{upside}%)</div>
                </div>
                <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                  {stock.analystConsensus}
                </span>
              </div>
            </div>

            {/* Level 2 Order Book Simulation */}
            <div className="bg-surface-200/90 border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                  Level 2 Order Book Depth
                </h4>
                <span className="text-[10px] text-slate-500">Spread: $0.02</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                {/* Bids */}
                <div>
                  <div className="text-[10px] text-emerald-400 font-bold border-b border-white/5 pb-1 mb-1">
                    BID SIZE / PRICE
                  </div>
                  {[
                    { size: '2,400', price: (stock.price - 0.01).toFixed(2) },
                    { size: '5,800', price: (stock.price - 0.03).toFixed(2) },
                    { size: '12,100', price: (stock.price - 0.05).toFixed(2) },
                    { size: '18,500', price: (stock.price - 0.10).toFixed(2) },
                  ].map((b, i) => (
                    <div key={i} className="flex justify-between text-slate-300 py-0.5">
                      <span className="text-slate-500">{b.size}</span>
                      <span className="text-terminal-green font-bold">${b.price}</span>
                    </div>
                  ))}
                </div>

                {/* Asks */}
                <div>
                  <div className="text-[10px] text-terminal-red font-bold border-b border-white/5 pb-1 mb-1">
                    ASK PRICE / SIZE
                  </div>
                  {[
                    { size: '3,100', price: (stock.price + 0.01).toFixed(2) },
                    { size: '7,400', price: (stock.price + 0.04).toFixed(2) },
                    { size: '14,200', price: (stock.price + 0.08).toFixed(2) },
                    { size: '22,000', price: (stock.price + 0.12).toFixed(2) },
                  ].map((a, i) => (
                    <div key={i} className="flex justify-between text-slate-300 py-0.5">
                      <span className="text-terminal-red font-bold">${a.price}</span>
                      <span className="text-slate-500">{a.size}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Catalyst & Strategic Thesis */}
          <div className="bg-cyan-950/20 border border-cyan-500/30 p-4 rounded-xl">
            <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400 font-bold mb-1">
              <Calendar className="w-4 h-4" />
              <span>KEY UPCOMING CATALYST ({stock.catalystDate}):</span>
            </div>
            <p className="text-xs text-slate-200 font-sans leading-relaxed">
              {stock.upcomingCatalyst}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-surface-200/80 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onOpenOptions(stock.ticker);
            }}
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs px-5 py-2 rounded-lg transition-all shadow-glow-cyan flex items-center space-x-1.5"
          >
            <Zap className="w-4 h-4 text-black" />
            <span>Construct Options Alpha for ${stock.ticker}</span>
          </button>

          <button
            onClick={onClose}
            className="bg-surface-100 hover:bg-white/10 text-slate-300 font-mono text-xs px-4 py-2 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
