import type { HouseMark } from "@/lib/market/book";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

const OUTCOME = {
  paid: "border-up/40 bg-up/10 text-up",
  failed: "border-down/40 bg-down/10 text-down",
  expired: "border-border bg-surface-2 text-muted",
} as const;

export function MarkChip({ mark }: { mark: HouseMark | null | undefined }) {
  if (!mark) return null;
  if (mark.status === "open") {
    return (
      <span className="text-xs text-subtle">
        Open {mark.stance} · {mark.timeHorizonTd}d
      </span>
    );
  }
  return (
    <span className="text-xs text-subtle">
      Last {mark.outcome ?? "closed"}
    </span>
  );
}

export function MarkCard({ marks }: { symbol?: string; marks: HouseMark[] }) {
  const open = marks.find((m) => m.status === "open");
  const last = marks.find((m) => m.status === "closed") ?? open;

  return (
    <section className="rounded-xl border border-border bg-surface p-4 sm:p-5">
      <div>
        <p className="text-xs uppercase tracking-wider text-subtle">The book</p>
        <p className="mt-1 font-display text-2xl tracking-tight">
          {open ? `Open ${open.stance}` : last ? `Last ${last.outcome}` : "Not on the book yet"}
        </p>
      </div>
      {open && (
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs text-subtle">Entry print</dt>
            <dd className="font-mono tabular-nums">{formatMoney(open.entryPrint)}</dd>
          </div>
          <div>
            <dt className="text-xs text-subtle">Stop</dt>
            <dd>{open.stopPct == null ? "Time only" : `−${open.stopPct.toFixed(1)}%`}</dd>
          </div>
          <div>
            <dt className="text-xs text-subtle">Take</dt>
            <dd>{open.takePct == null ? "—" : `+${open.takePct.toFixed(1)}%`}</dd>
          </div>
          <div>
            <dt className="text-xs text-subtle">Clock</dt>
            <dd>{open.timeHorizonTd} trading days</dd>
          </div>
        </dl>
      )}
      <p className="mt-3 text-sm leading-relaxed text-fg">
        {(open ?? last)?.sentence ??
          "The house writes this after the close. Opening the ticker does not stamp a call."}
      </p>
      {marks.filter((m) => m.status === "closed").slice(0, 3).length > 0 && (
        <ul className="mt-4 divide-y divide-border border-t border-border">
          {marks
            .filter((m) => m.status === "closed")
            .slice(0, 3)
            .map((m) => (
              <li key={m.id} className="flex items-start justify-between gap-3 py-3">
                <div>
                  <p className="text-sm">
                    {m.sessionDate} · {m.stance}
                  </p>
                  <p className="mt-1 text-xs text-muted">{m.sentence}</p>
                </div>
                <span
                  className={cn(
                    "inline-flex h-8 shrink-0 items-center rounded-md border px-3 text-xs uppercase tracking-wide",
                    m.outcome ? OUTCOME[m.outcome] : "border-border text-muted",
                  )}
                >
                  {m.outcome}
                </span>
              </li>
            ))}
        </ul>
      )}
    </section>
  );
}
