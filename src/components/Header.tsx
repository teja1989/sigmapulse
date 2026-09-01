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
  BookOpen,
  Star,
  Sun,
  Moon,
  Terminal as TerminalIcon
} from 'lucide-react';
import { MarketMacroStats } from '@/lib/data/liveMarketSimulator';
import { useTheme, AppTheme } from '@/context/ThemeContext';
import { useWatchlist } from '@/context/WatchlistContext';
import { MacroMarketBar } from './MacroMarketBar';

interface HeaderProps {
  macroStats: MarketMacroStats;
  activeSectorId: string;
  onSectorSelect: (id: string) => void;
  onOpenBacktester: () => void;
  onOpenFieldGuide: () => void;
  onOpenWatchlist: () => void;
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
  onOpenWatchlist,
  isSimulatedLive,
  onToggleSimulatedLive,
  audioEnabled,
  onToggleAudio,
  onTriggerNewsFlash,
}) => {
  const { theme, setTheme } = useTheme();
  const { watchlist } = useWatchlist();

  return (
    <header className="border-b border-white/10 bg-surface-300/95 backdrop-blur-md sticky top-0 z-40">
      {/* Top Macro Market Status Ribbon */}
      <MacroMarketBar />

      {/* Main Terminal Navigation Header */}
      <div className="max-w-[1780px] mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Market Status */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2.5 bg-surface-200 border border-white/10 px-3 py-1.5 rounded-lg shadow-sm">
            <span className="font-mono text-institutional-blue font-black text-xl leading-none">Σ</span>
            <span className="font-bold text-base tracking-wider text-slate-100 font-mono">
              SIGMA<span className="text-institutional-blue">PULSE</span>
            </span>
            <span className="bg-institutional-blue/15 text-institutional-blue text-[10px] font-mono px-2 py-0.5 rounded font-bold border border-institutional-blue/30 uppercase tracking-wider">
              QUANT TERMINAL
            </span>
          </div>

          {/* Regime Badge */}
          <div className="hidden xl:flex items-center space-x-2 px-2.5 py-1 rounded bg-surface-200 border border-white/10 text-xs font-mono">
            <span className="text-slate-400">REGIME:</span>
            <span className="font-bold text-sky-400">
              {macroStats.marketRegime}
            </span>
          </div>
        </div>

        {/* Global Controls & Actions */}
        <div className="flex items-center space-x-2.5 text-xs">
          {/* Watchlist Trigger Button */}
          <button
            onClick={onOpenWatchlist}
            className="flex items-center space-x-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-lg transition-colors text-xs font-mono"
          >
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="hidden sm:inline font-semibold">Watchlist</span>
            <span className="bg-amber-500/30 text-amber-200 text-[10px] font-bold px-1.5 py-0.2 rounded ml-1">
              {watchlist.length}
            </span>
          </button>

          {/* Theme Switcher Toggle */}
          <div className="flex items-center bg-surface-200 border border-white/10 rounded-lg p-0.5">
            {(['dark', 'light', 'terminal'] as AppTheme[]).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                title={`Switch to ${t === 'dark' ? 'Pro Dark' : t === 'light' ? 'Day Light' : 'Bloomberg Terminal'} mode`}
                className={`p-1.5 rounded-md transition-colors ${
                  theme === t
                    ? 'bg-institutional-blue text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t === 'dark' && <Moon className="w-3.5 h-3.5" />}
                {t === 'light' && <Sun className="w-3.5 h-3.5 text-amber-400" />}
                {t === 'terminal' && <TerminalIcon className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
            ))}
          </div>

          {/* Interactive Guide / Academy Trigger */}
          <button
            onClick={onOpenFieldGuide}
            className="flex items-center space-x-1.5 bg-surface-200 hover:bg-surface-100 text-slate-300 border border-white/10 px-3 py-1.5 rounded-lg transition-colors text-xs font-mono"
          >
            <BookOpen className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline font-semibold">Field Guide</span>
          </button>

          {/* Quantitative Backtester Workbench Trigger */}
          <button
            onClick={onOpenBacktester}
            className="flex items-center space-x-1.5 bg-institutional-blue hover:bg-blue-700 text-white border border-blue-500/40 px-3.5 py-1.5 rounded-lg transition-colors font-mono font-semibold shadow-sm"
          >
            <Activity className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">Backtest Lab</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleAudio}
            title={audioEnabled ? 'Mute Alert Audio' : 'Enable Alert Audio'}
            className="p-1.5 rounded-lg bg-surface-200 hover:bg-surface-100 border border-white/10 text-slate-400 hover:text-white transition-colors"
          >
            {audioEnabled ? <Volume2 className="w-4 h-4 text-sky-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>
        </div>
      </div>
    </header>
  );
};
