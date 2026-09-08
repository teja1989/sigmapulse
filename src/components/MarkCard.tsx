import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { stampTicker } from "@/lib/market/book-api";
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

export function MarkCard({
  symbol,
  marks,
}: {
  symbol: string;
  marks: HouseMark[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const open = marks.find((m) => m.status === "open");
  const last = marks.find((m) => m.status === "closed") ?? open;

  async function onStamp() {
    setBusy(true);
    setMsg(null);
    const res = await stampTicker({ data: { symbol } });
    setBusy(false);
    if (res.error) {
      setMsg(res.error);
      return;
    }
    setMsg(res.created ? "On the book." : "Already stamped today.");
    await router.invalidate();
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-subtle">The book</p>
          <p className="mt-1 font-display text-2xl tracking-tight">
            {open ? `Open ${open.stance}` : last ? `Last ${last.outcome}` : "No stamp yet"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void onStamp()}
          disabled={busy}
          className="inline-flex h-11 items-center rounded-md border border-border bg-surface-2 px-4 text-sm font-medium text-fg transition-transform duration-(--motion-quick) active:scale-[0.98] disabled:opacity-50"
        >
          {busy ? "Stamping…" : "Stamp this call"}
        </button>
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
      <p className="mt-3 text-sm leading-relaxed text-fg">{(open ?? last)?.sentence ?? "Stamp a call to write the exit now, not later."}</p>
      {msg && <p className="mt-2 text-xs text-subtle">{msg}</p>}
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
