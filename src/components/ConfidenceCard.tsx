import { Check, Minus } from "lucide-react";
import type { ConfidenceRead, RsiMood } from "@/lib/market/types";
import { cn } from "@/lib/utils";

const RSI_TONE: Record<RsiMood, string> = {
  healthy: "border-up/40 bg-up/10 text-up",
  tired: "border-down/40 bg-down/10 text-down",
  washed: "border-warn/40 bg-warn/10 text-warn",
  soft: "border-border bg-surface-2 text-muted",
};

export function ConfidenceCard({ confidence }: { confidence: ConfidenceRead }) {
  const mood = confidence.rsi.mood;
  return (
    <section className="rounded-xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-subtle">Confidence</p>
          <p className="mt-1 font-display text-4xl tabular-nums tracking-tight leading-none">{confidence.score}</p>
          <p className="mt-2 text-sm text-muted">
            {confidence.agreed} of {confidence.of} agree
          </p>
        </div>
        <span
          className={cn(
            "inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium uppercase tracking-wide",
            mood ? RSI_TONE[mood] : "border-border text-muted",
          )}
        >
          RSI {confidence.rsi.label}
        </span>
      </div>
      <ul className="mt-4 list-none space-y-2 p-0">
        {confidence.votes.map((v) => (
          <li key={v.id} className="flex items-start gap-2">
            <span
              className={cn(
                "mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full",
                v.yes ? "bg-up/15 text-up" : "bg-surface-2 text-subtle",
              )}
              aria-hidden
            >
              {v.yes ? <Check className="size-3" strokeWidth={2.5} /> : <Minus className="size-3" strokeWidth={2.5} />}
            </span>
            <div className="min-w-0">
              <p className={cn("text-sm", v.yes ? "text-fg" : "text-muted")}>{v.label}</p>
              <p className="text-xs text-subtle">{v.detail}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm leading-relaxed text-fg">{confidence.sentence}</p>
      <p className="mt-2 text-xs text-subtle">{confidence.history.sentence}</p>
    </section>
  );
}

export function ConfidenceMark({ confidence }: { confidence: ConfidenceRead }) {
  return (
    <span className="font-mono text-xs tabular-nums text-muted">
      {confidence.score}
      <span className="text-subtle">
        {" "}
        · {confidence.agreed}/{confidence.of}
      </span>
    </span>
  );
}
