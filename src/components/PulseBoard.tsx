import { Link } from "@tanstack/react-router";
import { SignedPct } from "./Signed";
import { formatMoney, formatVol, shortTime } from "@/lib/format";
import type { Quote } from "@/lib/market/types";

export function PulseBoard({ quotes }: { quotes: Quote[] }) {
  if (!quotes.length) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6 text-sm text-muted">
        No delayed quotes loaded. Refresh in a moment.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-border text-xs uppercase tracking-wider text-subtle">
          <tr>
            <th className="px-4 py-3 font-medium">Symbol</th>
            <th className="px-4 py-3 font-medium">Last</th>
            <th className="px-4 py-3 font-medium">Change</th>
            <th className="px-4 py-3 font-medium">Volume</th>
            <th className="px-4 py-3 font-medium">52w</th>
            <th className="px-4 py-3 font-medium">As of</th>
          </tr>
        </thead>
        <tbody>
          {quotes.map((q) => (
            <tr key={q.symbol} className="border-b border-border/70 last:border-0">
              <td className="px-4 py-3">
                <Link
                  to="/ticker/$symbol"
                  params={{ symbol: q.symbol }}
                  className="no-underline"
                >
                  <div className="font-mono text-fg">{q.symbol}</div>
                  <div className="max-w-[220px] truncate text-xs text-muted">{q.name}</div>
                </Link>
              </td>
              <td className="px-4 py-3 font-mono tabular-nums">{formatMoney(q.price)}</td>
              <td className="px-4 py-3">
                <SignedPct value={q.changePct} />
              </td>
              <td className="px-4 py-3 font-mono tabular-nums text-muted">{formatVol(q.volume)}</td>
              <td className="px-4 py-3 font-mono text-xs tabular-nums text-muted">
                {formatMoney(q.low52)} – {formatMoney(q.high52)}
              </td>
              <td className="px-4 py-3 text-xs text-subtle">{shortTime(q.provenance.asOf)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
