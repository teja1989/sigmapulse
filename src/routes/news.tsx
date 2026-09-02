import { createFileRoute } from "@tanstack/react-router";
import { NewsList } from "@/components/NewsList";
import { loadNews } from "@/lib/market/api";

export const Route = createFileRoute("/news")({
  loader: () => loadNews({ data: { q: "US stocks earnings options" } }),
  component: NewsPage,
});

function NewsPage() {
  const items = Route.useLoaderData();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl tracking-tight">News</h1>
        <p className="mt-1 text-sm text-muted">Latest headlines.</p>
      </div>
      <NewsList items={items} />
    </div>
  );
}
