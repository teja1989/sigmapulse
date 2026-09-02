import { Link } from "@tanstack/react-router";
import { SignedPct } from "./Signed";
import { formatMoney } from "@/lib/format";
import type { Quote } from "@/lib/market/types";

export function IndexTape({ quotes }: { quotes: Quote[] }) {
  if (!quotes.length) {
    return (
      <div className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-muted">
        Index tape unavailable. Yahoo delayed feed did not return.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
      {quotes.map((q) => (
        <Link
          key={q.symbol}
          to="/ticker/$symbol"
          params={{ symbol: q.symbol }}
          className="rounded-xl border border-border bg-surface px-3 py-3 no-underline"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs text-muted">{q.symbol}</span>
            <SignedPct value={q.changePct} />
          </div>
          <div className="mt-1 font-mono text-lg tabular-nums text-fg">{formatMoney(q.price)}</div>
        </Link>
      ))}
    </div>
  );
}
