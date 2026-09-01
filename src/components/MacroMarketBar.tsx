'use client';

import React, { useEffect, useState } from 'react';

interface IndexQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

const DEFAULT_BENCHMARKS: IndexQuote[] = [
  { symbol: 'SPY', name: 'S&P 500', price: 593.15, change: 2.45, changePercent: 0.41 },
  { symbol: 'QQQ', name: 'NASDAQ 100', price: 514.80, change: 4.10, changePercent: 0.80 },
  { symbol: 'DIA', name: 'Dow Jones', price: 438.20, change: -0.65, changePercent: -0.15 },
  { symbol: 'IWM', name: 'Russell 2000', price: 221.40, change: 1.10, changePercent: 0.50 },
  { symbol: '^VIX', name: 'CBOE Volatility', price: 14.85, change: -0.42, changePercent: -2.75 },
  { symbol: '^TNX', name: 'US 10Y Yield', price: 4.28, change: 0.02, changePercent: 0.47 },
];

export const MacroMarketBar: React.FC = () => {
  const [marketStatus, setMarketStatus] = useState<{ status: string; color: string; badge: string }>({
    status: 'MARKET LIVE',
    color: 'bg-emerald-500',
    badge: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60',
  });
  const [estTime, setEstTime] = useState<string>('');

  useEffect(() => {
    const updateMarketStatus = () => {
      const now = new Date();
      // Format to US Eastern Time
      const estFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true,
        weekday: 'short',
      });
      setEstTime(estFormatter.format(now) + ' EST');

      const estHours = parseInt(
        new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', hour12: false }).format(now),
        10
      );
      const estMinutes = parseInt(
        new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', minute: 'numeric' }).format(now),
        10
      );
      const dayOfWeek = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short' }).format(now);

      const isWeekend = dayOfWeek === 'Sat' || dayOfWeek === 'Sun';
      const timeInMinutes = estHours * 60 + estMinutes;

      if (isWeekend) {
        setMarketStatus({
          status: 'MARKET CLOSED (WEEKEND)',
          color: 'bg-slate-400',
          badge: 'text-slate-400 bg-slate-800/60 border-slate-700',
        });
      } else if (timeInMinutes >= 9 * 60 + 30 && timeInMinutes < 16 * 60) {
        setMarketStatus({
          status: 'NYSE / NASDAQ LIVE',
          color: 'bg-emerald-500',
          badge: 'text-emerald-400 bg-emerald-950/80 border-emerald-600/60',
        });
      } else if (timeInMinutes >= 4 * 60 && timeInMinutes < 9 * 60 + 30) {
        setMarketStatus({
          status: 'PRE-MARKET SESSION',
          color: 'bg-amber-500',
          badge: 'text-amber-400 bg-amber-950/80 border-amber-600/60',
        });
      } else if (timeInMinutes >= 16 * 60 && timeInMinutes < 20 * 60) {
        setMarketStatus({
          status: 'AFTER-HOURS SESSION',
          color: 'bg-sky-500',
          badge: 'text-sky-400 bg-sky-950/80 border-sky-600/60',
        });
      } else {
        setMarketStatus({
          status: 'MARKET CLOSED',
          color: 'bg-rose-500',
          badge: 'text-rose-400 bg-rose-950/80 border-rose-600/60',
        });
      }
    };

    updateMarketStatus();
    const interval = setInterval(updateMarketStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-surface-300/95 border-b border-white/10 px-4 py-2 flex flex-wrap items-center justify-between text-xs font-mono select-none">
      {/* Exchange Status Badge */}
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-2 px-2.5 py-1 rounded border text-[11px] font-semibold tracking-wide ${marketStatus.badge}`}>
          <span className={`w-2 h-2 rounded-full ${marketStatus.color} animate-live-dot`} />
          <span>{marketStatus.status}</span>
        </div>
        <span className="text-slate-400 hidden sm:inline">{estTime}</span>
      </div>

      {/* Benchmark Indices Tape */}
      <div className="flex items-center gap-4 overflow-x-auto py-1 scrollbar-none">
        {DEFAULT_BENCHMARKS.map((idx) => {
          const isPos = idx.change >= 0;
          return (
            <div key={idx.symbol} className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="font-bold text-slate-200">{idx.symbol}</span>
              <span className="tabular-nums font-semibold text-slate-300">
                {idx.symbol.startsWith('^TNX') ? `${idx.price.toFixed(2)}%` : `$${idx.price.toFixed(2)}`}
              </span>
              <span
                className={`tabular-nums text-[11px] font-bold px-1 py-0.5 rounded ${
                  isPos ? 'text-emerald-400 bg-emerald-950/50' : 'text-rose-400 bg-rose-950/50'
                }`}
              >
                {isPos ? '+' : ''}
                {idx.changePercent.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
