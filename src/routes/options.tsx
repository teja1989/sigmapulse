import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { OptionsTable } from "@/components/OptionsTable";
import { loadOptions } from "@/lib/market/api";
import { formatIv } from "@/lib/format";

type Search = { symbol?: string };

export const Route = createFileRoute("/options")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    symbol: typeof s.symbol === "string" ? s.symbol.toUpperCase() : "SPY",
  }),
  loaderDeps: ({ search }) => ({ symbol: search.symbol ?? "SPY" }),
  loader: ({ deps }) => loadOptions({ data: { symbol: deps.symbol } }),
  component: OptionsPage,
});

function OptionsPage() {
  const snapshot = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/options" });
  const [symbol, setSymbol] = useState(search.symbol ?? "SPY");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void navigate({ search: { symbol: symbol.toUpperCase() } });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl tracking-tight">Unusual options</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Nearest Yahoo expiry. Unusual is volume versus open interest — not dark-pool prints.
          </p>
        </div>
        <form onSubmit={onSubmit} className="flex gap-2">
          <input
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="h-10 w-28 rounded-md border border-border bg-surface px-3 font-mono text-sm"
          />
          <button type="submit" className="h-10 rounded-md bg-accent px-3 text-sm text-bg">
            Load
          </button>
        </form>
      </div>
      {snapshot?.atmIv != null && (
        <p className="text-sm text-muted">
          ATM IV {formatIv(snapshot.atmIv)} · {snapshot.provenance.label}
        </p>
      )}
      <OptionsTable snapshot={snapshot} />
    </div>
  );
}
