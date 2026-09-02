import { cn } from "@/lib/utils";
import { formatMoney, formatPct } from "@/lib/format";

export function SignedPct({ value }: { value: number | null | undefined }) {
  const n = value ?? 0;
  const up = n > 0;
  const down = n < 0;
  return (
    <span
      className={cn(
        "font-mono tabular-nums",
        up && "text-up",
        down && "text-down",
        !up && !down && "text-muted",
      )}
    >
      {formatPct(value)}
    </span>
  );
}

export function SignedMoney({ value }: { value: number | null | undefined }) {
  const n = value ?? 0;
  return (
    <span
      className={cn(
        "font-mono tabular-nums",
        n > 0 && "text-up",
        n < 0 && "text-down",
        n === 0 && "text-muted",
      )}
    >
      {n > 0 ? "+" : ""}
      {formatMoney(value)}
    </span>
  );
}
