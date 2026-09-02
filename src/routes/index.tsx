import { createFileRoute } from "@tanstack/react-router";
import { IndexTape } from "@/components/IndexTape";
import { NewsList } from "@/components/NewsList";
import { PulseBoard } from "@/components/PulseBoard";
import { loadPulse } from "@/lib/market/api";
import { shortTime } from "@/lib/format";

export const Route = createFileRoute("/")({
  loader: () => loadPulse(),
  component: Home,
});

function Home() {
  const data = Route.useLoaderData();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl tracking-tight">Pulse</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Delayed Yahoo Finance last prints for the house universe. Not a live NBBO.
          </p>
        </div>
        <div className="text-xs text-subtle">As of {shortTime(data.asOf)} ET</div>
      </div>
      <IndexTape quotes={data.indexes} />
      <PulseBoard quotes={data.names} />
      <section className="space-y-3">
        <h2 className="text-sm font-medium">Tape notes</h2>
        <NewsList items={data.news.slice(0, 8)} />
      </section>
    </div>
  );
}
