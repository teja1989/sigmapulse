'use client';

import React, { useState } from 'react';
import { Search, Sparkles, Zap, TrendingUp, ArrowRight, CornerDownLeft, Loader2 } from 'lucide-react';

interface TickerSearchBarProps {
  onSearchTicker: (ticker: string) => Promise<void> | void;
  isLoading?: boolean;
}

const POPULAR_TICKERS = ['NFLX', 'PLTR', 'NVDA', 'IONQ', 'LLY', 'TSLA', 'AAPL', 'AMD', 'COIN', 'MSFT'];

export const TickerSearchBar: React.FC<TickerSearchBarProps> = ({ onSearchTicker, isLoading = false }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onSearchTicker(searchTerm.trim().toUpperCase());
    }
  };

  const handleQuickSelect = (ticker: string) => {
    setSearchTerm(ticker);
    onSearchTicker(ticker);
  };

  return (
    <div className="bg-surface-200/90 border border-cyan-500/30 rounded-2xl p-4 shadow-xl backdrop-blur-md">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center space-x-1.5 text-cyan-400">
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
        </div>

        <input
          type="text"
          placeholder="Search any ticker (e.g. NFLX, PLTR, NVDA, TSLA, LLY) to fetch live market data & 5-pillar signals..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-black/60 border border-white/10 hover:border-cyan-500/40 focus:border-cyan-400 rounded-xl pl-11 pr-28 py-3 text-sm text-white placeholder-slate-400 font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500/40 transition-all"
        />

        <button
          type="submit"
          disabled={isLoading}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-black font-mono font-bold text-xs px-4 py-2 rounded-lg transition-all shadow-glow-cyan flex items-center space-x-1.5"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Fetching...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-black" />
              <span>Audit Live</span>
              <CornerDownLeft className="w-3 h-3 text-black ml-0.5" />
            </>
          )}
        </button>
      </form>

      {/* Quick Select Ticker Pills */}
      <div className="flex flex-wrap items-center gap-2 mt-3 pt-2.5 border-t border-white/5 text-xs font-mono">
        <span className="text-slate-400 text-[11px] flex items-center space-x-1">
          <Zap className="w-3 h-3 text-cyan-400" />
          <span>Live Market Quick Audit:</span>
        </span>

        {POPULAR_TICKERS.map((t) => (
          <button
            key={t}
            onClick={() => handleQuickSelect(t)}
            className="bg-black/40 hover:bg-cyan-950/80 text-slate-300 hover:text-cyan-300 border border-white/10 hover:border-cyan-500/40 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all"
          >
            ${t}
          </button>
        ))}

        <span className="text-[10px] text-slate-500 ml-auto hidden md:inline">
          Real-Time Market Ingestion • 5-Pillar Decision Framework
        </span>
      </div>
    </div>
  );
};
