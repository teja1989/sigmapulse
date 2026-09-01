'use client';

import React from 'react';
import { StockAsset } from '@/lib/data/sectors';
import { analyzeTickerSignals } from '@/lib/quant/rulesEngine';
import { useWatchlist } from '@/context/WatchlistContext';

interface InstitutionalTableViewProps {
  stocks: StockAsset[];
  onSelectStock: (ticker: string) => void;
  onOpenOptions: (ticker: string) => void;
}

export const InstitutionalTableView: React.FC<InstitutionalTableViewProps> = ({
  stocks,
  onSelectStock,
  onOpenOptions,
}) => {
  const { isWatchlisted, toggleWatchlist } = useWatchlist();

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-white/10 bg-surface-200 shadow-card">
      <table className="w-full text-left text-xs font-mono border-collapse">
        <thead>
          <tr className="bg-surface-300 border-b border-white/10 text-slate-400 uppercase tracking-wider text-[11px]">
            <th className="py-3 px-3 w-8 text-center">★</th>
            <th className="py-3 px-4 font-bold">Asset / Ticker</th>
            <th className="py-3 px-4 text-right">Spot Price ($S)</th>
            <th className="py-3 px-4 text-right">24h Change</th>
            <th className="py-3 px-4 text-center">Trend (30D)</th>
            <th className="py-3 px-4 text-center">5-Pillar Score</th>
            <th className="py-3 px-4 text-center">Verdict</th>
            <th className="py-3 px-4">Optimal Contract</th>
            <th className="py-3 px-4 text-right">Contract Cost</th>
            <th className="py-3 px-4 text-right">IV Rank</th>
            <th className="py-3 px-4 text-center">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {stocks.map((stock) => {
            const isPos = stock.change >= 0;
            const starred = isWatchlisted(stock.ticker);
            const report = analyzeTickerSignals(stock);
            const score = report.compositeScore;

            // Score badge color
            const scoreColor =
              score >= 70
                ? 'text-emerald-400 bg-emerald-950/80 border-emerald-700/60'
                : score >= 45
                ? 'text-amber-400 bg-amber-950/80 border-amber-700/60'
                : 'text-rose-400 bg-rose-950/80 border-rose-700/60';

            const verdictColor =
              report.verdictTitle.includes('BUY') || report.verdictTitle.includes('CALL')
                ? 'text-emerald-400 bg-emerald-950/80 border-emerald-600/60'
                : report.verdictTitle.includes('HOLD') || report.verdictTitle.includes('NEUTRAL')
                ? 'text-amber-400 bg-amber-950/80 border-amber-600/60'
                : 'text-rose-400 bg-rose-950/80 border-rose-600/60';

            const premium = Math.abs(report.recommendedStrategy.netDebit);
            const contractCost = Math.round(premium * 100);

            // Mini sparkline points
            const minSpark = Math.min(...stock.sparkline);
            const maxSpark = Math.max(...stock.sparkline);
            const sparkRange = maxSpark - minSpark || 1;
            const sparkPoints = stock.sparkline
              .map((val, idx) => {
                const x = (idx / (stock.sparkline.length - 1)) * 70;
                const y = 20 - ((val - minSpark) / sparkRange) * 16;
                return `${x},${y}`;
              })
              .join(' ');

            return (
              <tr
                key={stock.ticker}
                onClick={() => onSelectStock(stock.ticker)}
                className="hover:bg-surface-100/70 cursor-pointer transition-colors"
              >
                {/* Star Pin */}
                <td
                  className="py-3 px-3 text-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWatchlist(stock.ticker);
                  }}
                >
                  <button
                    className={`text-sm transition-transform active:scale-125 ${
                      starred ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'
                    }`}
                  >
                    {starred ? '★' : '☆'}
                  </button>
                </td>

                {/* Ticker & Name */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100 text-sm tracking-wide">${stock.ticker}</span>
                    <span className="text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-surface-300 border border-white/5">
                      {stock.sectorId.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate max-w-[140px]">{stock.name}</div>
                </td>

                {/* Spot Stock Price */}
                <td className="py-3 px-4 text-right tabular-nums font-bold text-slate-100 text-sm">
                  ${stock.price.toFixed(2)}
                </td>

                {/* 24h Change */}
                <td className="py-3 px-4 text-right tabular-nums font-semibold">
                  <span
                    className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-bold ${
                      isPos ? 'text-emerald-400 bg-emerald-950/60' : 'text-rose-400 bg-rose-950/60'
                    }`}
                  >
                    {isPos ? '+' : ''}
                    {stock.changePercent.toFixed(2)}%
                  </span>
                </td>

                {/* SVG Sparkline */}
                <td className="py-3 px-4 text-center w-24">
                  <div className="w-20 mx-auto h-6 flex items-center justify-center">
                    <svg viewBox="0 0 70 24" className="w-full h-full overflow-visible">
                      <polyline
                        fill="none"
                        stroke={isPos ? '#10b981' : '#ef4444'}
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={sparkPoints}
                      />
                    </svg>
                  </div>
                </td>

                {/* 5-Pillar Score */}
                <td className="py-3 px-4 text-center">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded border font-bold tabular-nums text-xs ${scoreColor}`}>
                    {score}
                    <span className="text-[9px] text-slate-400 ml-0.5">/100</span>
                  </span>
                </td>

                {/* Recommendation Verdict */}
                <td className="py-3 px-4 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded border text-[11px] font-bold ${verdictColor}`}>
                    {report.verdictTitle}
                  </span>
                </td>

                {/* Option Strategy & Strike */}
                <td className="py-3 px-4">
                  <div className="text-slate-200 font-semibold">{report.recommendedStrategy.name}</div>
                  <div className="text-[11px] text-slate-400">
                    ${report.recommendedStrategy.legs[0]?.strike.toFixed(2) || stock.price.toFixed(2)} Strike · {report.recommendedStrategy.legs[0]?.expirationDays || 30}D
                  </div>
                </td>

                {/* Total Cash Cost */}
                <td className="py-3 px-4 text-right tabular-nums font-bold text-slate-100">
                  ${contractCost}
                  <div className="text-[10px] text-slate-400 font-normal">(${premium.toFixed(2)}/sh)</div>
                </td>

                {/* IV Rank */}
                <td className="py-3 px-4 text-right tabular-nums text-slate-300 font-semibold">
                  {stock.ivRank}%
                </td>

                {/* 1-Click Audit Button */}
                <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onSelectStock(stock.ticker)}
                    className="px-2.5 py-1 rounded bg-institutional-blue/20 hover:bg-institutional-blue/30 text-sky-400 border border-institutional-blue/40 text-[11px] font-semibold transition-colors shadow-sm"
                  >
                    Audit 5P →
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
