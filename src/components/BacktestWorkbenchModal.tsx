'use client';

import React, { useState } from 'react';
import { 
  CatalystCategory, 
  runEventBacktest, 
  getCatalystTitle,
  HISTORICAL_CATALYST_DATABASE 
} from '@/lib/quant/backtester';
import { 
  X, 
  Activity, 
  TrendingUp, 
  BarChart3, 
  Calendar, 
  CheckCircle2, 
  ShieldAlert, 
  Zap, 
  Layers, 
  Sparkles,
  Award
} from 'lucide-react';

interface BacktestWorkbenchModalProps {
  initialCategory?: CatalystCategory;
  isOpen: boolean;
  onClose: () => void;
  onSelectStock: (ticker: string) => void;
}

export const BacktestWorkbenchModal: React.FC<BacktestWorkbenchModalProps> = ({
  initialCategory = 'FDA_APPROVAL',
  isOpen,
  onClose,
  onSelectStock,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CatalystCategory>(initialCategory);

  if (!isOpen) return null;

  const result = runEventBacktest(selectedCategory);

  const categories: CatalystCategory[] = [
    'FDA_APPROVAL',
    'QUANTUM_BENCHMARK',
    'CHIP_SUBSIDY_OR_RESTRICTION',
    'CONGRESSIONAL_INSIDER_BUY',
    'DEFENSE_CONTRACT_AWARD',
    'AI_MODEL_RELEASE',
    'FED_RATE_SURPRISE',
    'ANTITRUST_REGULATORY_PROBE',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-surface-300 border border-purple-500/40 rounded-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto shadow-2xl shadow-purple-950/50 flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-white/10 flex items-start justify-between bg-surface-200/90 sticky top-0 z-10">
          <div>
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                <Activity className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold font-mono text-white">
                Event Precedent Quantitative Backtester
              </h2>
              <span className="bg-purple-500/20 text-purple-300 text-[10px] font-mono px-2 py-0.5 rounded font-semibold border border-purple-500/30">
                10-YEAR SAMPLE MATRIX
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-1">
              Validating how markets historically reprice specific structural catalysts across 1-day, 5-day, and 30-day horizons.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-surface-100 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-6">
          {/* Catalyst Selector Tabs */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-2 uppercase font-semibold">
              Select Market Catalyst Theme
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 font-mono text-xs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedCategory === cat
                      ? 'bg-purple-950/70 border-purple-500 text-white shadow-glow-purple font-semibold'
                      : 'bg-surface-200/80 hover:bg-surface-100 border-white/5 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="truncate text-[11px]">{getCatalystTitle(cat)}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Quantitative Performance Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
            {/* 1-Day Horizon */}
            <div className="bg-surface-200/90 border border-white/10 p-3.5 rounded-xl">
              <div className="text-slate-400 text-[10px]">1-DAY REACTION</div>
              <div className="text-xl font-bold text-terminal-green mt-1">
                {result.winRate1D}% WR
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5">
                Median: <strong className="text-white">+{result.medianReturn1D}%</strong>
              </div>
            </div>

            {/* 5-Day Horizon */}
            <div className="bg-surface-200/90 border border-white/10 p-3.5 rounded-xl">
              <div className="text-slate-400 text-[10px]">5-DAY DRIFT</div>
              <div className="text-xl font-bold text-terminal-green mt-1">
                {result.winRate5D}% WR
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5">
                Median: <strong className="text-white">+{result.medianReturn5D}%</strong>
              </div>
            </div>

            {/* 30-Day Horizon */}
            <div className="bg-surface-200/90 border border-white/10 p-3.5 rounded-xl">
              <div className="text-slate-400 text-[10px]">30-DAY EXPANSION</div>
              <div className="text-xl font-bold text-cyan-300 mt-1">
                {result.winRate30D}% WR
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5">
                Median: <strong className="text-white">+{result.medianReturn30D}%</strong>
              </div>
            </div>

            {/* Sharpe & Risk */}
            <div className="bg-surface-200/90 border border-white/10 p-3.5 rounded-xl">
              <div className="text-slate-400 text-[10px]">SHARPE / MAX DD</div>
              <div className="text-xl font-bold text-purple-300 mt-1">
                {result.sharpeRatio} SR
              </div>
              <div className="text-[11px] text-terminal-red mt-0.5">
                Max Drawdown: <strong>{result.maxAdverseExcursion}%</strong>
              </div>
            </div>
          </div>

          {/* Institutional Strategy Recommendation Callout */}
          <div className="bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-surface-200 border border-purple-500/30 p-4 rounded-xl">
            <div className="flex items-center space-x-2 text-xs font-mono text-purple-300 font-bold mb-1.5">
              <Award className="w-4 h-4 text-purple-400" />
              <span>OPTIMAL DERIVATIVES STRUCTURE:</span>
              <span className="text-white bg-purple-900/60 px-2 py-0.5 rounded border border-purple-700/50">
                {result.bestOptionsStrategy}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              {result.summaryAnalysis}
            </p>
          </div>

          {/* Historical Precedents Table */}
          <div className="bg-surface-200/90 border border-white/10 rounded-xl p-4">
            <h4 className="text-xs font-mono font-bold text-slate-300 mb-3 uppercase tracking-wider flex items-center justify-between">
              <span>Historical Precedent Log ({result.sampleSize} Verified Cases)</span>
              <span className="text-slate-500 text-[10px]">Indexed 2023 - 2026</span>
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono text-left">
                <thead>
                  <tr className="text-slate-500 border-b border-white/10 pb-2">
                    <th className="pb-2">DATE</th>
                    <th className="pb-2">TICKER</th>
                    <th className="pb-2">HEADLINE CATALYST</th>
                    <th className="pb-2">1D MOVE</th>
                    <th className="pb-2">5D MOVE</th>
                    <th className="pb-2">30D MOVE</th>
                    <th className="pb-2">MAX DD</th>
                    <th className="pb-2 text-right">OPTIONS PROFIT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {result.historicalPrecedents.map((precedent) => (
                    <tr key={precedent.id} className="text-slate-200 hover:bg-white/5">
                      <td className="py-2.5 text-slate-400">{precedent.date}</td>
                      <td className="py-2.5">
                        <button
                          onClick={() => {
                            onClose();
                            onSelectStock(precedent.ticker);
                          }}
                          className="font-bold text-cyan-400 hover:underline"
                        >
                          ${precedent.ticker}
                        </button>
                      </td>
                      <td className="py-2.5 max-w-[280px] truncate text-slate-300 font-sans">
                        {precedent.headline}
                      </td>
                      <td className="py-2.5 font-bold text-terminal-green">+{precedent.oneDayReturn}%</td>
                      <td className="py-2.5 font-bold text-terminal-green">+{precedent.fiveDayReturn}%</td>
                      <td className="py-2.5 font-bold text-cyan-300">+{precedent.thirtyDayReturn}%</td>
                      <td className="py-2.5 text-terminal-red">{precedent.maxDrawdown}%</td>
                      <td className="py-2.5 text-right">
                        <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                          WIN
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-surface-200/80 flex items-center justify-between">
          <div className="text-xs font-mono text-slate-400">
            Recommended Holding Period: <strong className="text-white">{result.recommendedHoldingDays} Days</strong> • Sample Size: <strong className="text-purple-300">{result.sampleSize} Precedents</strong>
          </div>
          <button
            onClick={onClose}
            className="bg-purple-600 hover:bg-purple-500 text-white font-mono font-bold text-xs px-5 py-2 rounded-lg transition-all shadow-glow-purple"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
