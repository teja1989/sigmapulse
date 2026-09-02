import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { PillarBoard } from "@/components/PillarBoard";
import { MissingBits } from "@/components/MissingBits";
import { PotentialCard } from "@/components/PotentialCard";
import { loadTicker } from "@/lib/market/api";
import { formatMoney } from "@/lib/format";
import { SignedPct } from "@/components/Signed";

type Search = { symbol?: string };

export const Route = createFileRoute("/desk")({
  validateSearch: (s: Record<string, unknown>): Search => {
    const symbol = typeof s.symbol === "string" ? s.symbol.toUpperCase() : undefined;
    return symbol ? { symbol } : {};
  },
  loaderDeps: ({ search }) => ({ symbol: search.symbol ?? "AAPL" }),
  loader: ({ deps }) => loadTicker({ data: { symbol: deps.symbol } }),
  pendingMs: 8_000,
  component: DeskPage,
});

function DeskPage() {
  const data = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/desk" });
  const [symbol, setSymbol] = useState(search.symbol ?? "AAPL");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void navigate({ search: { symbol: symbol.toUpperCase() } });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl tracking-tight">Desk</h1>
          <p className="mt-1 text-sm text-muted">One call. The rest is backup.</p>
        </div>
        <form onSubmit={onSubmit} className="flex gap-2">
          <input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="h-10 w-28 rounded-md border border-border bg-surface px-3 font-mono text-sm"
          />
          <button type="submit" className="h-10 rounded-md bg-accent px-3 text-sm text-bg">
            Audit
          </button>
        </form>
      </div>
      {data.quote && (
        <div className="flex flex-wrap items-baseline gap-4 rounded-xl border border-border bg-surface px-4 py-3">
          <span className="font-mono text-lg">{data.quote.symbol}</span>
          <span className="font-mono text-2xl tabular-nums">{formatMoney(data.quote.price)}</span>
          <SignedPct value={data.quote.changePct} />
        </div>
      )}
      {data.error && <p className="text-sm text-down">{data.error}</p>}
      {data.setup && <PotentialCard setup={data.setup} />}
      <MissingBits />
      <PillarBoard desk={data.desk} />
    </div>
  );
}
