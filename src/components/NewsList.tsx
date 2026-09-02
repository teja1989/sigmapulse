import { shortTime } from "@/lib/format";
import type { NewsItem } from "@/lib/market/types";

export function NewsList({ items, empty = "No headlines from Yahoo Finance." }: { items: NewsItem[]; empty?: string }) {
  if (!items.length) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6 text-sm text-muted">{empty}</div>
    );
  }
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
      {items.map((item) => (
        <li key={item.id}>
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="block px-4 py-3 no-underline hover:bg-surface-2"
          >
            <div className="text-sm text-fg">{item.title}</div>
            <div className="mt-1 flex flex-wrap gap-2 text-xs text-subtle">
              <span>{item.publisher}</span>
              <span>{shortTime(item.publishedAt)}</span>
              {item.related.slice(0, 4).map((t) => (
                <span key={t} className="font-mono text-muted">
                  {t}
                </span>
              ))}
            </div>
          </a>
        </li>
      ))}
    </ul>
  );
}
