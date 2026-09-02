import { Link } from "@tanstack/react-router";
import { NewsList } from "./NewsList";
import { capLabel } from "@/lib/format";
import type { SectorQueueItem } from "@/lib/market/api";
import type { NewsItem } from "@/lib/market/types";

export function CatalystQueue({
  title,
  items,
  news,
}: {
  title: string;
  items: SectorQueueItem[];
  news: NewsItem[];
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-medium">{title}</h2>
        <p className="mt-1 text-xs text-subtle">Desk notes plus delayed headlines. Not an official calendar.</p>
      </div>
      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
        {items.map((item) => (
          <li key={item.symbol}>
            <Link
              to="/ticker/$symbol"
              params={{ symbol: item.symbol }}
              className="block px-4 py-3 no-underline hover:bg-surface-2"
            >
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-mono text-sm text-fg">{item.symbol}</span>
                <span className="text-xs uppercase tracking-wide text-subtle">{item.tag}</span>
                <span className="text-xs text-muted">{capLabel(item.cap)}</span>
              </div>
              <p className="mt-1 text-sm text-muted">{item.watch}</p>
            </Link>
          </li>
        ))}
      </ul>
      <NewsList items={news.slice(0, 8)} empty="No matching headlines." />
    </section>
  );
}
