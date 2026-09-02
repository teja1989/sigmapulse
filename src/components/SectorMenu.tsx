import { Link, useRouterState } from "@tanstack/react-router";
import { SECTOR_MENU, SECTORS, isCapSize, isSectorId, type CapSize, type SectorId } from "@/lib/market/sectors";
import { cn } from "@/lib/utils";

export function SectorMenu({
  counts,
}: {
  counts: { all: number; small: number; mid: number; large: number };
}) {
  const pending = useRouterState({ select: (s) => s.isLoading });
  const search = useRouterState({ select: (s) => s.location.search as { sector?: string; cap?: string } });
  const sector: SectorId = isSectorId(search.sector) ? search.sector : "tape";
  const cap: CapSize | "all" = isCapSize(search.cap) ? search.cap : "all";

  return (
    <div className="space-y-2">
      <div className="flex gap-1 overflow-x-auto pb-1">
        {SECTOR_MENU.map((id) => {
          const active = sector === id;
          return (
            <Link
              key={id}
              to="/"
              search={id === "tape" ? {} : { sector: id }}
              resetScroll={false}
              className={cn(
                "inline-flex h-11 shrink-0 items-center gap-2 rounded-md px-3 text-sm no-underline transition-colors duration-(--motion-quick) active:scale-[0.96]",
                active ? "bg-accent text-bg" : "border border-border text-muted",
              )}
            >
              {active && pending && (
                <span className="desk-spin inline-block size-3 rounded-full border-2 border-bg/30 border-t-bg" />
              )}
              {SECTORS[id].label}
            </Link>
          );
        })}
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
              resetScroll={false}
              className={cn(
                "inline-flex h-11 shrink-0 items-center gap-2 rounded-md px-3 text-sm no-underline transition-colors duration-(--motion-quick) active:scale-[0.96]",
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
