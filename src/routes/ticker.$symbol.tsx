import { createFileRoute, Link } from "@tanstack/react-router";
import { CallReason } from "@/components/CallReason";
import { MissingBits } from "@/components/MissingBits";
import { NewsList } from "@/components/NewsList";
import { OptionsTable } from "@/components/OptionsTable";
import { PayoffLab } from "@/components/PayoffLab";
import { PillarBoard } from "@/components/PillarBoard";
import { PotentialCard } from "@/components/PotentialCard";
import { QuoteChart } from "@/components/QuoteChart";
import { SignalChip } from "@/components/SignalChip";
import { SignedPct } from "@/components/Signed";
import { formatMoney, formatVol } from "@/lib/format";
import { loadTicker } from "@/lib/market/api";
import { useState } from "react";
import { readWatchlist, toggleWatch } from "@/lib/watchlist";

export const Route = createFileRoute("/ticker/$symbol")({
  loader: ({ params }) => loadTicker({ data: { symbol: params.symbol } }),
  pendingMs: 8_000,
  component: TickerPage,
});

function TickerPage() {
  const data = Route.useLoaderData();
  const { symbol } = Route.useParams();
  const [watched, setWatched] = useState(() => readWatchlist().includes(symbol.toUpperCase()));
  const quote = data.quote;
  const call = data.desk?.call;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-tight">{symbol.toUpperCase()}</h1>
          {quote && <p className="text-sm text-muted">{quote.name}</p>}
          {call && (
            <div className="mt-3 max-w-xl">
              <CallReason call={call} />
            </div>
          )}
        </div>
        {quote && (
          <div className="text-right">
            {call && (
              <div className="mb-2 flex justify-end">
                <SignalChip call={call} size="lg" />
              </div>
            )}
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
              {watched ? "On watchlist" : "Add to watchlist"}
            </button>
            <Link
              to="/desk"
              search={{ symbol: quote.symbol }}
              className="inline-flex h-10 items-center rounded-md border border-border px-3 text-sm text-muted no-underline"
            >
              Desk
            </Link>
          </div>
          <QuoteChart quote={quote} />
          {data.setup && <PotentialCard setup={data.setup} />}
          <MissingBits />
          <dl className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-surface p-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs text-subtle">Volume</dt>
              <dd className="font-mono">{formatVol(quote.volume)}</dd>
            </div>
            <div>
              <dt className="text-xs text-subtle">Avg vol</dt>
              <dd className="font-mono">{formatVol(quote.avgVolume)}</dd>
            </div>
            <div>
              <dt className="text-xs text-subtle">52w</dt>
              <dd className="font-mono text-xs">
                {formatMoney(quote.low52)} – {formatMoney(quote.high52)}
              </dd>
            </div>
          </dl>
          <PayoffLab quote={quote} iv={data.options?.atmIv ?? null} />
        </>
      )}
      <PillarBoard desk={data.desk} />
      <OptionsTable snapshot={data.options} />
      <section className="space-y-3">
        <h2 className="text-sm font-medium">Headlines</h2>
        <NewsList items={data.news} />
      </section>
    </div>
  );
}
