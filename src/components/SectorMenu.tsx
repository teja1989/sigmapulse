import { Link } from "@tanstack/react-router";
import { SECTOR_MENU, SECTORS, type CapSize, type SectorId } from "@/lib/market/sectors";
import { cn } from "@/lib/utils";

export function SectorMenu({
  sector,
  cap,
  counts,
}: {
  sector: SectorId;
  cap: CapSize | "all";
  counts: { all: number; small: number; mid: number; large: number };
}) {
  return (
    <div className="space-y-2">
      <div className="flex gap-1 overflow-x-auto pb-1">
        {SECTOR_MENU.map((id) => (
          <Link
            key={id}
            to="/"
            search={id === "tape" ? {} : { sector: id }}
            className={cn(
              "inline-flex h-11 shrink-0 items-center rounded-md px-3 text-sm no-underline",
              sector === id ? "bg-accent text-bg" : "border border-border text-muted",
            )}
          >
            {SECTORS[id].label}
          </Link>
        ))}
      </div>
      {sector !== "tape" && (
        <div className="flex gap-1 overflow-x-auto">
          {(
            [
              ["all", "All", counts.all],
              ["small", "Small", counts.small],
              ["mid", "Mid", counts.mid],
              ["large", "Large", counts.large],
            ] as const
          ).map(([id, label, n]) => (
            <Link
              key={id}
              to="/"
              search={id === "all" ? { sector } : { sector, cap: id }}
              className={cn(
                "inline-flex h-11 shrink-0 items-center gap-2 rounded-md px-3 text-sm no-underline",
                cap === id ? "bg-surface-2 text-fg" : "border border-border text-muted",
              )}
            >
              <span>{label}</span>
              <span className="font-mono text-xs text-subtle">{n}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
