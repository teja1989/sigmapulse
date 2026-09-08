import { createFileRoute, Link } from "@tanstack/react-router";
import { CallReason } from "@/components/CallReason";
import { ConfidenceCard } from "@/components/ConfidenceCard";
import { CorrelateStrip } from "@/components/CorrelateStrip";
import { DateCard } from "@/components/DateCard";
import { MarkCard } from "@/components/MarkCard";
import { LiveTape } from "@/components/LiveTape";
import { NewsList } from "@/components/NewsList";
import { OptionsTable } from "@/components/OptionsTable";
import { PayoffLab } from "@/components/PayoffLab";
import { PillarRadar } from "@/components/PillarRadar";
import { PotentialCard } from "@/components/PotentialCard";
import { QuoteChart } from "@/components/QuoteChart";
import { SignalChip } from "@/components/SignalChip";
import { formatVol } from "@/lib/format";
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
        </div>
        {call && <SignalChip call={call} size="lg" />}
      </div>
      {data.error && <p className="text-sm text-down">{data.error}</p>}
      <LiveTape symbol={symbol.toUpperCase()} initial={data.live} />
      {data.date && <DateCard date={data.date} />}
      <MarkCard symbol={symbol.toUpperCase()} marks={data.marks} />
      {data.confidence && <ConfidenceCard confidence={data.confidence} />}
      {data.radar && <PillarRadar radar={data.radar} />}
      {call && (
        <div className="rounded-xl border border-border bg-surface p-5">
          <CallReason call={call} />
        </div>
      )}
      <section className="space-y-3">
        <h2 className="text-sm font-medium">This ticker</h2>
        <NewsList items={data.news} empty="No headlines tied to this ticker." />
      </section>
      <CorrelateStrip rows={data.correlates} />
      {quote && (
        <>
          <QuoteChart quote={quote} live={data.live} marks={data.marks} />
          {data.setup && <PotentialCard setup={data.setup} />}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                const next = toggleWatch(quote.symbol);
                setWatched(next.includes(quote.symbol));
              }}
              className="h-11 rounded-md border border-border px-3 text-sm text-muted"
            >
              {watched ? "On watchlist" : "Add to watchlist"}
            </button>
            <Link
              to="/desk"
              search={{ symbol: quote.symbol }}
              className="inline-flex h-11 items-center rounded-md border border-border px-3 text-sm text-muted no-underline"
            >
              Desk
            </Link>
          </div>
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
                {quote.low52 != null && quote.high52 != null
                  ? `${quote.low52.toFixed(2)} – ${quote.high52.toFixed(2)}`
                  : "n/a"}
              </dd>
            </div>
          </dl>
          <PayoffLab quote={quote} iv={data.options?.atmIv ?? null} />
        </>
      )}
      <OptionsTable snapshot={data.options} />
    </div>
  );
}
