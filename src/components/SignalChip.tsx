import type { ActionCall } from "@/lib/market/types";
import { cn } from "@/lib/utils";

const TONE: Record<ActionCall["action"], string> = {
  buy: "border-up/40 bg-up/10 text-up",
  watch: "border-border bg-surface-2 text-fg",
  wait: "border-border bg-surface text-muted",
  avoid: "border-down/40 bg-down/10 text-down",
};

export function SignalChip({
  call,
  size = "md",
}: {
  call: ActionCall;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-md border font-medium uppercase tracking-wide",
        TONE[call.action],
        size === "sm" && "h-7 min-w-16 px-2 text-xs",
        size === "md" && "h-8 min-w-[4.5rem] px-2.5 text-xs",
        size === "lg" && "h-11 min-w-24 px-4 text-sm",
      )}
    >
      {call.label}
    </span>
  );
}
