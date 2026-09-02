import { createFileRoute } from "@tanstack/react-router";
import { CatalystQueue } from "@/components/CatalystQueue";
import { IndexTape } from "@/components/IndexTape";
import { JumpBoard } from "@/components/JumpBoard";
import { MissingBits } from "@/components/MissingBits";
import { PulseBoard } from "@/components/PulseBoard";
import { SectorMenu } from "@/components/SectorMenu";
import { loadPulse } from "@/lib/market/api";
import { getSector, isCapSize, isSectorId } from "@/lib/market/sectors";

type Search = { sector?: string; cap?: string };

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>): Search => {
    const out: Search = {};
    if (isSectorId(s.sector) && s.sector !== "tape") out.sector = s.sector;
    if (isCapSize(s.cap)) out.cap = s.cap;
    return out;
  },
  loaderDeps: ({ search }) => ({
    sector: search.sector,
    cap: search.cap,
  }),
  loader: ({ deps }) => loadPulse({ data: { sector: deps.sector, cap: deps.cap } }),
  pendingMs: 8_000,
  component: Home,
});

function Home() {
  const data = Route.useLoaderData();
  const sector = getSector(data.sector);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl tracking-tight">{sector.label}</h1>
        <p className="mt-1 text-sm text-muted">{data.blurb}</p>
      </div>
      <SectorMenu counts={data.counts} />
      <IndexTape quotes={data.indexes} />
      <JumpBoard names={data.names} />
      <PulseBoard names={data.names} showCap={data.sector !== "tape"} />
      {data.sector !== "tape" && (
        <CatalystQueue title={data.queueTitle} items={data.queue} news={data.news} />
      )}
      <MissingBits />
    </div>
  );
}
