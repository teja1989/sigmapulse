import { createFileRoute, Link } from "@tanstack/react-router";
import { loadBook } from "@/lib/market/book-api";
import type { HouseMark } from "@/lib/market/book";
import { formatMoney, formatPct } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/book")({
  loader: () => loadBook(),
  pendingMs: 8_000,
  component: BookPage,
});

const TONE = {
  paid: "text-up",
  failed: "text-down",
  expired: "text-muted",
} as const;

function Row({ mark }: { mark: HouseMark }) {
  return (
    <li>
      <Link
        to="/ticker/$symbol"
        params={{ symbol: mark.symbol }}
        className="flex items-start justify-between gap-4 px-4 py-3 no-underline hover:bg-surface-2"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-mono text-sm text-fg">{mark.symbol}</span>
            <span className="text-xs uppercase tracking-wide text-subtle">{mark.stance}</span>
            <span className="text-xs text-muted">{mark.setup}</span>
          </div>
          <p className="mt-1 text-sm text-muted">{mark.sentence}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-sm tabular-nums">{formatMoney(mark.entryPrint)}</p>
          {mark.status === "closed" ? (
            <p className={cn("mt-0.5 text-xs", mark.outcome ? TONE[mark.outcome] : "text-subtle")}>
              {mark.outcome}
              {mark.fwd10dPct != null || mark.fwd5dPct != null
                ? ` · ${formatPct(mark.fwd10dPct ?? mark.fwd5dPct)}`
                : ""}
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-subtle">{mark.timeHorizonTd}d clock</p>
          )}
        </div>
      </Link>
    </li>
  );
}

function BookPage() {
  const data = Route.useLoaderData();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl tracking-tight">Book</h1>
        <p className="mt-1 text-sm text-muted">
          House calls, stamped with an exit. Delayed prints. Not a broker.
        </p>
      </div>
      <section className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <p className="text-xs uppercase tracking-wider text-subtle">Report card</p>
        <p className="mt-2 text-sm leading-relaxed text-fg">{data.report}</p>
      </section>
      {data.error && <p className="text-sm text-down">{data.error}</p>}
      <section className="space-y-3">
        <h2 className="text-sm font-medium">Open</h2>
        {data.open.length === 0 ? (
          <p className="rounded-xl border border-border bg-surface px-4 py-6 text-sm text-muted">
            Nothing open. Open a ticker or the Pulse — we stamp the house call once per session.
          </p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
            {data.open.map((m) => (
              <Row key={m.id} mark={m} />
            ))}
          </ul>
        )}
      </section>
      <section className="space-y-3">
        <h2 className="text-sm font-medium">Closed</h2>
        {data.closed.length === 0 ? (
          <p className="rounded-xl border border-border bg-surface px-4 py-6 text-sm text-muted">
            No closed marks yet. Closes when the stop, the take, the date, or the 10-day clock hits.
          </p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
            {data.closed.map((m) => (
              <Row key={m.id} mark={m} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
