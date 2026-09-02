import type { DeskAudit } from "@/lib/market/types";
import { cn } from "@/lib/utils";

export function PillarBoard({ desk }: { desk: DeskAudit | null }) {
  if (!desk) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6 text-sm text-muted">
        Desk audit needs a delayed quote.
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="text-xs uppercase tracking-[0.16em] text-subtle">Composite (observed only)</div>
        <div className="mt-2 flex flex-wrap items-end gap-4">
          <div className="font-mono text-4xl tabular-nums text-fg">
            {desk.composite == null ? "—" : desk.composite}
          </div>
          <p className="max-w-xl text-sm text-muted">{desk.verdict}</p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {desk.pillars.map((p) => (
          <article key={p.id} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-medium text-fg">{p.name}</h3>
              <span
                className={cn(
                  "font-mono text-lg tabular-nums",
                  p.observed ? "text-fg" : "text-subtle",
                )}
              >
                {p.score == null ? "—" : p.score}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted">{p.layman}</p>
            <p className="mt-2 text-xs text-subtle">{p.detail}</p>
          </article>
        ))}
      </div>
      <ul className="space-y-1 text-xs text-subtle">
        {desk.provenanceNotes.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
    </div>
  );
}
