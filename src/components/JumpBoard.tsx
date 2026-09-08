import { Link } from "@tanstack/react-router";
import { formatPct } from "@/lib/format";
import type { PulseName } from "@/lib/market/api";
import { isJump } from "@/lib/market/setup";
import { ConfidenceMark } from "./ConfidenceCard";
import { DateMark } from "./DateCard";
import { MarkChip } from "./MarkCard";
import { SetupChip } from "./PotentialCard";

export function pickJumps(names: PulseName[]): PulseName[] {
  return names
    .filter((n) => isJump(n.setup))
    .sort(
      (a, b) =>
        (b.confidence.score ?? 0) - (a.confidence.score ?? 0) ||
        (b.setup.rr ?? 0) - (a.setup.rr ?? 0) ||
        (b.setup.gainPct ?? 0) - (a.setup.gainPct ?? 0),
    )
    .slice(0, 6);
}

export function JumpBoard({ names }: { names: PulseName[] }) {
  const jumps = pickJumps(names);
  if (!jumps.length) {
    return (
      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-sm font-medium">Before the tape</h2>
        <p className="mt-2 text-sm text-muted">
          Nothing coiled or lagging in this bucket. Buy/Avoid is the tape already moving — wait for compression or a
          lag versus the index.
        </p>
      </section>
    );
  }
  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <h2 className="text-sm font-medium">Before the tape</h2>
      <p className="mt-1 text-sm text-muted">
        Coil is quiet range with room. Lag is behind the index. Confidence is how many of the four reads agree.
      </p>
      <ul className="mt-4 divide-y divide-border">
        {jumps.map((n) => (
          <li key={n.quote.symbol} className="py-3 first:pt-0 last:pb-0">
            <Link
              to="/ticker/$symbol"
              params={{ symbol: n.quote.symbol }}
              className="flex items-start justify-between gap-4 no-underline"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-fg">{n.quote.symbol}</span>
                  <SetupChip setup={n.setup} />
                  <ConfidenceMark confidence={n.confidence} />
                  <DateMark date={n.date} />
                  <MarkChip mark={n.mark} />
                </div>
                <p className="mt-1 text-sm text-muted">{n.confidence.sentence}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-mono text-sm tabular-nums text-fg">
                  {n.setup.gainPct == null ? "n/a" : formatPct(n.setup.gainPct, 0)}
                </p>
                <p className="mt-0.5 text-xs text-subtle">
                  room
                  {n.setup.rr != null ? ` · ${n.setup.rr}R` : ""}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}