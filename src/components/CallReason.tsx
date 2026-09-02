import type { ActionCall } from "@/lib/market/types";
import { cn } from "@/lib/utils";

export function CallReason({
  call,
  compact = false,
}: {
  call: ActionCall;
  compact?: boolean;
}) {
  const reasons = call.reasons ?? [];
  return (
    <div>
      <p className={cn(compact ? "text-sm text-fg" : "text-sm text-muted")}>{call.why}</p>
      {reasons.length > 0 && (
        <ul className={cn("mt-1 space-y-0.5", compact ? "text-xs text-muted" : "mt-2 space-y-1 text-sm text-muted")}>
          {reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
