'use client';

import React, { useState } from 'react';
import { OptionsStrategyStructure } from '@/lib/quant/optionsEngine';
import { 
  Zap, 
  ShieldCheck, 
  Flame, 
  TrendingUp, 
  Target, 
  Sliders, 
  HelpCircle, 
  ArrowRight,
  Sparkles,
  ChevronRight,
  DollarSign,
  Layers
} from 'lucide-react';

interface OptionsSignalsMatrixProps {
  signals: OptionsStrategyStructure[];
  activeSectorId: string;
  onSelectStrategyForPayoff: (strategy: OptionsStrategyStructure) => void;
  onSelectStock: (ticker: string) => void;
}

export const OptionsSignalsMatrix: React.FC<OptionsSignalsMatrixProps> = ({
  signals,
  activeSectorId,
  onSelectStrategyForPayoff,
  onSelectStock,
}) => {
  const [filterBias, setFilterBias] = useState<string>('ALL');

  const filteredSignals = signals.filter(sig => {
    if (filterBias === 'ALL') return true;
    if (filterBias === 'BULLISH') return sig.bias === 'BULLISH';
    if (filterBias === 'VOLATILITY') return sig.bias === 'VOLATILITY_EXPANSION' || sig.bias === 'VOLATILITY_CRUSH';
    if (filterBias === 'HIGH_POP') return sig.probabilityOfProfit >= 70;
    return true;
  });

  const getBiasBadge = (bias: string) => {
    switch (bias) {
      case 'BULLISH':
        return <span className="bg-emerald-950/80 text-terminal-green border border-emerald-500/40 text-[10px] font-mono px-2 py-0.5 rounded font-bold">BULLISH DIRECT</span>;
      case 'VOLATILITY_CRUSH':
        return <span className="bg-purple-950/80 text-purple-300 border border-purple-500/40 text-[10px] font-mono px-2 py-0.5 rounded font-bold">VOL CRUSH / THETA</span>;
      case 'VOLATILITY_EXPANSION':
        return <span className="bg-amber-950/80 text-amber-300 border border-amber-500/40 text-[10px] font-mono px-2 py-0.5 rounded font-bold">VOL EXPANSION</span>;
      default:
        return <span className="bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono px-2 py-0.5 rounded font-bold">NEUTRAL SPREAD</span>;
    }
  };

  return (
    <div className="bg-surface-200/60 border border-white/10 rounded-2xl p-5 shadow-xl">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
              <Zap className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-white tracking-wide font-mono">
              Quantitative Options Signals & Alpha Structures
            </h2>
            <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-mono px-2 py-0.5 rounded font-semibold border border-cyan-500/30">
              BLACK-SCHOLES CALIBRATED
            </span>
          </div>
          <p className="text-xs text-slate-400 font-sans mt-1">
            Greeks-weighted risk structures formulated around upcoming regulatory, earnings, and congressional catalysts.
          </p>
        </div>

        {/* Bias Filters */}
        <div className="flex items-center space-x-1.5 bg-black/40 p-1 rounded-xl border border-white/5 text-xs font-mono">
          {['ALL', 'BULLISH', 'VOLATILITY', 'HIGH_POP'].map((b) => (
            <button
              key={b}
              onClick={() => setFilterBias(b)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterBias === b
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {b.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Signals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5">
        {filteredSignals.map((signal) => {
          const isCredit = signal.netDebit < 0;
          return (
            <div
              key={signal.id}
              className="bg-surface-300/90 hover:bg-surface-100/90 border border-white/10 hover:border-cyan-500/50 rounded-xl p-4.5 transition-all group flex flex-col justify-between shadow-md hover:shadow-glow-cyan"
            >
              <div>
                {/* Card Title & Badges */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span 
                        onClick={() => onSelectStock(signal.ticker)}
                        className="font-mono font-bold text-lg text-white hover:text-cyan-300 cursor-pointer"
                      >
                        {signal.ticker}
                      </span>
                      <span className="text-slate-400 text-xs font-mono">
                        Spot: ${signal.underlyingPrice.toFixed(2)}
                      </span>
                      {getBiasBadge(signal.bias)}
                    </div>
                    <h3 className="font-semibold text-sm text-slate-100 font-mono mt-1 group-hover:text-cyan-200">
                      {signal.name}
                    </h3>
                  </div>

                  {/* Conviction Score Badge */}
                  <div className="flex flex-col items-end">
                    <div className="flex items-center space-x-1 bg-gradient-to-r from-emerald-950 to-cyan-950 border border-emerald-500/40 px-2 py-0.5 rounded text-xs font-mono font-bold text-terminal-green">
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      <span>{signal.convictionScore}% CONVICTION</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 mt-0.5">
                      PoP: {signal.probabilityOfProfit}%
                    </span>
                  </div>
                </div>

                {/* Quantitative Greeks Ribbon */}
                <div className="grid grid-cols-4 gap-2 mt-3.5 bg-black/40 p-2.5 rounded-lg border border-white/5 text-center text-xs font-mono">
                  <div>
                    <div className="text-slate-500 text-[10px]">DELTA (Δ)</div>
                    <div className={`font-bold ${signal.combinedGreeks.delta >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>
                      {signal.combinedGreeks.delta >= 0 ? '+' : ''}{signal.combinedGreeks.delta}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[10px]">GAMMA (Γ)</div>
                    <div className="font-bold text-cyan-300">
                      +{signal.combinedGreeks.gamma}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[10px]">THETA (Θ/day)</div>
                    <div className={`font-bold ${signal.combinedGreeks.theta >= 0 ? 'text-terminal-green' : 'text-slate-300'}`}>
                      ${signal.combinedGreeks.theta}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[10px]">VEGA (ν)</div>
                    <div className="font-bold text-purple-300">
                      ${signal.combinedGreeks.vega}
                    </div>
                  </div>
                </div>

                {/* Trade Parameters Grid */}
                <div className="grid grid-cols-3 gap-2.5 mt-3 text-xs font-mono">
                  <div className="bg-surface-200/80 p-2 rounded border border-white/5">
                    <div className="text-slate-500 text-[10px]">
                      {isCredit ? 'NET CREDIT' : 'NET DEBIT (COST)'}
                    </div>
                    <div className="font-bold text-slate-100">
                      ${Math.abs(signal.netDebit).toFixed(2)}/contract
                    </div>
                  </div>

                  <div className="bg-surface-200/80 p-2 rounded border border-white/5">
                    <div className="text-slate-500 text-[10px]">MAX PROFIT / LOSS</div>
                    <div className="font-bold text-slate-100">
                      {typeof signal.maxProfit === 'number' ? `$${signal.maxProfit}` : signal.maxProfit} / ${signal.maxLoss}
                    </div>
                  </div>

                  <div className="bg-surface-200/80 p-2 rounded border border-white/5">
                    <div className="text-slate-500 text-[10px]">BREAK-EVEN</div>
                    <div className="font-bold text-cyan-300">
                      {signal.breakEvenPoints.map(b => `$${b}`).join(' | ')}
                    </div>
                  </div>
                </div>

                {/* Risk-Reward & Target Exits */}
                <div className="flex items-center justify-between text-[11px] font-mono mt-3 px-1 text-slate-300">
                  <span className="text-slate-400">
                    R/R: <strong className="text-slate-200">{signal.riskRewardRatio}</strong>
                  </span>
                  <span className="text-emerald-400">
                    Target TP: <strong>${signal.targetTakeProfitPrice}</strong>
                  </span>
                  <span className="text-terminal-red">
                    Stop Loss: <strong>${signal.recommendedStopLossPrice}</strong>
                  </span>
                </div>

                {/* Strategic Rationale */}
                <div className="mt-3 bg-cyan-950/20 border-l-2 border-cyan-500 p-2 text-xs font-sans text-slate-300 rounded-r">
                  <span className="font-semibold text-cyan-400 font-mono text-[11px]">Catalyst Rationale: </span>
                  {signal.rationale}
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400 flex items-center space-x-1">
                  <Flame className="w-3 h-3 text-purple-400" />
                  <span>{signal.legs.length} Leg Structure</span>
                </span>

                <button
                  onClick={() => onSelectStrategyForPayoff(signal)}
                  className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 hover:border-cyan-500/80 px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center space-x-1.5 transition-all shadow-glow-cyan"
                >
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Interactive Payoff & Greeks Sandbox</span>
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-400 ml-0.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
