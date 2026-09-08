import { Link } from "@tanstack/react-router";
import { formatPct } from "@/lib/format";
import type { CorrelateRow } from "@/lib/market/types";
import { cn } from "@/lib/utils";

export function CorrelateStrip({ rows }: { rows: CorrelateRow[] }) {
  if (!rows.length) {
    return (
      <section className="rounded-xl border border-border bg-surface p-5 text-sm text-muted">
        No overlapping history to see who it moves with.
      </section>
    );
  }
  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <h2 className="text-sm font-medium">Moves with</h2>
      <p className="mt-1 text-xs text-subtle">Same daily moves, last ~3 months. Not a forecast.</p>
      <ul className="mt-4 space-y-3">
        {rows.slice(0, 6).map((row) => {
          const corr = row.corr ?? 0;
          const left = corr >= 0 ? 50 : 50 + corr * 50;
          const width = Math.abs(corr) * 50;
          return (
            <li key={row.symbol} className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-3">
              <Link
                to="/ticker/$symbol"
                params={{ symbol: row.symbol }}
                className="font-mono text-sm text-fg no-underline hover:underline"
              >
                {row.symbol}
              </Link>
              <div className="relative h-1.5 rounded-full bg-border">
                <div className="absolute top-0 h-full w-px bg-subtle" style={{ left: "50%" }} />
                <div
                  className={cn(
                    "absolute top-0 h-full rounded-full",
                    corr >= 0 ? "bg-up/80" : "bg-down/80",
                  )}
                  style={{ left: `${left}%`, width: `${width}%` }}
                />
              </div>
              <div className="text-right">
                <div className="font-mono text-xs tabular-nums text-muted">
                  {row.corr == null ? "n/a" : row.corr.toFixed(2)} · {formatPct(row.changePct, 1)}
                </div>
                <div className="text-[11px] text-subtle">{row.meaning}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
