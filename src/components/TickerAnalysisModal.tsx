'use client';

import React, { useState } from 'react';
import { QuantitativeSignalReport, DecisionPillar, EvaluatedRule } from '@/lib/quant/rulesEngine';
import { OptionsStrategyStructure } from '@/lib/quant/optionsEngine';
import { 
  X, 
  Zap, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Sliders, 
  Activity, 
  TrendingUp, 
  Target, 
  Flame, 
  Calendar, 
  Layers, 
  Sparkles,
  ArrowRight,
  DollarSign,
  Landmark,
  HelpCircle,
  BookOpen,
  Info
} from 'lucide-react';

interface TickerAnalysisModalProps {
  report: QuantitativeSignalReport | null;
  onClose: () => void;
  onOpenPayoffModal: (strategy: OptionsStrategyStructure) => void;
  onOpenBacktest: () => void;
  onOpenFieldGuide: () => void;
}

export const TickerAnalysisModal: React.FC<TickerAnalysisModalProps> = ({
  report,
  onClose,
  onOpenPayoffModal,
  onOpenBacktest,
  onOpenFieldGuide,
}) => {
  const [selectedPillar, setSelectedPillar] = useState<string | null>(null);

  if (!report) return null;

  const pillarsList = [
    report.fivePillars.trendPillar,
    report.fivePillars.volatilityPillar,
    report.fivePillars.insiderPillar,
    report.fivePillars.catalystPillar,
    report.fivePillars.riskRewardPillar,
  ];

  const getPillarIcon = (iconName: string) => {
    switch (iconName) {
      case 'TrendingUp': return <TrendingUp className="w-4 h-4" />;
      case 'Flame': return <Flame className="w-4 h-4" />;
      case 'Landmark': return <Landmark className="w-4 h-4" />;
      case 'Sparkles': return <Sparkles className="w-4 h-4" />;
      default: return <ShieldCheck className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-surface-300 border border-cyan-500/40 rounded-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto shadow-2xl shadow-cyan-950/50 flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-start justify-between bg-surface-200/90 sticky top-0 z-10">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono font-extrabold text-xl shadow-glow-cyan">
              {report.ticker.slice(0, 3)}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold font-mono text-white tracking-wider">
                  ${report.ticker}
                </h2>
                <span className="text-xs font-mono text-slate-300">
                  {report.name}
                </span>
                <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-mono px-2 py-0.5 rounded font-bold border border-cyan-500/30">
                  {report.sector}
                </span>
              </div>
              <div className="flex items-center space-x-3 text-xs font-mono text-slate-400 mt-1">
                <span>Spot: <strong className="text-white">${report.spotPrice.toFixed(2)}</strong></span>
                <span>•</span>
                <span>Support: <strong className="text-slate-200">${report.supportResistance.support}</strong></span>
                <span>•</span>
                <span>Target: <strong className="text-terminal-green">${report.supportResistance.breakoutTarget}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Field Guide Help Trigger */}
            <button
              onClick={onOpenFieldGuide}
              className="flex items-center space-x-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-3 py-1.5 rounded-lg text-xs font-mono transition-all"
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>How It Works Guide</span>
            </button>

            {/* Composite Score Circle */}
            <div className="flex flex-col items-end">
              <div className="flex items-center space-x-1.5 bg-gradient-to-r from-cyan-950 to-emerald-950 border border-cyan-500/50 px-3 py-1 rounded-lg text-xs font-mono font-bold text-terminal-green shadow-glow-green">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>{report.compositeScore}/100 SIGMA SCORE</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 mt-0.5">
                {report.confidenceLevel} CONVICTION
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-surface-100 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-6">
          {/* Main Plain-English Recommendation Hero */}
          <div className="bg-gradient-to-r from-surface-200 via-cyan-950/30 to-surface-200 border border-cyan-500/40 p-5 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono text-slate-400 font-bold uppercase">
                  VERDICT:
                </span>
                <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-3 py-0.5 rounded-lg text-xs font-mono font-extrabold shadow-glow-cyan">
                  {report.verdictTitle}
                </span>
              </div>

              <span className="text-xs font-mono text-terminal-green font-bold">
                ✓ {report.rulesPassedCount} of {report.totalRulesEvaluated} Signals Aligned
              </span>
            </div>

            <p className="text-sm text-white font-sans font-medium leading-relaxed mt-2 bg-black/40 p-3 rounded-xl border border-white/5">
              💡 <strong className="text-cyan-300 font-mono">Plain English Takeaway: </strong> 
              {report.laymanOneLiner}
            </p>
          </div>

          {/* THE 5 DECISION PILLARS GRID */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                  The 5 Core Decision Pillars (Layman Interpretation)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Click any pillar for deep explanation
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {pillarsList.map((pillar) => {
                const isSelected = selectedPillar === pillar.id;
                return (
                  <div
                    key={pillar.id}
                    onClick={() => setSelectedPillar(isSelected ? null : pillar.id)}
                    className={`bg-surface-200/90 border p-3.5 rounded-xl cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected ? 'border-cyan-400 shadow-glow-cyan bg-surface-100' : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className="p-1.5 rounded-lg"
                          style={{ backgroundColor: `${pillar.color}20`, color: pillar.color }}
                        >
                          {getPillarIcon(pillar.iconName)}
                        </div>
                        <span className="font-mono font-bold text-sm" style={{ color: pillar.color }}>
                          {pillar.score}%
                        </span>
                      </div>

                      <div className="font-bold text-xs text-white truncate font-mono">
                        {pillar.shortLabel}
                      </div>

                      <p className="text-[11px] text-slate-300 font-sans mt-1 line-clamp-2">
                        {pillar.plainEnglishSummary}
                      </p>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-white/5 text-[10px] font-mono text-slate-500 flex items-center justify-between">
                      <span>{pillar.status}</span>
                      <Info className="w-3 h-3 text-slate-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actionable Recommended Derivative Structure Card */}
          <div className="bg-surface-200/90 border border-cyan-500/40 rounded-xl p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                  OPTIMAL DERIVATIVES EXECUTION STRUCTURE
                </span>
                <h3 className="text-base font-bold font-mono text-white mt-0.5">
                  {report.recommendedStrategy.name}
                </h3>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onOpenPayoffModal(report.recommendedStrategy)}
                  className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center space-x-1.5 transition-all shadow-glow-cyan"
                >
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Interactive Payoff Sandbox</span>
                </button>

                <button
                  onClick={onOpenBacktest}
                  className="bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-600/40 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center space-x-1.5 transition-all"
                >
                  <Activity className="w-3.5 h-3.5 text-purple-400" />
                  <span>Backtest Precedent</span>
                </button>
              </div>
            </div>

            {/* Greeks & Risk Parameters */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4 text-xs font-mono">
              <div className="bg-black/40 p-2.5 rounded-lg border border-white/5">
                <div className="text-slate-500 text-[10px]">ENTRY COST (DEBIT)</div>
                <div className="font-bold text-white mt-0.5">
                  ${Math.abs(report.recommendedStrategy.netDebit).toFixed(2)}
                </div>
              </div>

              <div className="bg-black/40 p-2.5 rounded-lg border border-white/5">
                <div className="text-slate-500 text-[10px]">MAX PROFIT / LOSS</div>
                <div className="font-bold text-terminal-green mt-0.5">
                  ${report.recommendedStrategy.maxProfit} / -${report.recommendedStrategy.maxLoss}
                </div>
              </div>

              <div className="bg-black/40 p-2.5 rounded-lg border border-white/5">
                <div className="text-slate-500 text-[10px]">BREAK-EVEN</div>
                <div className="font-bold text-amber-300 mt-0.5">
                  {report.recommendedStrategy.breakEvenPoints.map(b => `$${b}`).join(', ')}
                </div>
              </div>

              <div className="bg-black/40 p-2.5 rounded-lg border border-white/5">
                <div className="text-slate-500 text-[10px]">WIN PROBABILITY</div>
                <div className="font-bold text-cyan-300 mt-0.5">
                  {report.recommendedStrategy.probabilityOfProfit}% PoP
                </div>
              </div>

              <div className="bg-black/40 p-2.5 rounded-lg border border-white/5">
                <div className="text-slate-500 text-[10px]">POSITION DELTA (Δ)</div>
                <div className="font-bold text-terminal-green mt-0.5">
                  +{report.recommendedStrategy.combinedGreeks.delta}
                </div>
              </div>
            </div>
          </div>

          {/* Evaluated Rulebook & Factor Validation Matrix */}
          <div className="bg-surface-200/90 border border-white/10 rounded-xl p-4">
            <h4 className="text-xs font-mono font-bold text-slate-300 mb-3 uppercase tracking-wider">
              Underlying Signals & Factor Verification Matrix
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono text-left">
                <thead>
                  <tr className="text-slate-500 border-b border-white/10 pb-2">
                    <th className="pb-2">CATEGORY</th>
                    <th className="pb-2">SIGNAL RULE</th>
                    <th className="pb-2">ACTUAL METRIC</th>
                    <th className="pb-2">STATUS</th>
                    <th className="pb-2">RATIONALE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {report.evaluatedRules.map((rule) => (
                    <tr key={rule.id} className="text-slate-200 hover:bg-white/5">
                      <td className="py-2.5 text-slate-400 font-bold text-[10px]">{rule.category}</td>
                      <td className="py-2.5 font-semibold text-white max-w-[180px]">{rule.name}</td>
                      <td className="py-2.5 text-cyan-300 font-bold">{rule.actualValue}</td>
                      <td className="py-2.5">
                        <span className="bg-emerald-950/80 text-terminal-green border border-emerald-500/40 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                          {rule.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-300 font-sans text-[11px] leading-relaxed max-w-[280px]">
                        {rule.rationale}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-surface-200/80 flex items-center justify-between">
          <div className="text-xs font-mono text-slate-400">
            5-Pillar Decision Framework • Black-Scholes Mathematical Engine • 100% Capped Risk
          </div>
          <button
            onClick={onClose}
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs px-5 py-2 rounded-lg transition-all shadow-glow-cyan"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
