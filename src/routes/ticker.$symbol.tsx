import { createFileRoute, Link } from "@tanstack/react-router";
import { NewsList } from "@/components/NewsList";
import { OptionsTable } from "@/components/OptionsTable";
import { PayoffLab } from "@/components/PayoffLab";
import { PillarBoard } from "@/components/PillarBoard";
import { QuoteChart } from "@/components/QuoteChart";
import { SignedPct } from "@/components/Signed";
import { formatMoney, formatVol, shortTime } from "@/lib/format";
import { loadTicker } from "@/lib/market/api";
import { useState } from "react";
import { readWatchlist, toggleWatch } from "@/lib/watchlist";

export const Route = createFileRoute("/ticker/$symbol")({
  loader: ({ params }) => loadTicker({ data: { symbol: params.symbol } }),
  component: TickerPage,
});

function TickerPage() {
  const data = Route.useLoaderData();
  const { symbol } = Route.useParams();
  const [watched, setWatched] = useState(() => readWatchlist().includes(symbol.toUpperCase()));
  const quote = data.quote;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-subtle">Ticker dossier</p>
          <h1 className="mt-1 font-display text-3xl tracking-tight">{symbol.toUpperCase()}</h1>
          {quote && <p className="text-sm text-muted">{quote.name}</p>}
        </div>
        {quote && (
          <div className="text-right">
            <div className="font-mono text-3xl tabular-nums">{formatMoney(quote.price)}</div>
            <SignedPct value={quote.changePct} />
          </div>
        )}
      </div>
      {data.error && <p className="text-sm text-down">{data.error}</p>}
      {quote && (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                const next = toggleWatch(quote.symbol);
                setWatched(next.includes(quote.symbol));
              }}
              className="h-10 rounded-md border border-border px-3 text-sm text-muted"
            >
              {watched ? "Remove from watchlist" : "Watch"}
            </button>
            <Link
              to="/desk"
              search={{ symbol: quote.symbol }}
              className="inline-flex h-10 items-center rounded-md border border-border px-3 text-sm text-muted no-underline"
            >
              Open desk
            </Link>
          </div>
          <QuoteChart quote={quote} />
          <dl className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-surface p-4 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-xs text-subtle">Volume</dt>
              <dd className="font-mono">{formatVol(quote.volume)}</dd>
            </div>
            <div>
              <dt className="text-xs text-subtle">Avg vol</dt>
              <dd className="font-mono">{formatVol(quote.avgVolume)}</dd>
            </div>
            <div>
              <dt className="text-xs text-subtle">52w range</dt>
              <dd className="font-mono text-xs">
                {formatMoney(quote.low52)} – {formatMoney(quote.high52)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-subtle">As of</dt>
              <dd className="text-xs text-muted">{shortTime(quote.provenance.asOf)}</dd>
            </div>
          </dl>
          <PayoffLab quote={quote} iv={data.options?.atmIv ?? null} />
        </>
      )}
      <PillarBoard desk={data.desk} />
      <OptionsTable snapshot={data.options} />
      <section className="space-y-3">
        <h2 className="text-sm font-medium">Related headlines</h2>
        <NewsList items={data.news} />
      </section>
    </div>
  );
}
