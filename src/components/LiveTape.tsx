import { useEffect, useState } from "react";
import { formatMoney, printTime, timeAgo } from "@/lib/format";
import { loadLiveQuote } from "@/lib/market/api";
import type { LivePrint } from "@/lib/market/types";
import { cn } from "@/lib/utils";
import { SignedPct } from "./Signed";

export function LiveTape({ symbol, initial }: { symbol: string; initial: LivePrint | null }) {
  const [live, setLive] = useState<LivePrint | null>(initial);
  const [tick, setTick] = useState(false);

  useEffect(() => {
    setLive(initial);
  }, [initial, symbol]);

  useEffect(() => {
    let alive = true;
    const pull = async () => {
      try {
        const next = await loadLiveQuote({ data: { symbol } });
        if (alive && next) {
          setLive(next);
          setTick(true);
          window.setTimeout(() => setTick(false), 240);
        }
      } catch {
        // keep last print
      }
    };
    const id = window.setInterval(pull, 20_000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [symbol]);

  if (!live) {
    return (
      <div className="rounded-xl border border-border bg-surface p-5 text-sm text-muted">No last print yet.</div>
    );
  }

  const up = live.changePct >= 0;
  const spark = live.sparkline;
  const min = spark.length ? Math.min(...spark) : live.price;
  const max = spark.length ? Math.max(...spark) : live.price;
  const span = max - min || 1;
  const d = spark
    .map((px, i) => {
      const x = spark.length <= 1 ? 0 : (i / (spark.length - 1)) * 160;
      const y = 36 - ((px - min) / span) * 32;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const stamp = live.delayed
    ? `Delayed · ${timeAgo(live.asOf)}`
    : live.session === "open"
      ? `Last print ${timeAgo(live.asOf)}`
      : `${live.sessionLabel} · ${printTime(live.asOf)}`;

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div
            className={cn(
              "font-mono text-4xl tabular-nums tracking-tight transition-colors duration-(--motion-quick)",
              tick && (up ? "text-up" : "text-down"),
            )}
          >
            {formatMoney(live.price)}
          </div>
          <div className="mt-1 flex flex-wrap items-baseline gap-2">
            <SignedPct value={live.changePct} />
            <span className="text-xs text-subtle">{stamp}</span>
          </div>
        </div>
        {d && (
          <svg viewBox="0 0 160 40" className="h-10 w-40 shrink-0" aria-hidden="true">
            <path d={d} fill="none" className={up ? "stroke-up" : "stroke-down"} strokeWidth={1.5} />
          </svg>
        )}
      </div>
      <p className="mt-3 text-xs text-subtle">
        Yahoo last print, not the exchange SIP. We refresh every 20 seconds. Open session can still lag a few
        minutes.
      </p>
    </div>
  );
}
