import { Link } from "@tanstack/react-router";
import { formatPct } from "@/lib/format";
import type { PulseName } from "@/lib/market/api";
import { isJump } from "@/lib/market/setup";
import { SetupChip } from "./PotentialCard";

export function pickJumps(names: PulseName[]): PulseName[] {
  return names
    .filter((n) => isJump(n.setup))
    .sort((a, b) => (b.setup.rr ?? 0) - (a.setup.rr ?? 0) || (b.setup.gainPct ?? 0) - (a.setup.gainPct ?? 0))
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
        Coil is quiet range with room. Lag is behind the index. Room is distance to the 52-week high, not a target.
      </p>
      <ul className="mt-4 divide-y divide-border">
        {jumps.map((n) => (
          <li key={n.quote.symbol} className="py-3 first:pt-0 last:pb-0">
            <Link
              to="/ticker/$symbol"
              params={{ symbol: n.quote.symbol }}
              className="flex flex-wrap items-start justify-between gap-3 no-underline"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-fg">{n.quote.symbol}</span>
                  <SetupChip setup={n.setup} />
                </div>
                <p className="mt-1 max-w-xl text-sm text-muted">{n.setup.why}</p>
              </div>
              <dl className="grid grid-cols-3 gap-3 text-right text-xs">
                <div>
                  <dt className="text-subtle">Room</dt>
                  <dd className="font-mono text-sm text-fg">
                    {n.setup.gainPct == null ? "n/a" : formatPct(n.setup.gainPct, 0)}
                  </dd>
                </div>
                <div>
                  <dt className="text-subtle">Risk</dt>
                  <dd className="font-mono text-sm text-fg">
                    {n.setup.riskPct == null ? "n/a" : formatPct(n.setup.riskPct, 1)}
                  </dd>
                </div>
                <div>
                  <dt className="text-subtle">R : R</dt>
                  <dd className="font-mono text-sm text-fg">{n.setup.rr == null ? "n/a" : `${n.setup.rr}R`}</dd>
                </div>
              </dl>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
