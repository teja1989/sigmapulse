'use client';

import React from 'react';
import { 
  TrendingUp, 
  Activity, 
  Layers, 
  Radio, 
  Sliders, 
  RefreshCw, 
  Volume2, 
  VolumeX, 
  ShieldCheck,
  Zap,
  Globe,
  BookOpen
} from 'lucide-react';
import { MarketMacroStats } from '@/lib/data/liveMarketSimulator';

interface HeaderProps {
  macroStats: MarketMacroStats;
  activeSectorId: string;
  onSectorSelect: (id: string) => void;
  onOpenBacktester: () => void;
  onOpenFieldGuide: () => void;
  isSimulatedLive: boolean;
  onToggleSimulatedLive: () => void;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  onTriggerNewsFlash: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  macroStats,
  activeSectorId,
  onSectorSelect,
  onOpenBacktester,
  onOpenFieldGuide,
  isSimulatedLive,
  onToggleSimulatedLive,
  audioEnabled,
  onToggleAudio,
  onTriggerNewsFlash,
}) => {
  return (
    <header className="border-b border-white/10 bg-[#080d1a]/90 backdrop-blur-md sticky top-0 z-40">
      {/* Upper Terminal Bar */}
      <div className="max-w-[1780px] mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Market Status */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-gradient-to-r from-cyan-950 via-slate-900 to-purple-950 border border-cyan-500/30 px-3 py-1.5 rounded-lg shadow-glow-cyan">
            <span className="font-mono text-cyan-400 font-extrabold text-lg leading-none">Σ</span>
            <span className="font-bold text-base tracking-wider text-white font-mono">
              SIGMA<span className="text-cyan-400">PULSE</span>
            </span>
            <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider font-semibold border border-cyan-500/30">
              PRO QUANT
            </span>
          </div>

          {/* Live Feed Status */}
          <div className="hidden sm:flex items-center space-x-2 px-2.5 py-1 rounded bg-black/40 border border-white/10 text-xs font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-400 font-semibold uppercase tracking-wider text-[11px]">
              {isSimulatedLive ? 'FEED LIVE (STREAMING)' : 'LIVE SYNCED'}
            </span>
            <span className="text-slate-500 text-[10px]">|</span>
            <span className="text-slate-400 text-[10px]">NYC 09:30 - 16:00 EST</span>
          </div>
        </div>

        {/* Real-time Institutional Macro Ribbon */}
        <div className="hidden lg:flex items-center space-x-5 text-xs font-mono bg-surface-200/80 px-4 py-1.5 rounded-lg border border-white/5">
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400">S&P 500:</span>
            <span className="font-bold text-slate-100 tabular-nums">{macroStats.sp500.price.toFixed(1)}</span>
            <span className={`text-[11px] ${macroStats.sp500.change >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>
              {macroStats.sp500.change >= 0 ? '+' : ''}{macroStats.sp500.changePct.toFixed(2)}%
            </span>
          </div>

          <div className="h-3.5 w-px bg-white/10" />

          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400">NASDAQ:</span>
            <span className="font-bold text-slate-100 tabular-nums">{macroStats.nasdaq.price.toFixed(1)}</span>
            <span className={`text-[11px] ${macroStats.nasdaq.change >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>
              {macroStats.nasdaq.change >= 0 ? '+' : ''}{macroStats.nasdaq.changePct.toFixed(2)}%
            </span>
          </div>

          <div className="h-3.5 w-px bg-white/10" />

          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400">VIX:</span>
            <span className="font-bold text-amber-300 tabular-nums">{macroStats.vix.price.toFixed(2)}</span>
            <span className="text-[11px] text-terminal-green">{macroStats.vix.changePct.toFixed(1)}%</span>
          </div>

          <div className="h-3.5 w-px bg-white/10" />

          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400">10Y YIELD:</span>
            <span className="font-bold text-slate-200 tabular-nums">{macroStats.us10y.price.toFixed(2)}%</span>
          </div>

          <div className="h-3.5 w-px bg-white/10" />

          <div className="flex items-center space-x-1.5">
            <span className="text-slate-400">REGIME:</span>
            <span className="font-bold text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded text-[10px] border border-cyan-800/40">
              {macroStats.marketRegime}
            </span>
          </div>
        </div>

        {/* Global Controls & Actions */}
        <div className="flex items-center space-x-2 text-xs">
          {/* Interactive Guide / Academy Trigger */}
          <button
            onClick={onOpenFieldGuide}
            className="flex items-center space-x-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2.5 py-1.5 rounded-lg transition-all text-xs font-mono"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">How It Works Guide</span>
          </button>

          {/* Inject Breaking Catalyst */}
          <button
            onClick={onTriggerNewsFlash}
            title="Inject simulated breaking news event"
            className="flex items-center space-x-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1.5 rounded-lg transition-all text-xs font-mono"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Inject Flash</span>
          </button>

          {/* Quantitative Backtester Workbench Trigger */}
          <button
            onClick={onOpenBacktester}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-purple-900/60 to-indigo-900/60 hover:from-purple-800/80 hover:to-indigo-800/80 text-purple-200 border border-purple-500/40 px-3 py-1.5 rounded-lg transition-all font-mono font-medium shadow-glow-purple"
          >
            <Activity className="w-3.5 h-3.5 text-purple-400" />
            <span>Backtest Lab</span>
          </button>

          {/* Live Feed Toggle */}
          <button
            onClick={onToggleSimulatedLive}
            title="Toggle Streaming Mode"
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border font-mono transition-all ${
              isSimulatedLive 
                ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isSimulatedLive ? 'text-emerald-400 animate-pulse' : ''}`} />
            <span className="hidden md:inline">{isSimulatedLive ? 'Stream ON' : 'Stream PAUSED'}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleAudio}
            title={audioEnabled ? 'Mute Alert Chimes' : 'Enable Alert Chimes'}
            className="p-1.5 rounded-lg bg-surface-200 hover:bg-surface-100 border border-white/10 text-slate-400 hover:text-white transition-colors"
          >
            {audioEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>
        </div>
      </div>
    </header>
  );
};
