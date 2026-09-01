'use client';

import React from 'react';
import { QuantitativeSignalReport, EvaluatedRule } from '@/lib/quant/rulesEngine';
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
  Landmark
} from 'lucide-react';

interface TickerAnalysisModalProps {
  report: QuantitativeSignalReport | null;
  onClose: () => void;
  onOpenPayoffModal: (strategy: OptionsStrategyStructure) => void;
  onOpenBacktest: () => void;
}

export const TickerAnalysisModal: React.FC<TickerAnalysisModalProps> = ({
  report,
  onClose,
  onOpenPayoffModal,
  onOpenBacktest,
}) => {
  if (!report) return null;

  const getVerdictBadge = (verdict: string) => {
    switch (verdict) {
      case 'STRONG_BUY_ALPHA':
        return (
          <span className="bg-emerald-950/90 text-terminal-green border border-emerald-500/50 px-3 py-1 rounded-lg text-xs font-mono font-extrabold flex items-center space-x-1.5 shadow-glow-green">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>STRONG BUY ALPHA (OUTRIGHT CONVEXITY)</span>
          </span>
        );
      case 'BULL_CALL_SPREAD':
        return (
          <span className="bg-cyan-950/90 text-cyan-300 border border-cyan-500/50 px-3 py-1 rounded-lg text-xs font-mono font-extrabold flex items-center space-x-1.5 shadow-glow-cyan">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            <span>BULL CALL VERTICAL (DEFINED RISK ALPHA)</span>
          </span>
        );
      case 'VOLATILITY_HARVEST':
        return (
          <span className="bg-purple-950/90 text-purple-300 border border-purple-500/50 px-3 py-1 rounded-lg text-xs font-mono font-extrabold flex items-center space-x-1.5 shadow-glow-purple">
            <Flame className="w-3.5 h-3.5 text-purple-400" />
            <span>VOLATILITY CRUSH / THETA HARVEST (IRON CONDOR)</span>
          </span>
        );
      case 'LONG_STRADDLE_EXPANSION':
        return (
          <span className="bg-amber-950/90 text-amber-300 border border-amber-500/50 px-3 py-1 rounded-lg text-xs font-mono font-extrabold flex items-center space-x-1.5 shadow-glow-amber">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>LONG STRADDLE (BINARY VARIANCE EXPANSION)</span>
          </span>
        );
      default:
        return (
          <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-lg text-xs font-mono font-bold">
            WAIT FOR RANGEBOUND CONFIRMATION
          </span>
        );
    }
  };

  const getRuleStatusBadge = (status: EvaluatedRule['status']) => {
    switch (status) {
      case 'BULLISH_PASS':
        return (
          <span className="bg-emerald-950/80 text-terminal-green border border-emerald-500/40 text-[10px] font-mono px-2 py-0.5 rounded font-bold flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>BULLISH PASS</span>
          </span>
        );
      case 'NEUTRAL_PASS':
        return (
          <span className="bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono px-2 py-0.5 rounded font-bold flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3 text-cyan-400" />
            <span>NEUTRAL PASS</span>
          </span>
        );
      case 'WARNING':
        return (
          <span className="bg-amber-950/80 text-amber-300 border border-amber-500/40 text-[10px] font-mono px-2 py-0.5 rounded font-bold flex items-center space-x-1">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>WARNING</span>
          </span>
        );
      default:
        return (
          <span className="bg-red-950/80 text-terminal-red border border-red-500/40 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
            FAIL
          </span>
        );
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
                <span className="text-xs font-mono text-slate-400">
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
            {/* Composite Score Circle */}
            <div className="flex flex-col items-end">
              <div className="flex items-center space-x-1.5 bg-gradient-to-r from-cyan-950 to-emerald-950 border border-cyan-500/50 px-3 py-1 rounded-lg text-xs font-mono font-bold text-terminal-green shadow-glow-green">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>{report.compositeScore}/100 SCORE</span>
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
          {/* Main Verdict Dossier Banner */}
          <div className="bg-gradient-to-r from-surface-200 via-cyan-950/20 to-surface-200 border border-cyan-500/30 p-4.5 rounded-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono text-slate-400 font-semibold uppercase">
                  Institutional Rule Verdict:
                </span>
                {getVerdictBadge(report.verdict)}
              </div>
              <span className="text-xs font-mono text-cyan-300 font-bold">
                {report.rulesPassedCount} of {report.totalRulesEvaluated} Quantitative Rules Satisfied
              </span>
            </div>
            <p className="text-xs text-slate-200 font-sans leading-relaxed">
              {report.verdictDescription}
            </p>
          </div>

          {/* Congressional Insider Alert (if detected) */}
          {report.insiderActivityNotice && (
            <div className="bg-amber-950/30 border border-amber-500/40 p-3.5 rounded-xl flex items-center space-x-3 text-xs font-mono text-amber-200">
              <Landmark className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <strong className="text-amber-300 uppercase">Congressional STOCK Act Alert: </strong>
                {report.insiderActivityNotice}
              </div>
            </div>
          )}

          {/* 4 Factor Pillar Score Meters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
            <div className="bg-surface-200/90 border border-white/10 p-3 rounded-xl">
              <div className="text-slate-400 text-[10px]">TREND MOMENTUM</div>
              <div className="text-lg font-bold text-cyan-300 mt-1">{report.factorScores.trendScore}%</div>
              <div className="w-full bg-black/40 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${report.factorScores.trendScore}%` }} />
              </div>
            </div>

            <div className="bg-surface-200/90 border border-white/10 p-3 rounded-xl">
              <div className="text-slate-400 text-[10px]">IV RANK ENVIRONMENT</div>
              <div className="text-lg font-bold text-purple-300 mt-1">{report.factorScores.volatilityScore}%</div>
              <div className="w-full bg-black/40 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-purple-400 h-full rounded-full" style={{ width: `${report.factorScores.volatilityScore}%` }} />
              </div>
            </div>

            <div className="bg-surface-200/90 border border-white/10 p-3 rounded-xl">
              <div className="text-slate-400 text-[10px]">MOMENTUM VELOCITY</div>
              <div className="text-lg font-bold text-terminal-green mt-1">{report.factorScores.momentumScore}%</div>
              <div className="w-full bg-black/40 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-terminal-green h-full rounded-full" style={{ width: `${report.factorScores.momentumScore}%` }} />
              </div>
            </div>

            <div className="bg-surface-200/90 border border-white/10 p-3 rounded-xl">
              <div className="text-slate-400 text-[10px]">CATALYST WIN RATE</div>
              <div className="text-lg font-bold text-amber-300 mt-1">{report.factorScores.catalystScore}%</div>
              <div className="w-full bg-black/40 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-amber-400 h-full rounded-full" style={{ width: `${report.factorScores.catalystScore}%` }} />
              </div>
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
                  <span>Launch Payoff Sandbox</span>
                </button>

                <button
                  onClick={onOpenBacktest}
                  className="bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-600/40 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center space-x-1.5 transition-all"
                >
                  <Activity className="w-3.5 h-3.5 text-purple-400" />
                  <span>Backtest Event</span>
                </button>
              </div>
            </div>

            {/* Greeks & Risk Parameters */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4 text-xs font-mono">
              <div className="bg-black/40 p-2.5 rounded-lg border border-white/5">
                <div className="text-slate-500 text-[10px]">NET DEBIT / COST</div>
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
                <div className="text-slate-500 text-[10px]">PROB. OF PROFIT</div>
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

          {/* Evaluated Rules Matrix Table */}
          <div className="bg-surface-200/90 border border-white/10 rounded-xl p-4">
            <h4 className="text-xs font-mono font-bold text-slate-300 mb-3 uppercase tracking-wider">
              Evaluated Rulebook & Factor Validation Matrix
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono text-left">
                <thead>
                  <tr className="text-slate-500 border-b border-white/10 pb-2">
                    <th className="pb-2">CATEGORY</th>
                    <th className="pb-2">RULE NAME</th>
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
                      <td className="py-2.5">{getRuleStatusBadge(rule.status)}</td>
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
            Black-Scholes-Merton Options Engine • Historical Precedent Replay • Quantitative Factor Validation
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
