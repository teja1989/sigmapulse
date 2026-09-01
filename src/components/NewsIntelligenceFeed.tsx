'use client';

import { SampleDataBanner } from './ProvenanceBadge';
import React, { useState } from 'react';
import { NewsItem } from '@/lib/data/newsCrawler';
import { CatalystCategory } from '@/lib/quant/backtester';
import { 
  Globe, 
  Search, 
  Filter, 
  ExternalLink, 
  Activity, 
  Zap, 
  Flame, 
  Clock, 
  TrendingUp, 
  Radio,
  FileText
} from 'lucide-react';

interface NewsIntelligenceFeedProps {
  news: NewsItem[];
  activeSectorId: string;
  onOpenBacktestWithCategory: (category: CatalystCategory) => void;
  onSelectStock: (ticker: string) => void;
}

export const NewsIntelligenceFeed: React.FC<NewsIntelligenceFeedProps> = ({
  news,
  activeSectorId,
  onOpenBacktestWithCategory,
  onSelectStock,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSentiment, setSelectedSentiment] = useState<string>('ALL');

  const filteredNews = news.filter((item) => {
    // Sector match if not 'all'
    if (activeSectorId !== 'all' && item.sectorId !== activeSectorId) {
      // allow if ticker in sector matches
    }
    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSummary = item.summary.toLowerCase().includes(q);
      const matchTicker = item.relatedTickers.some(t => t.toLowerCase().includes(q));
      if (!matchTitle && !matchSummary && !matchTicker) return false;
    }
    // Sentiment filter
    if (selectedSentiment !== 'ALL') {
      if (selectedSentiment === 'VERY_BULLISH' && item.sentimentLabel !== 'VERY_BULLISH') return false;
      if (selectedSentiment === 'BULLISH' && item.sentimentLabel !== 'BULLISH' && item.sentimentLabel !== 'VERY_BULLISH') return false;
    }
    return true;
  });

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'SEC_FILING': return <FileText className="w-3.5 h-3.5 text-blue-400" />;
      case 'FDA_GOV': return <Activity className="w-3.5 h-3.5 text-emerald-400" />;
      case 'CONGRESS_DISCLOSURE': return <Flame className="w-3.5 h-3.5 text-amber-400" />;
      default: return <Globe className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  return (
    <div className="bg-surface-200/60 border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col h-full">
      <div className="mb-4">
        <SampleDataBanner>
          <strong>Sample headlines, not a live newswire.</strong> These items are illustrative
          content shipped with the app for layout purposes. They are not reporting, are not
          sourced from any news organisation or regulatory filing, and must not be traded on.
          A real feed (SEC EDGAR full-text, openFDA, a licensed wire) is not yet connected.
        </SampleDataBanner>
      </div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-white tracking-wide font-mono">
                Real-Time Catalyst & News Crawler
              </h2>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded font-semibold border border-emerald-500/30">
                SAMPLE
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans">
              Sample catalyst feed. Live SEC / FDA / wire ingest is not yet connected.
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search catalysts or ticker..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 font-mono"
          />
        </div>
      </div>

      {/* News Stream List */}
      <div className="mt-4 space-y-3.5 overflow-y-auto max-h-[580px] pr-1.5">
        {filteredNews.map((item) => {
          return (
            <div
              key={item.id}
              className="bg-surface-300/80 hover:bg-surface-100/90 border border-white/10 hover:border-cyan-500/40 rounded-xl p-4 transition-all group"
            >
              {/* Top Meta Line */}
              <div className="flex items-center justify-between gap-2 text-xs font-mono mb-2">
                <div className="flex items-center space-x-2">
                  <span className="flex items-center space-x-1 text-slate-400 bg-black/40 px-2 py-0.5 rounded border border-white/5">
                    {getSourceIcon(item.sourceType)}
                    <span>{item.source}</span>
                  </span>
                  <span className="text-slate-500 flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{item.timeAgo}</span>
                  </span>
                </div>

                <div className="flex items-center space-x-1.5">
                  {/* Urgency Badge */}
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    item.urgency === 'EXTREME'
                      ? 'bg-red-950/80 text-terminal-red border border-red-500/40 animate-pulse'
                      : item.urgency === 'HIGH'
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    {item.urgency} IMPACT
                  </span>

                  {/* Sentiment Score */}
                  <span className="bg-emerald-950/80 text-terminal-green border border-emerald-500/40 px-2 py-0.5 rounded text-[10px] font-bold">
                    +{(item.sentimentScore * 100).toFixed(0)}% SENTIMENT
                  </span>
                </div>
              </div>

              {/* Title & Summary */}
              <h3 className="font-bold text-sm text-slate-100 group-hover:text-cyan-200 transition-colors">
                {item.title}
              </h3>
              <p className="text-xs text-slate-300 font-sans mt-1.5 line-clamp-2 leading-relaxed">
                {item.summary}
              </p>

              {/* Related Tickers & Catalyst Action Bar */}
              <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <div className="flex items-center space-x-1.5">
                  <span className="text-slate-500 text-[10px]">TICKERS:</span>
                  {item.relatedTickers.map((t) => (
                    <button
                      key={t}
                      onClick={() => onSelectStock(t)}
                      className="bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-700/40 px-2 py-0.5 rounded font-bold transition-all hover:scale-105"
                    >
                      ${t}
                    </button>
                  ))}
                  <span className="text-slate-500 text-[10px] ml-2">
                    Vol Multiplier: <strong className="text-amber-400">{item.marketImpactMultiplier}x</strong>
                  </span>
                </div>

                {/* Backtest Button */}
                <button
                  onClick={() => onOpenBacktestWithCategory(item.catalystCategory)}
                  className="bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-600/40 px-3 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-glow-purple"
                >
                  <Activity className="w-3.5 h-3.5 text-purple-400" />
                  <span>Backtest Event Precedent ({item.historicalWinRate}% WR)</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
