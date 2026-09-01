'use client';

import React, { useState } from 'react';
import { 
  X, 
  HelpCircle, 
  TrendingUp, 
  Flame, 
  Landmark, 
  Sparkles, 
  ShieldCheck, 
  BookOpen, 
  Zap, 
  Activity, 
  CheckCircle2, 
  Layers,
  Search,
  ArrowRight
} from 'lucide-react';

interface InteractiveFieldGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: '5_PILLARS' | 'OPTIONS_101' | 'GREEKS_PLAIN_ENGLISH' | 'DATA_SOURCES';
}

export const InteractiveFieldGuideModal: React.FC<InteractiveFieldGuideModalProps> = ({
  isOpen,
  onClose,
  initialTab = '5_PILLARS',
}) => {
  const [activeTab, setActiveTab] = useState<'5_PILLARS' | 'OPTIONS_101' | 'GREEKS_PLAIN_ENGLISH' | 'DATA_SOURCES'>(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-surface-300 border border-cyan-500/40 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl shadow-cyan-950/50 flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-start justify-between bg-surface-200/90 sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold font-mono text-white">
                  SigmaPulse Interactive Field Guide & Academy
                </h2>
                <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-mono px-2 py-0.5 rounded font-bold border border-cyan-500/30">
                  PLAIN ENGLISH
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Understand how our 5-Pillar Decision Engine evaluates stocks and recommends high-probability options trades.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-surface-100 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 px-5 pt-4 border-b border-white/5 bg-surface-200/40 overflow-x-auto text-xs font-mono">
          {[
            { id: '5_PILLARS', label: '1. The 5 Decision Pillars' },
            { id: 'OPTIONS_101', label: '2. Options Strategies 101' },
            { id: 'GREEKS_PLAIN_ENGLISH', label: '3. Greeks in Plain English' },
            { id: 'DATA_SOURCES', label: '4. Data & Real-Time Engine' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 px-3 border-b-2 font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* TAB 1: 5 PILLARS */}
          {activeTab === '5_PILLARS' && (
            <div className="space-y-4">
              <div className="bg-cyan-950/20 border border-cyan-500/30 p-4 rounded-xl">
                <h3 className="font-bold text-sm text-cyan-300 font-mono flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>How to Read the Sigma Score (0 to 100)</span>
                </h3>
                <p className="text-xs text-slate-200 font-sans mt-1.5 leading-relaxed">
                  Instead of staring at dozens of complex charts, our AI calculates a weighted score from 5 essential market pillars.
                  <strong> An overall score above 80 represents strong institutional conviction</strong>, with defined upside and strictly capped downside risk.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Pillar 1 */}
                <div className="bg-surface-200/90 border border-cyan-500/30 p-4 rounded-xl space-y-2">
                  <div className="flex items-center space-x-2 text-cyan-300 font-mono font-bold text-xs">
                    <TrendingUp className="w-4 h-4" />
                    <span>Pillar 1: Price Trend & Momentum</span>
                  </div>
                  <p className="text-xs text-slate-300 font-sans">
                    <strong>Layman Meaning:</strong> Is the stock moving up with real buyer strength?
                  </p>
                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                    We track moving averages and the 14-day RSI momentum indicator to ensure you are riding strong institutional buying pressure instead of fighting a downtrend.
                  </p>
                </div>

                {/* Pillar 2 */}
                <div className="bg-surface-200/90 border border-purple-500/30 p-4 rounded-xl space-y-2">
                  <div className="flex items-center space-x-2 text-purple-300 font-mono font-bold text-xs">
                    <Flame className="w-4 h-4" />
                    <span>Pillar 2: Volatility & Pricing Value (IVR)</span>
                  </div>
                  <p className="text-xs text-slate-300 font-sans">
                    <strong>Layman Meaning:</strong> Are options on sale, or are they expensive enough to sell for daily income?
                  </p>
                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                    <strong>Low IV Rank (&lt;35%):</strong> Options are cheap $\rightarrow$ Buy Outright Calls. <br />
                    <strong>High IV Rank (&gt;70%):</strong> Options are rich $\rightarrow$ Sell spread legs to harvest daily time decay.
                  </p>
                </div>

                {/* Pillar 3 */}
                <div className="bg-surface-200/90 border border-amber-500/30 p-4 rounded-xl space-y-2">
                  <div className="flex items-center space-x-2 text-amber-300 font-mono font-bold text-xs">
                    <Landmark className="w-4 h-4" />
                    <span>Pillar 3: Smart Money & Congressional Flow</span>
                  </div>
                  <p className="text-xs text-slate-300 font-sans">
                    <strong>Layman Meaning:</strong> Are politicians and corporate insiders buying?
                  </p>
                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                    We crawl real-time STOCK Act filings. When a member of the Armed Services or Intelligence committee buys call options, our engine flags high legislative conflict alpha.
                  </p>
                </div>

                {/* Pillar 4 */}
                <div className="bg-surface-200/90 border border-emerald-500/30 p-4 rounded-xl space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-300 font-mono font-bold text-xs">
                    <Sparkles className="w-4 h-4" />
                    <span>Pillar 4: Catalyst & Event Power</span>
                  </div>
                  <p className="text-xs text-slate-300 font-sans">
                    <strong>Layman Meaning:</strong> What upcoming news event will spark the price jump?
                  </p>
                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                    We cross-reference FDA approvals, semiconductor grants, or earnings releases against 10 years of history to calculate exact historical win rates (e.g. 84% 5-day win rate).
                  </p>
                </div>

                {/* Pillar 5 */}
                <div className="bg-surface-200/90 border border-blue-500/30 p-4 rounded-xl space-y-2 md:col-span-2">
                  <div className="flex items-center space-x-2 text-blue-300 font-mono font-bold text-xs">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Pillar 5: Downside Safety & Probability of Profit (PoP)</span>
                  </div>
                  <p className="text-xs text-slate-300 font-sans">
                    <strong>Layman Meaning:</strong> Is your capital protected if the overall market crashes?
                  </p>
                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                    Every trade recommended by SigmaPulse has a strictly defined maximum loss. You can never lose more than your initial net debit, and spreads provide built-in cushion.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: OPTIONS STRATEGIES 101 */}
          {activeTab === 'OPTIONS_101' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-surface-200/90 border border-white/10 p-4 rounded-xl space-y-2">
                  <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                    BULL CALL SPREAD (MOST POPULAR)
                  </span>
                  <h4 className="font-bold text-sm text-white font-mono">The Smart Money Vertical</h4>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    You buy a lower call (for upside) and simultaneously sell a higher call (to lower your cost).
                  </p>
                  <div className="bg-black/30 p-2.5 rounded text-[11px] font-mono text-slate-400">
                    💡 <strong>Why use it:</strong> Cuts your entry cost by ~40% and shields you from volatility drops.
                  </div>
                </div>

                <div className="bg-surface-200/90 border border-white/10 p-4 rounded-xl space-y-2">
                  <span className="bg-emerald-500/20 text-terminal-green text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                    LONG CALL OPTION
                  </span>
                  <h4 className="font-bold text-sm text-white font-mono">High-Momentum Convexity</h4>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    You buy the right to buy the stock at a fixed price. If the stock explodes higher, your gains are virtually unlimited.
                  </p>
                  <div className="bg-black/30 p-2.5 rounded text-[11px] font-mono text-slate-400">
                    💡 <strong>Why use it:</strong> Maximum leverage when IV is cheap and momentum is surging.
                  </div>
                </div>

                <div className="bg-surface-200/90 border border-purple-500/20 p-4 rounded-xl space-y-2">
                  <span className="bg-purple-500/20 text-purple-300 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                    IRON CONDOR
                  </span>
                  <h4 className="font-bold text-sm text-white font-mono">The Daily Rent Collector</h4>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    You create an upper and lower safety boundary. As long as the stock stays between the fences, you collect daily cash decay (theta).
                  </p>
                  <div className="bg-black/30 p-2.5 rounded text-[11px] font-mono text-slate-400">
                    💡 <strong>Why use it:</strong> Perfect for stocks consolidating after big earnings moves.
                  </div>
                </div>

                <div className="bg-surface-200/90 border border-amber-500/20 p-4 rounded-xl space-y-2">
                  <span className="bg-amber-500/20 text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                    LONG STRADDLE
                  </span>
                  <h4 className="font-bold text-sm text-white font-mono">Binary Event Trap</h4>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    You buy both a Call and a Put at the exact same strike. You win big if the stock jumps violently UP OR DOWN.
                  </p>
                  <div className="bg-black/30 p-2.5 rounded text-[11px] font-mono text-slate-400">
                    💡 <strong>Why use it:</strong> FDA trial decisions, Supreme Court rulings, or major earnings binary events.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GREEKS IN PLAIN ENGLISH */}
          {activeTab === 'GREEKS_PLAIN_ENGLISH' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-surface-200/90 border border-white/10 p-4 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-terminal-green font-bold">
                    <span>DELTA (Δ)</span>
                    <span>The Speedometer</span>
                  </div>
                  <p className="text-slate-300 font-sans text-xs">
                    Tells you how many dollars your option will make for every $1.00 move in the stock.
                  </p>
                  <div className="text-[11px] text-slate-400 bg-black/30 p-2 rounded">
                    Example: Delta 0.65 means if the stock rises $1.00, your contract gains +$65.
                  </div>
                </div>

                <div className="bg-surface-200/90 border border-white/10 p-4 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-cyan-300 font-bold">
                    <span>GAMMA (Γ)</span>
                    <span>The Gas Pedal</span>
                  </div>
                  <p className="text-slate-300 font-sans text-xs">
                    Tells you how fast your Delta grows. As the stock keeps rising, Gamma accelerates your profits.
                  </p>
                  <div className="text-[11px] text-slate-400 bg-black/30 p-2 rounded">
                    High Gamma = Explosive percentage returns on big moves.
                  </div>
                </div>

                <div className="bg-surface-200/90 border border-white/10 p-4 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-amber-300 font-bold">
                    <span>THETA (Θ)</span>
                    <span>The Time Clock</span>
                  </div>
                  <p className="text-slate-300 font-sans text-xs">
                    Options lose a little value every day they get closer to expiration.
                  </p>
                  <div className="text-[11px] text-slate-400 bg-black/30 p-2 rounded">
                    When we sell spreads or Iron Condors, Theta works FOR you as daily income!
                  </div>
                </div>

                <div className="bg-surface-200/90 border border-white/10 p-4 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-purple-300 font-bold">
                    <span>VEGA (ν)</span>
                    <span>The Volatility Meter</span>
                  </div>
                  <p className="text-slate-300 font-sans text-xs">
                    Measures how much your option value changes when market excitement / volatility rises or falls.
                  </p>
                  <div className="text-[11px] text-slate-400 bg-black/30 p-2 rounded">
                    We ensure you don't overpay for options right before volatility collapses.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DATA SOURCES */}
          {activeTab === 'DATA_SOURCES' && (
            <div className="space-y-4">
              <div className="bg-surface-200/90 border border-white/10 p-4 rounded-xl space-y-3">
                <h4 className="font-bold text-sm text-cyan-300 font-mono">Real-Time Ingestion Architecture</h4>
                <div className="space-y-2.5 text-xs font-sans text-slate-300 leading-relaxed">
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white font-mono">SEC EDGAR Disclosures & STOCK Act:</strong> Crawled continuously for House and Senate financial transactions and corporate 8-K filings.
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white font-mono">FDA Regulatory Wires:</strong> Synchronized with PDUFA calendars and Advisory Committee votes.
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white font-mono">Black-Scholes Mathematical Engine:</strong> Instant analytical pricing and Greeks solver computed directly on the fly.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-surface-200/80 flex items-center justify-between">
          <span className="text-xs font-mono text-slate-400">
            SigmaPulse Academy • Wall Street Quant Strategies for Everyday Traders
          </span>
          <button
            onClick={onClose}
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs px-5 py-2 rounded-lg transition-all shadow-glow-cyan"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
