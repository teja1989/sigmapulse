import type { DeskAudit } from "@/lib/market/types";
import { CallReason } from "./CallReason";
import { SignalChip } from "./SignalChip";

export function PillarBoard({ desk }: { desk: DeskAudit | null }) {
  if (!desk) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6 text-sm text-muted">
        Need a quote to make a call.
      </div>
    );
  }
  const shown = desk.pillars.filter((p) => p.observed);
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-start gap-4">
          <SignalChip call={desk.call} size="lg" />
          <CallReason call={desk.call} />
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {shown.map((p) => (
          <article key={p.id} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-medium text-fg">{p.name}</h3>
              <span className="font-mono text-lg tabular-nums text-fg">
                {p.score == null ? "—" : p.score}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted">{p.layman}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
