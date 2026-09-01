'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { SECTORS, StockAsset, SectorDefinition } from '@/lib/data/sectors';
import { INITIAL_MACRO_STATS, MarketMacroStats, simulatePriceTick, generateRandomBreakingNews } from '@/lib/data/liveMarketSimulator';
import { INITIAL_NEWS_FEED, NewsItem } from '@/lib/data/newsCrawler';
import { POLITICIAN_TRADES } from '@/lib/data/politicianTracker';
import { getCuratedOptionsSignals } from '@/lib/data/optionsSignals';
import { OptionsStrategyStructure } from '@/lib/quant/optionsEngine';
import { CatalystCategory } from '@/lib/quant/backtester';
import { analyzeTickerSignals, QuantitativeSignalReport } from '@/lib/quant/rulesEngine';

import { Header } from '@/components/Header';
import { TickerRibbon } from '@/components/TickerRibbon';
import { TickerSearchBar } from '@/components/TickerSearchBar';
import { SectorNavigation } from '@/components/SectorNavigation';
import { StockAssetCard } from '@/components/StockAssetCard';
import { OptionsSignalsMatrix } from '@/components/OptionsSignalsMatrix';
import { NewsIntelligenceFeed } from '@/components/NewsIntelligenceFeed';
import { PoliticianTradeTracker } from '@/components/PoliticianTradeTracker';
import { OptionsPayoffModal } from '@/components/OptionsPayoffModal';
import { BacktestWorkbenchModal } from '@/components/BacktestWorkbenchModal';
import { StockDetailModal } from '@/components/StockDetailModal';
import { TickerAnalysisModal } from '@/components/TickerAnalysisModal';

import { 
  Zap, 
  Activity, 
  Flame, 
  TrendingUp, 
  Landmark, 
  Layers, 
  ShieldCheck, 
  ArrowUpRight,
  Info,
  Radio,
  Sparkles
} from 'lucide-react';

export default function SigmaPulseTerminal() {
  // State
  const [sectorsData, setSectorsData] = useState<SectorDefinition[]>(SECTORS);
  const [activeSectorId, setActiveSectorId] = useState<string>('tech-ai'); // Default to Tech / AI
  const [macroStats, setMacroStats] = useState<MarketMacroStats>(INITIAL_MACRO_STATS);
  const [newsFeed, setNewsFeed] = useState<NewsItem[]>(INITIAL_NEWS_FEED);
  const [optionsSignals, setOptionsSignals] = useState<OptionsStrategyStructure[]>(getCuratedOptionsSignals());
  
  const [isSimulatedLive, setIsSimulatedLive] = useState<boolean>(true);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);

  // Modals state
  const [payoffModalStrategy, setPayoffModalStrategy] = useState<OptionsStrategyStructure | null>(null);
  const [isBacktestOpen, setIsBacktestOpen] = useState<boolean>(false);
  const [backtestInitialCategory, setBacktestInitialCategory] = useState<CatalystCategory>('FDA_APPROVAL');
  const [detailModalStock, setDetailModalStock] = useState<StockAsset | null>(null);
  const [analysisReport, setAnalysisReport] = useState<QuantitativeSignalReport | null>(null);

  // Audio chime
  const playAlertChime = () => {
    if (!audioEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {
      // Audio context may require user interaction
    }
  };

  // Flattened stocks list for ticker ribbon
  const allStocks = useMemo(() => {
    return sectorsData.flatMap(s => s.stocks);
  }, [sectorsData]);

  // Current active sector object or aggregated
  const activeSector = useMemo(() => {
    if (activeSectorId === 'all') return null;
    return sectorsData.find(s => s.id === activeSectorId) || sectorsData[0];
  }, [activeSectorId, sectorsData]);

  // Active stocks to display
  const displayedStocks = useMemo(() => {
    if (activeSectorId === 'all') {
      return allStocks;
    }
    return activeSector ? activeSector.stocks : [];
  }, [activeSectorId, activeSector, allStocks]);

  // Active sector options signals
  const displayedSignals = useMemo(() => {
    if (activeSectorId === 'all') return optionsSignals;
    const tickerSet = new Set(displayedStocks.map(s => s.ticker));
    return optionsSignals.filter(sig => tickerSet.has(sig.ticker));
  }, [activeSectorId, displayedStocks, optionsSignals]);

  // Live Price & Tick Streaming Simulator
  useEffect(() => {
    if (!isSimulatedLive) return;

    const interval = setInterval(() => {
      // Pick 2-3 random stocks to update with micro-ticks
      setSectorsData(prevSectors => {
        return prevSectors.map(sec => {
          const updatedStocks = sec.stocks.map(st => {
            if (Math.random() < 0.35) {
              return simulatePriceTick(st);
            }
            return st;
          });
          return {
            ...sec,
            stocks: updatedStocks,
          };
        });
      });
    }, 2400);

    return () => clearInterval(interval);
  }, [isSimulatedLive]);

  // Periodically inject breaking news event
  useEffect(() => {
    if (!isSimulatedLive) return;

    const newsInterval = setInterval(() => {
      if (Math.random() < 0.45) {
        const freshNews = generateRandomBreakingNews(activeSectorId !== 'all' ? activeSectorId : undefined);
        setNewsFeed(prev => [freshNews, ...prev.slice(0, 19)]);
        playAlertChime();
      }
    }, 28000);

    return () => clearInterval(newsInterval);
  }, [isSimulatedLive, activeSectorId, audioEnabled]);

  // Handlers
  const handleTriggerNewsFlash = () => {
    const freshNews = generateRandomBreakingNews(activeSectorId !== 'all' ? activeSectorId : undefined);
    freshNews.urgency = 'EXTREME';
    freshNews.title = `[FLASH BREAKING] ${freshNews.title}`;
    setNewsFeed(prev => [freshNews, ...prev.slice(0, 19)]);
    playAlertChime();
  };

  // Search handler: Runs institutional quantitative rules & generates signals report
  const handleSearchTicker = (ticker: string) => {
    const report = analyzeTickerSignals(ticker);
    setAnalysisReport(report);
  };

  const handleSelectStock = (ticker: string) => {
    // Run rule analysis directly on select
    handleSearchTicker(ticker);
  };

  const handleOpenOptions = (ticker: string) => {
    const sig = optionsSignals.find(s => s.ticker === ticker);
    if (sig) {
      setPayoffModalStrategy(sig);
    } else {
      const report = analyzeTickerSignals(ticker);
      setPayoffModalStrategy(report.recommendedStrategy);
    }
  };

  const handleOpenBacktestWithCategory = (cat: CatalystCategory) => {
    setBacktestInitialCategory(cat);
    setIsBacktestOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#06090e] text-slate-100 flex flex-col font-sans">
      {/* Top Institutional Header Bar */}
      <Header
        macroStats={macroStats}
        activeSectorId={activeSectorId}
        onSectorSelect={setActiveSectorId}
        onOpenBacktester={() => setIsBacktestOpen(true)}
        isSimulatedLive={isSimulatedLive}
        onToggleSimulatedLive={() => setIsSimulatedLive(!isSimulatedLive)}
        audioEnabled={audioEnabled}
        onToggleAudio={() => setAudioEnabled(!audioEnabled)}
        onTriggerNewsFlash={handleTriggerNewsFlash}
      />

      {/* Streaming Monospace Ticker Ribbon */}
      <TickerRibbon stocks={allStocks} onSelectStock={handleSelectStock} />

      {/* Main Terminal Workspace */}
      <main className="max-w-[1780px] mx-auto px-4 py-5 flex-1 w-full space-y-6">
        {/* Instant Quantitative Ticker Search & Rule Analysis Command Bar */}
        <TickerSearchBar onSearchTicker={handleSearchTicker} />

        {/* Sector Navigation Selector */}
        <SectorNavigation
          activeSectorId={activeSectorId}
          onSelectSector={setActiveSectorId}
        />

        {/* Dynamic Sector Overview Banner */}
        {activeSector && (
          <div 
            className="p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
            style={{
              backgroundColor: `${activeSector.color}08`,
              borderColor: `${activeSector.color}30`,
              boxShadow: `0 0 20px -5px ${activeSector.glowColor}`,
            }}
          >
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold font-mono text-white">
                  {activeSector.name}
                </span>
                <span
                  className="text-xs font-mono font-bold px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: `${activeSector.color}25`,
                    color: activeSector.color,
                  }}
                >
                  24H: {activeSector.dailyChange >= 0 ? '+' : ''}{activeSector.dailyChange.toFixed(2)}%
                </span>
              </div>
              <p className="text-xs text-slate-300 font-sans mt-1">
                {activeSector.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
              <div className="bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                <div className="text-slate-500 text-[10px]">MACRO DRIVER</div>
                <div className="text-slate-200 font-medium">{activeSector.macroDriver}</div>
              </div>

              <div className="bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                <div className="text-slate-500 text-[10px]">KEY CATALYST THEME</div>
                <div className="text-cyan-300 font-medium">{activeSector.keyCatalystTheme}</div>
              </div>
            </div>
          </div>
        )}

        {/* Core Multi-Column Intelligence Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Left / Main Section (7 cols on XL) */}
          <div className="xl:col-span-7 space-y-6">
            {/* Sector Stocks Cards Grid */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Flame className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-slate-200">
                    High-Beta Sector Assets & Greeks Matrix
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  {displayedStocks.length} Assets Active • Click Any Card for Instant Rule Dossier
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedStocks.map((stock) => (
                  <StockAssetCard
                    key={stock.ticker}
                    stock={stock}
                    onSelectStock={handleSelectStock}
                    onOpenOptions={handleOpenOptions}
                    onOpenBacktest={() => setIsBacktestOpen(true)}
                  />
                ))}
              </div>
            </div>

            {/* Options Signals Matrix */}
            <OptionsSignalsMatrix
              signals={displayedSignals.length > 0 ? displayedSignals : optionsSignals}
              activeSectorId={activeSectorId}
              onSelectStrategyForPayoff={(strat) => setPayoffModalStrategy(strat)}
              onSelectStock={handleSelectStock}
            />

            {/* Politician & Congressional STOCK Act Insider Tracker */}
            <PoliticianTradeTracker
              onSelectStock={handleSelectStock}
              onOpenOptionsForTicker={handleOpenOptions}
            />
          </div>

          {/* Right Section: Real-Time News Crawler & Sentiment Intelligence (5 cols on XL) */}
          <div className="xl:col-span-5 space-y-6">
            <NewsIntelligenceFeed
              news={newsFeed}
              activeSectorId={activeSectorId}
              onOpenBacktestWithCategory={handleOpenBacktestWithCategory}
              onSelectStock={handleSelectStock}
            />
          </div>
        </div>
      </main>

      {/* Terminal Footer */}
      <footer className="border-t border-white/10 bg-[#080d1a] py-3 text-center text-xs font-mono text-slate-500">
        <div className="max-w-[1780px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>SigmaPulse Institutional Derivatives & Quantitative News Terminal • v1.0.0 Pro Edition</span>
          <span className="text-slate-400">Black-Scholes-Merton • Multi-Factor Rules Engine • SEC EDGAR / STOCK Act Ingestion</span>
        </div>
      </footer>

      {/* Modals */}
      <TickerAnalysisModal
        report={analysisReport}
        onClose={() => setAnalysisReport(null)}
        onOpenPayoffModal={(strat) => setPayoffModalStrategy(strat)}
        onOpenBacktest={() => setIsBacktestOpen(true)}
      />

      <OptionsPayoffModal
        strategy={payoffModalStrategy}
        onClose={() => setPayoffModalStrategy(null)}
      />

      <BacktestWorkbenchModal
        initialCategory={backtestInitialCategory}
        isOpen={isBacktestOpen}
        onClose={() => setIsBacktestOpen(false)}
        onSelectStock={handleSelectStock}
      />

      <StockDetailModal
        stock={detailModalStock}
        onClose={() => setDetailModalStock(null)}
        onOpenOptions={handleOpenOptions}
      />
    </div>
  );
}
