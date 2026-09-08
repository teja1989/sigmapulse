import type { DateRead, DateStatus } from "@/lib/market/types";
import { cn } from "@/lib/utils";

const STATUS: Record<DateStatus, string> = {
  confirmed: "border-up/40 bg-up/10 text-up",
  estimated: "border-warn/40 bg-warn/10 text-warn",
  printed: "border-border bg-surface-2 text-muted",
  unconfirmed: "border-border bg-surface-2 text-muted",
};

const STATUS_LABEL: Record<DateStatus, string> = {
  confirmed: "Confirmed",
  estimated: "Estimated",
  printed: "Already printed",
  unconfirmed: "Unconfirmed",
};

const KIND_LABEL = {
  earnings: "Earnings",
  fda: "FDA",
  headline: "Headline date",
} as const;

export function DateMark({ date }: { date: DateRead }) {
  if (!date.event) return null;
  return (
    <span className="text-xs text-subtle">
      {date.event.label}
      {date.event.status === "estimated" ? " · est." : ""}
    </span>
  );
}

export function DateCard({ date }: { date: DateRead }) {
  const ev = date.event;
  return (
    <section className="rounded-xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-subtle">The date</p>
          <p className="mt-1 font-display text-2xl tracking-tight">{ev ? ev.label : "No date"}</p>
        </div>
        {ev && (
          <div className="flex flex-wrap gap-1">
            <span className="inline-flex h-8 items-center rounded-md border border-border px-3 text-xs uppercase tracking-wide text-muted">
              {KIND_LABEL[ev.kind]}
            </span>
            <span
              className={cn(
                "inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium uppercase tracking-wide",
                STATUS[ev.status],
              )}
            >
              {STATUS_LABEL[ev.status]}
            </span>
          </div>
        )}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-fg">{date.meaning}</p>
      {ev && (
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-subtle">When</dt>
            <dd>{ev.detail}</dd>
          </div>
          {ev.consensusEps != null && (
            <div>
              <dt className="text-xs text-subtle">Consensus EPS</dt>
              <dd className="font-mono tabular-nums">${ev.consensusEps.toFixed(2)}</dd>
            </div>
          )}
          {ev.surprisePct != null && (
            <div>
              <dt className="text-xs text-subtle">Surprise</dt>
              <dd className="font-mono tabular-nums">{ev.surprisePct.toFixed(1)}%</dd>
            </div>
          )}
          <div>
            <dt className="text-xs text-subtle">Source</dt>
            <dd className="text-muted">{ev.provenance.label}</dd>
          </div>
        </dl>
      )}
    </section>
  );
}