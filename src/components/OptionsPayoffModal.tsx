'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { OptionsStrategyStructure, generatePayoffCurve, aggregateGreeks, OptionLeg } from '@/lib/quant/optionsEngine';
import { calculateBlackScholes } from '@/lib/quant/blackScholes';
import { 
  X, 
  Sliders, 
  TrendingUp, 
  Flame, 
  ShieldCheck, 
  HelpCircle, 
  RefreshCw,
  Zap,
  Target,
  DollarSign
} from 'lucide-react';

interface OptionsPayoffModalProps {
  strategy: OptionsStrategyStructure | null;
  onClose: () => void;
}

export const OptionsPayoffModal: React.FC<OptionsPayoffModalProps> = ({
  strategy,
  onClose,
}) => {
  if (!strategy) return null;

  // Simulation controls state
  const [simSpot, setSimSpot] = useState<number>(strategy.underlyingPrice);
  const [simDte, setSimDte] = useState<number>(strategy.legs[0]?.expirationDays || 30);
  const [simIvMultiplier, setSimIvMultiplier] = useState<number>(1.0); // 1.0 = 100%

  // Reset when strategy changes
  useEffect(() => {
    setSimSpot(strategy.underlyingPrice);
    setSimDte(strategy.legs[0]?.expirationDays || 30);
    setSimIvMultiplier(1.0);
  }, [strategy]);

  // Recalculate dynamic legs & payoff curve based on user simulation sliders
  const dynamicLegs: OptionLeg[] = useMemo(() => {
    return strategy.legs.map((leg) => {
      const adjustedIv = leg.iv * simIvMultiplier;
      const tYears = simDte / 365;
      const bs = calculateBlackScholes(leg.type, simSpot, leg.strike, tYears, 0.045, adjustedIv);
      return {
        ...leg,
        iv: adjustedIv,
        greeks: bs.greeks,
      };
    });
  }, [strategy, simSpot, simDte, simIvMultiplier]);

  const dynamicGreeks = useMemo(() => aggregateGreeks(dynamicLegs), [dynamicLegs]);

  const payoffPoints = useMemo(() => {
    return generatePayoffCurve(strategy.underlyingPrice, dynamicLegs, strategy.netDebit);
  }, [strategy, dynamicLegs]);

  // Canvas drawing dimensions
  const canvasWidth = 720;
  const canvasHeight = 280;
  const padding = { top: 20, right: 30, bottom: 40, left: 60 };

  const minPrice = payoffPoints[0]?.price || 0;
  const maxPrice = payoffPoints[payoffPoints.length - 1]?.price || 100;
  
  const allPnls = payoffPoints.map(p => p.pnlAtExpiry).concat(payoffPoints.map(p => p.pnlCurrent));
  const minPnl = Math.min(...allPnls, -100);
  const maxPnl = Math.max(...allPnls, 100);
  const pnlRange = maxPnl - minPnl || 1;

  const getX = (price: number) => {
    return padding.left + ((price - minPrice) / (maxPrice - minPrice)) * (canvasWidth - padding.left - padding.right);
  };

  const getY = (pnl: number) => {
    return canvasHeight - padding.bottom - ((pnl - minPnl) / pnlRange) * (canvasHeight - padding.top - padding.bottom);
  };

  const zeroY = getY(0);

  // Expiration path
  const expiryPointsSvg = payoffPoints.map((p) => `${getX(p.price)},${getY(p.pnlAtExpiry)}`).join(' ');
  // Current T path
  const currentPointsSvg = payoffPoints.map((p) => `${getX(p.price)},${getY(p.pnlCurrent)}`).join(' ');

  // SVG Area polygon for Expiration (Split profit vs loss)
  const zeroLineSvg = `${getX(maxPrice)},${zeroY} ${getX(minPrice)},${zeroY}`;
  const fillAreaSvg = `${expiryPointsSvg} ${zeroLineSvg}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-surface-300 border border-cyan-500/40 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl shadow-cyan-950/50 flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-white/10 flex items-start justify-between bg-surface-200/80 sticky top-0 z-10">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-cyan-500/20 text-cyan-400 font-mono text-xs px-2 py-0.5 rounded font-bold border border-cyan-500/40">
                {strategy.type.replace('_', ' ')}
              </span>
              <h2 className="text-xl font-bold font-mono text-white">
                {strategy.name}
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-1">
              Real-time Black-Scholes $P\&L$ simulation sandbox with live Greeks decay modeling.
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
          {/* Interactive Payoff Chart Graphic */}
          <div className="bg-black/60 border border-white/10 rounded-xl p-4 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2 text-xs font-mono text-slate-400">
              <div className="flex items-center space-x-4">
                <span className="flex items-center space-x-1.5">
                  <span className="w-3 h-0.5 bg-emerald-400 inline-block" />
                  <span className="text-emerald-400 font-semibold">P&L at Expiration (T=0)</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-3 h-0.5 border-t border-dashed border-cyan-400 inline-block" />
                  <span className="text-cyan-300">Simulated Date P&L (T={simDte}d)</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                  <span className="text-amber-400">Break-Even ({strategy.breakEvenPoints.map(b => `$${b}`).join(', ')})</span>
                </span>
              </div>
              <span className="text-slate-500">Spot: ${strategy.underlyingPrice.toFixed(2)}</span>
            </div>

            {/* SVG Payoff Curve Canvas */}
            <div className="w-full overflow-x-auto">
              <svg viewBox={`0 0 ${canvasWidth} ${canvasHeight}`} className="w-full h-auto select-none">
                <defs>
                  <linearGradient id="profitGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#00FF66" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#00FF66" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="lossGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FF3366" stopOpacity="0.0" />
                    <stop offset="100%" stopColor="#FF3366" stopOpacity="0.25" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line
                  x1={padding.left}
                  y1={zeroY}
                  x2={canvasWidth - padding.right}
                  y2={zeroY}
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth="1.5"
                />

                {/* Spot Price Line */}
                <line
                  x1={getX(strategy.underlyingPrice)}
                  y1={padding.top}
                  x2={getX(strategy.underlyingPrice)}
                  y2={canvasHeight - padding.bottom}
                  stroke="#ffffff"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <text
                  x={getX(strategy.underlyingPrice)}
                  y={padding.top + 10}
                  fill="#ffffff"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  Spot ${strategy.underlyingPrice}
                </text>

                {/* Break Even Markers */}
                {strategy.breakEvenPoints.map((be, idx) => (
                  <g key={`be-${idx}`}>
                    <line
                      x1={getX(be)}
                      y1={padding.top}
                      x2={getX(be)}
                      y2={canvasHeight - padding.bottom}
                      stroke="#FFB000"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={getX(be)}
                      y={canvasHeight - padding.bottom + 15}
                      fill="#FFB000"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      BE ${be}
                    </text>
                  </g>
                ))}

                {/* Expiration PnL Line */}
                <polyline
                  fill="none"
                  stroke="#00FF66"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={expiryPointsSvg}
                />

                {/* Current / Simulated Date PnL Line */}
                <polyline
                  fill="none"
                  stroke="#00F0FF"
                  strokeWidth="2"
                  strokeDasharray="5 5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={currentPointsSvg}
                />

                {/* Y-Axis Label */}
                <text
                  x={padding.left - 10}
                  y={zeroY + 4}
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  $0
                </text>
                <text
                  x={padding.left - 10}
                  y={padding.top + 12}
                  fill="#00FF66"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  +${maxPnl.toFixed(0)}
                </text>
                <text
                  x={padding.left - 10}
                  y={canvasHeight - padding.bottom - 4}
                  fill="#FF3366"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  -${Math.abs(minPnl).toFixed(0)}
                </text>
              </svg>
            </div>
          </div>

          {/* Interactive Simulation Sliders */}
          <div className="bg-surface-200/90 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-cyan-300">
                <Sliders className="w-4 h-4" />
                <span>REAL-TIME SCENARIO & GREEKS STRESS TESTER</span>
              </div>
              <button
                onClick={() => {
                  setSimSpot(strategy.underlyingPrice);
                  setSimDte(strategy.legs[0]?.expirationDays || 30);
                  setSimIvMultiplier(1.0);
                }}
                className="text-[11px] font-mono text-slate-400 hover:text-white flex items-center space-x-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset Parameters</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              {/* Underlying Spot Slider */}
              <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Underlying Price</span>
                  <strong className="text-white">${simSpot.toFixed(2)}</strong>
                </div>
                <input
                  type="range"
                  min={strategy.underlyingPrice * 0.8}
                  max={strategy.underlyingPrice * 1.2}
                  step={0.25}
                  value={simSpot}
                  onChange={(e) => setSimSpot(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Days to Expiration Slider */}
              <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Days to Expiration</span>
                  <strong className="text-amber-400">{simDte} DTE</strong>
                </div>
                <input
                  type="range"
                  min={0}
                  max={strategy.legs[0]?.expirationDays || 60}
                  step={1}
                  value={simDte}
                  onChange={(e) => setSimDte(parseInt(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              {/* Implied Volatility Slider */}
              <div className="bg-black/30 p-3 rounded-lg border border-white/5">
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>IV Skew / Crush</span>
                  <strong className="text-purple-300">{(simIvMultiplier * 100).toFixed(0)}%</strong>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={1.8}
                  step={0.05}
                  value={simIvMultiplier}
                  onChange={(e) => setSimIvMultiplier(parseFloat(e.target.value))}
                  className="w-full accent-purple-400 cursor-pointer"
                />
              </div>
            </div>

            {/* Recalculated Dynamic Greeks Banner */}
            <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-white/5 text-center font-mono text-xs">
              <div className="bg-surface-300/60 p-2 rounded">
                <span className="text-slate-500 text-[10px]">CURRENT DELTA (Δ)</span>
                <div className={`font-bold ${dynamicGreeks.delta >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>
                  {dynamicGreeks.delta >= 0 ? '+' : ''}{dynamicGreeks.delta}
                </div>
              </div>
              <div className="bg-surface-300/60 p-2 rounded">
                <span className="text-slate-500 text-[10px]">CURRENT GAMMA (Γ)</span>
                <div className="font-bold text-cyan-300">+{dynamicGreeks.gamma}</div>
              </div>
              <div className="bg-surface-300/60 p-2 rounded">
                <span className="text-slate-500 text-[10px]">THETA DECAY (Θ/day)</span>
                <div className={`font-bold ${dynamicGreeks.theta >= 0 ? 'text-terminal-green' : 'text-slate-200'}`}>
                  ${dynamicGreeks.theta}
                </div>
              </div>
              <div className="bg-surface-300/60 p-2 rounded">
                <span className="text-slate-500 text-[10px]">VEGA EXPOSURE (ν)</span>
                <div className="font-bold text-purple-300">${dynamicGreeks.vega}</div>
              </div>
            </div>
          </div>

          {/* Strategy Legs Table */}
          <div className="bg-surface-200/90 border border-white/10 rounded-xl p-4">
            <h4 className="text-xs font-mono font-bold text-slate-300 mb-3 uppercase tracking-wider">
              Leg Construction & Execution Details
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono text-left">
                <thead>
                  <tr className="text-slate-500 border-b border-white/10 pb-2">
                    <th className="pb-2">ACTION</th>
                    <th className="pb-2">TYPE</th>
                    <th className="pb-2">STRIKE</th>
                    <th className="pb-2">EXPIRATION</th>
                    <th className="pb-2">PREMIUM</th>
                    <th className="pb-2">IV</th>
                    <th className="pb-2 text-right">DELTA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {strategy.legs.map((leg) => (
                    <tr key={leg.id} className="text-slate-200 hover:bg-white/5">
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          leg.action === 'buy' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-red-950 text-red-300 border border-red-800'
                        }`}>
                          {leg.action.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 font-bold uppercase">{leg.type}</td>
                      <td className="py-2.5 font-bold text-cyan-300">${leg.strike.toFixed(2)}</td>
                      <td className="py-2.5">{leg.expirationDays} Days</td>
                      <td className="py-2.5">${leg.premium.toFixed(2)}</td>
                      <td className="py-2.5">{(leg.iv * 100).toFixed(0)}%</td>
                      <td className="py-2.5 text-right font-bold">{leg.greeks.delta}</td>
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
            Probability of Profit: <strong className="text-terminal-green">{strategy.probabilityOfProfit === null ? 'n/a' : `${strategy.probabilityOfProfit}%`}</strong> • Max Risk: <strong className="text-terminal-red">${strategy.maxLoss}</strong>
          </div>
          <button
            onClick={onClose}
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs px-5 py-2 rounded-lg transition-all shadow-glow-cyan"
          >
            Close Sandbox
          </button>
        </div>
      </div>
    </div>
  );
};
