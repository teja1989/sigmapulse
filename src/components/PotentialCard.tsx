import { formatPct } from "@/lib/format";
import type { Potential } from "@/lib/market/setup";
import { cn } from "@/lib/utils";

const TONE: Record<Potential["kind"], string> = {
  coil: "border-up/40 text-up",
  lag: "border-warn/40 text-warn",
  spent: "border-down/40 text-down",
  wash: "border-border text-muted",
  room: "border-border text-fg",
  none: "border-border text-muted",
};

export function SetupChip({ setup }: { setup: Potential }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-md border px-2 text-xs font-medium uppercase tracking-wide",
        TONE[setup.kind],
      )}
    >
      {setup.label}
    </span>
  );
}

export function PotentialCard({ setup }: { setup: Potential }) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center gap-3">
        <SetupChip setup={setup} />
        <h2 className="text-sm font-medium">Before the tape</h2>
      </div>
      <p className="mt-3 text-sm text-muted">{setup.why}</p>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-xs text-subtle">Room to high</dt>
          <dd className="font-mono tabular-nums">{setup.gainPct == null ? "n/a" : formatPct(setup.gainPct, 1)}</dd>
        </div>
        <div>
          <dt className="text-xs text-subtle">Risk to 20-day</dt>
          <dd className="font-mono tabular-nums">{setup.riskPct == null ? "n/a" : formatPct(setup.riskPct, 1)}</dd>
        </div>
        <div>
          <dt className="text-xs text-subtle">R : R</dt>
          <dd className="font-mono tabular-nums">{setup.rr == null ? "n/a" : `${setup.rr}R`}</dd>
        </div>
        <div>
          <dt className="text-xs text-subtle">Typical day</dt>
          <dd className="font-mono tabular-nums">{setup.atrPct == null ? "n/a" : `±${setup.atrPct.toFixed(1)}%`}</dd>
        </div>
      </dl>
      <p className="mt-4 text-xs text-subtle">
        Room is distance to the 52-week high, not a target. Coil and lag are the earlier read. Buy/Avoid is after the
        move.
      </p>
    </section>
  );
}
