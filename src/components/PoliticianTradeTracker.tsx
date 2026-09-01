'use client';

import { SampleDataBanner } from './ProvenanceBadge';
import React from 'react';
import { POLITICIAN_TRADES, PoliticianTradeEntry } from '@/lib/data/politicianTracker';
import { 
  Landmark, 
  ShieldAlert, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Zap, 
  ExternalLink, 
  Sparkles,
  ArrowUpRight,
  Flame
} from 'lucide-react';

interface PoliticianTradeTrackerProps {
  onSelectStock: (ticker: string) => void;
  onOpenOptionsForTicker: (ticker: string) => void;
}

export const PoliticianTradeTracker: React.FC<PoliticianTradeTrackerProps> = ({
  onSelectStock,
  onOpenOptionsForTicker,
}) => {
  return (
    <div className="bg-surface-200/60 border border-white/10 rounded-2xl p-5 shadow-xl">
      <div className="mb-4">
        <SampleDataBanner>
          <strong>Sample disclosures, not real STOCK Act filings.</strong> Names, amounts,
          filing dates and conflict scores below are placeholders for layout. No real
          individual is described. Actual House and Senate disclosures are public and free —
          this panel becomes meaningful only once that ingest is connected.
        </SampleDataBanner>
      </div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-white tracking-wide font-mono">
                Congressional STOCK Act Insider Flow & Policy Radar
              </h2>
              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded font-semibold border border-amber-500/30">
                CAPITOL DISCLOSURES
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans">
              Monitoring high-conviction trades by House & Senate committee members with legislative conflict correlation.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
          <span className="bg-black/40 px-3 py-1 rounded-lg border border-white/5">
            Avg Filing Lag: <strong className="text-amber-400">19 Days</strong>
          </span>
          <span className="bg-black/40 px-3 py-1 rounded-lg border border-white/5">
            Win Rate: <strong className="text-terminal-green">81.2%</strong>
          </span>
        </div>
      </div>

      {/* Trades Grid */}
      <div className="grid grid-cols-1 gap-4 mt-5">
        {POLITICIAN_TRADES.map((trade) => {
          const isCallOption = trade.transactionType.includes('OPTION');
          return (
            <div
              key={trade.id}
              className="bg-surface-300/80 hover:bg-surface-100/90 border border-white/10 hover:border-amber-500/50 rounded-xl p-4.5 transition-all group shadow-md"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Politician & Committee Meta */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-white font-mono">
                      {trade.politician}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      trade.party === 'DEMOCRAT' 
                        ? 'bg-blue-950/80 text-blue-300 border border-blue-600/40' 
                        : 'bg-red-950/80 text-red-300 border border-red-600/40'
                    }`}>
                      {trade.chamber} • {trade.party === 'DEMOCRAT' ? 'DEM' : 'REP'} ({trade.state})
                    </span>

                    {isCallOption && (
                      <span className="bg-purple-950/80 text-purple-300 border border-purple-500/40 text-[10px] font-mono px-2 py-0.5 rounded font-bold flex items-center space-x-1">
                        <Flame className="w-3 h-3 text-purple-400" />
                        <span>LEAPS OPTION BUY</span>
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-400 font-mono">
                    Committee: <span className="text-slate-200">{trade.committee}</span>
                  </div>

                  {/* Conflict Notice */}
                  <div className="bg-amber-950/20 border border-amber-500/20 p-2 rounded text-[11px] font-sans text-amber-200/90 flex items-start space-x-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-amber-400 font-mono">Legislative Conflict Index ({trade.conflictScore}/100): </strong>
                      {trade.notableCommitteeConflict}
                    </div>
                  </div>
                </div>

                {/* Ticker, Value & Performance */}
                <div className="flex flex-wrap lg:flex-col items-center lg:items-end justify-between gap-3 font-mono text-xs">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => onSelectStock(trade.ticker)}
                      className="bg-black/50 hover:bg-cyan-950/80 border border-white/10 hover:border-cyan-500/40 px-3 py-1.5 rounded-lg text-sm font-bold text-white transition-all flex items-center space-x-1.5"
                    >
                      <span className="text-cyan-300">${trade.ticker}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    <div className="text-right">
                      <div className="text-slate-400 text-[10px]">EST. VALUE</div>
                      <div className="font-bold text-slate-100">{trade.amountRange}</div>
                    </div>
                  </div>

                  {/* Return Since Filing */}
                  <div className="flex items-center space-x-2 bg-black/40 px-2.5 py-1 rounded border border-white/5">
                    <span className="text-slate-400 text-[10px]">Purchase: ${trade.priceAtPurchase}</span>
                    <span className="text-slate-500">→</span>
                    <span className="text-terminal-green font-bold text-xs flex items-center">
                      <TrendingUp className="w-3 h-3 mr-0.5 inline" />
                      +{trade.unrealizedReturnPercent.toFixed(1)}% Alpha
                    </span>
                  </div>

                  {/* Follow Flow with Options Button */}
                  <button
                    onClick={() => onOpenOptionsForTicker(trade.ticker)}
                    className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-glow-amber"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Copy Flow: {trade.recommendedOptionFollow}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
