'use client';

import React from 'react';
import { useWatchlist } from '@/context/WatchlistContext';
import { 
  Star, 
  Trash2, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Sliders, 
  ArrowRight, 
  X,
  Layers,
  Plus
} from 'lucide-react';
import { StockAsset } from '@/lib/data/sectors';

interface WatchlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  allStocks: StockAsset[];
  onSelectStock: (ticker: string) => void;
  onOpenOptions: (ticker: string) => void;
}

export const WatchlistDrawer: React.FC<WatchlistDrawerProps> = ({
  isOpen,
  onClose,
  allStocks,
  onSelectStock,
  onOpenOptions,
}) => {
  const { watchlist, removeFromWatchlist, clearWatchlist } = useWatchlist();

  if (!isOpen) return null;

  // Match watchlisted tickers against stock assets
  const matchedStocks = watchlist.map(ticker => {
    const found = allStocks.find(s => s.ticker === ticker);
    if (found) return found;
    return {
      ticker,
      name: `${ticker} Corp`,
      sectorId: 'tech-ai',
      price: 100,
      change: 1.5,
      changePercent: 1.5,
      ivRank: 50,
      rsi14: 60,
      supportLevel: 94,
      resistanceLevel: 108,
      priceTarget: 120,
      sparkline: [98, 99, 100],
    } as StockAsset;
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-300 border-l border-white/10 w-full max-w-md h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-surface-200/90">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <h3 className="font-bold font-mono text-sm text-white flex items-center space-x-1.5">
                <span>Personal Watchlist</span>
                <span className="bg-amber-500/20 text-amber-300 text-[10px] px-1.5 py-0.2 rounded font-mono">
                  {watchlist.length}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-sans">
                Pinned tickers saved to local terminal storage
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {watchlist.length > 0 && (
              <button
                onClick={clearWatchlist}
                title="Clear Watchlist"
                className="p-1.5 rounded text-slate-400 hover:text-terminal-red transition-colors text-xs font-mono"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-surface-100 hover:bg-white/10 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Watchlist Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {matchedStocks.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-mono text-xs space-y-2">
              <Star className="w-8 h-8 mx-auto opacity-30" />
              <p>Your watchlist is empty.</p>
              <p className="text-[11px] text-slate-400 font-sans">
                Click the ★ star icon on any stock card or search result to pin it here.
              </p>
            </div>
          ) : (
            matchedStocks.map((stock) => {
              const isPositive = stock.change >= 0;
              return (
                <div
                  key={stock.ticker}
                  className="bg-surface-200/80 border border-white/10 hover:border-cyan-500/40 rounded-xl p-3.5 transition-all group flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span
                          onClick={() => {
                            onSelectStock(stock.ticker);
                            onClose();
                          }}
                          className="font-bold font-mono text-base text-white hover:text-cyan-300 cursor-pointer"
                        >
                          ${stock.ticker}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono truncate max-w-[120px]">
                          {stock.name}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-slate-400 mt-1 flex items-center space-x-2">
                        <span>IVR: <strong className="text-purple-300">{stock.ivRank}%</strong></span>
                        <span>•</span>
                        <span>RSI: <strong className="text-cyan-300">{stock.rsi14}</strong></span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <div className="font-mono font-bold text-sm text-white">
                        ${stock.price.toFixed(2)}
                      </div>
                      <div className={`text-xs font-mono font-semibold flex items-center ${isPositive ? 'text-terminal-green' : 'text-terminal-red'}`}>
                        {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                    <button
                      onClick={() => {
                        onSelectStock(stock.ticker);
                        onClose();
                      }}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 text-[11px]"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>5-Pillar Audit</span>
                    </button>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          onOpenOptions(stock.ticker);
                          onClose();
                        }}
                        className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded text-[10px] font-bold border border-cyan-500/30 flex items-center space-x-1"
                      >
                        <Sliders className="w-3 h-3" />
                        <span>Options</span>
                      </button>

                      <button
                        onClick={() => removeFromWatchlist(stock.ticker)}
                        title="Remove from Watchlist"
                        className="text-slate-500 hover:text-terminal-red p-1 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 bg-surface-200/80 text-center text-[11px] font-mono text-slate-400">
          SigmaPulse Watchlist Engine • Real-Time Synchronization
        </div>
      </div>
    </div>
  );
};
