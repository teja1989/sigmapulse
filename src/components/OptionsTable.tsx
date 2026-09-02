import { formatIv, formatMoney, formatVol } from "@/lib/format";
import type { OptionContract, OptionSnapshot } from "@/lib/market/types";
import { cn } from "@/lib/utils";

function Rows({ rows, empty }: { rows: OptionContract[]; empty: string }) {
  if (!rows.length) {
    return <p className="px-4 py-6 text-sm text-muted">{empty}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead className="border-b border-border text-xs uppercase tracking-wider text-subtle">
          <tr>
            <th className="px-3 py-2 font-medium">Type</th>
            <th className="px-3 py-2 font-medium">Strike</th>
            <th className="px-3 py-2 font-medium">Expiry</th>
            <th className="px-3 py-2 font-medium">Last</th>
            <th className="px-3 py-2 font-medium">Bid / Ask</th>
            <th className="px-3 py-2 font-medium">Vol</th>
            <th className="px-3 py-2 font-medium">OI</th>
            <th className="px-3 py-2 font-medium">IV</th>
            <th className="px-3 py-2 font-medium">Vol/OI</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.contractSymbol} className="border-b border-border/70 last:border-0">
              <td className={cn("px-3 py-2 font-mono text-xs uppercase", c.type === "call" ? "text-up" : "text-down")}>
                {c.type}
              </td>
              <td className="px-3 py-2 font-mono tabular-nums">{c.strike.toFixed(2)}</td>
              <td className="px-3 py-2 font-mono text-xs text-muted">{c.expiration}</td>
              <td className="px-3 py-2 font-mono tabular-nums">{formatMoney(c.last, 2)}</td>
              <td className="px-3 py-2 font-mono text-xs tabular-nums text-muted">
                {formatMoney(c.bid, 2)} / {formatMoney(c.ask, 2)}
              </td>
              <td className="px-3 py-2 font-mono tabular-nums">{formatVol(c.volume)}</td>
              <td className="px-3 py-2 font-mono tabular-nums">{formatVol(c.openInterest)}</td>
              <td className="px-3 py-2 font-mono tabular-nums">{formatIv(c.iv)}</td>
              <td className="px-3 py-2 font-mono tabular-nums">{c.unusualScore.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function OptionsTable({ snapshot }: { snapshot: OptionSnapshot | null }) {
  if (!snapshot) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6 text-sm text-muted">
        Options chain unavailable for this symbol.
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-4 py-3 text-sm text-muted">
          Unusual prints · nearest expiry {snapshot.expiration ?? "n/a"} · volume vs open interest
        </div>
        <Rows rows={snapshot.unusual} empty="No unusual volume on the nearest expiry." />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface">
          <div className="border-b border-border px-4 py-3 text-sm text-muted">Calls</div>
          <Rows rows={snapshot.calls.slice(0, 18)} empty="No calls." />
        </div>
        <div className="rounded-xl border border-border bg-surface">
          <div className="border-b border-border px-4 py-3 text-sm text-muted">Puts</div>
          <Rows rows={snapshot.puts.slice(0, 18)} empty="No puts." />
        </div>
      </div>
    </div>
  );
}
