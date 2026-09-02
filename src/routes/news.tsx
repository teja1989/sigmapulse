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
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Yahoo Finance search headlines. Sentiment is not scored. Open the source for the story.
        </p>
      </div>
      <NewsList items={items} />
    </div>
  );
}
