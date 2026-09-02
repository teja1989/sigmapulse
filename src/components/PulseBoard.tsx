import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CallReason } from "./CallReason";
import { SignedPct } from "./Signed";
import { SignalChip } from "./SignalChip";
import { capLabel, formatCap, formatMoney, formatVol } from "@/lib/format";
import type { PulseName } from "@/lib/market/api";
import type { Action } from "@/lib/market/types";
import { cn } from "@/lib/utils";

const FILTERS: { id: Action | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "buy", label: "Buy" },
  { id: "watch", label: "Watch" },
  { id: "wait", label: "Wait" },
  { id: "avoid", label: "Avoid" },
];

export function PulseBoard({ names, showCap = false }: { names: PulseName[]; showCap?: boolean }) {
  const [filter, setFilter] = useState<Action | "all">("all");
  const rows = useMemo(
    () => (filter === "all" ? names : names.filter((n) => n.call.action === filter)),
    [filter, names],
  );

  if (!names.length) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6 text-sm text-muted">
        No names in this bucket right now.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              "h-11 rounded-md px-3 text-sm",
              filter === f.id ? "bg-accent text-bg" : "border border-border text-muted",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wider text-subtle">
            <tr>
              <th className="px-4 py-3 font-medium">Call</th>
              <th className="px-4 py-3 font-medium">Symbol</th>
              <th className="px-4 py-3 font-medium">Last</th>
              <th className="px-4 py-3 font-medium">Change</th>
              {showCap && <th className="px-4 py-3 font-medium">Cap</th>}
              <th className="px-4 py-3 font-medium">Volume</th>
              <th className="px-4 py-3 font-medium">Why this call</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ quote, call, cap, tag }) => (
              <tr key={quote.symbol} className="border-b border-border/70 last:border-0">
                <td className="px-4 py-3">
                  <SignalChip call={call} size="sm" />
                </td>
                <td className="px-4 py-3">
                  <Link to="/ticker/$symbol" params={{ symbol: quote.symbol }} className="no-underline">
                    <div className="font-mono text-fg">{quote.symbol}</div>
                    <div className="max-w-[220px] truncate text-xs text-muted">
                      {tag} · {quote.name}
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono tabular-nums">{formatMoney(quote.price)}</td>
                <td className="px-4 py-3">
                  <SignedPct value={quote.changePct} />
                </td>
                {showCap && (
                  <td className="px-4 py-3">
                    <div className="text-xs text-muted">{capLabel(cap)}</div>
                    <div className="font-mono text-xs text-subtle">{formatCap(quote.marketCap)}</div>
                  </td>
                )}
                <td className="px-4 py-3 font-mono tabular-nums text-muted">{formatVol(quote.volume)}</td>
                <td className="px-4 py-3">
                  <CallReason call={call} compact />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
