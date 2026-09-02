import { createFileRoute } from "@tanstack/react-router";
import { IndexTape } from "@/components/IndexTape";
import { PulseBoard } from "@/components/PulseBoard";
import { loadPulse } from "@/lib/market/api";

export const Route = createFileRoute("/")({
  loader: () => loadPulse(),
  component: Home,
});

function Home() {
  const data = Route.useLoaderData();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl tracking-tight">Pulse</h1>
        <p className="mt-1 text-sm text-muted">Buy, watch, wait, or avoid — one call per name.</p>
      </div>
      <IndexTape quotes={data.indexes} />
      <PulseBoard names={data.names} />
    </div>
  );
}
