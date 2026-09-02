import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CallReason } from "./CallReason";
import { SetupChip } from "./PotentialCard";
import { SignedPct } from "./Signed";
import { SignalChip } from "./SignalChip";
import { capLabel, formatCap, formatMoney, formatPct, formatVol } from "@/lib/format";
import type { PulseName } from "@/lib/market/api";
import type { SetupKind } from "@/lib/market/setup";
import type { Action } from "@/lib/market/types";
import { cn } from "@/lib/utils";

const CALL_FILTERS: { id: Action | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "buy", label: "Buy" },
  { id: "watch", label: "Watch" },
  { id: "wait", label: "Wait" },
  { id: "avoid", label: "Avoid" },
];

const SETUP_FILTERS: { id: SetupKind | "all"; label: string }[] = [
  { id: "all", label: "Any setup" },
  { id: "coil", label: "Coil" },
  { id: "lag", label: "Lag" },
  { id: "spent", label: "Spent" },
  { id: "room", label: "Room" },
];

export function PulseBoard({ names, showCap = false }: { names: PulseName[]; showCap?: boolean }) {
  const [filter, setFilter] = useState<Action | "all">("all");
  const [setup, setSetup] = useState<SetupKind | "all">("all");
  const rows = useMemo(() => {
    return names.filter((n) => {
      if (filter !== "all" && n.call.action !== filter) return false;
      if (setup !== "all" && n.setup.kind !== setup) return false;
      return true;
    });
  }, [filter, names, setup]);

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
        {CALL_FILTERS.map((f) => (
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
      <div className="flex flex-wrap gap-1">
        {SETUP_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setSetup(f.id)}
            className={cn(
              "h-11 rounded-md px-3 text-sm",
              setup === f.id ? "bg-surface-2 text-fg" : "border border-border text-muted",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
      {rows.length === 0 && (
        <div className="rounded-xl border border-border bg-surface p-6 text-sm text-muted">
          Nothing in that setup right now.
        </div>
      )}
      <div className="space-y-2 lg:hidden">
        {rows.map((row) => (
          <PulseCard key={row.quote.symbol} row={row} showCap={showCap} />
        ))}
      </div>
      <div className="hidden overflow-x-auto rounded-xl border border-border bg-surface lg:block">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wider text-subtle">
            <tr>
              <th className="px-4 py-3 font-medium">Call</th>
              <th className="px-4 py-3 font-medium">Symbol</th>
              <th className="px-4 py-3 font-medium">Last</th>
              <th className="px-4 py-3 font-medium">Change</th>
              <th className="px-4 py-3 font-medium">Setup</th>
              {showCap && <th className="px-4 py-3 font-medium">Cap</th>}
              <th className="px-4 py-3 font-medium">Volume</th>
              <th className="px-4 py-3 font-medium">Why this call</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ quote, call, cap, tag, setup: s }) => (
              <tr key={quote.symbol} className="border-b border-border/70 last:border-0">
                <td className="px-4 py-3">
                  <SignalChip call={call} size="sm" />
                </td>
                <td className="px-4 py-3">
                  <Link
                    to="/ticker/$symbol"
                    params={{ symbol: quote.symbol }}
                    className="no-underline"
                  >
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
                <td className="px-4 py-3">
                  <SetupChip setup={s} />
                  <div className="mt-1 font-mono text-xs text-subtle">
                    {s.gainPct == null ? "room n/a" : `Room ${formatPct(s.gainPct, 0)}`}
                    {s.rr != null ? ` · ${s.rr}R` : ""}
                  </div>
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

function PulseCard({ row, showCap }: { row: PulseName; showCap: boolean }) {
  const { quote, call, cap, tag, setup } = row;
  return (
    <Link
      to="/ticker/$symbol"
      params={{ symbol: quote.symbol }}
      className="block rounded-xl border border-border bg-surface p-4 no-underline"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-fg">{quote.symbol}</div>
          <div className="mt-0.5 max-w-[220px] truncate text-xs text-muted">
            {tag} · {quote.name}
            {showCap ? ` · ${capLabel(cap)}` : ""}
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono tabular-nums text-fg">{formatMoney(quote.price)}</div>
          <SignedPct value={quote.changePct} />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <SignalChip call={call} size="sm" />
        <SetupChip setup={setup} />
        <span className="font-mono text-xs text-subtle">
          {setup.gainPct == null ? "room n/a" : `Room ${formatPct(setup.gainPct, 0)}`}
          {setup.rr != null ? ` · ${setup.rr}R` : ""}
        </span>
      </div>
      <p className="mt-2 text-sm text-muted">{setup.why}</p>
      <p className="mt-1 text-xs text-subtle">{call.why}</p>
    </Link>
  );
}
