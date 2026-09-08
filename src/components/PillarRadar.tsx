import type { AxisScore, RadarRead } from "@/lib/market/types";
import { cn } from "@/lib/utils";

const ORDER = ["tape", "quiet", "date", "gap"] as const;
const ANGLES = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];
const CX = 120;
const CY = 118;
const R = 78;

function pt(i: number, t: number): string {
  const a = ANGLES[i];
  const x = CX + Math.cos(a) * R * t;
  const y = CY + Math.sin(a) * R * t;
  return `${x.toFixed(1)},${y.toFixed(1)}`;
}

function scoreT(score: number | null): number {
  return 0.14 + 0.86 * Math.max(0, Math.min(100, score ?? 0)) / 100;
}


function labelPos(i: number): { x: number; y: number; anchor: "middle" | "start" | "end" } {
  const a = ANGLES[i];
  const x = CX + Math.cos(a) * (R + 22);
  const y = CY + Math.sin(a) * (R + 18);
  if (i === 0) return { x, y: y + 4, anchor: "middle" };
  if (i === 1) return { x: x + 2, y: y + 4, anchor: "start" };
  if (i === 2) return { x, y: y + 6, anchor: "middle" };
  return { x: x - 2, y: y + 4, anchor: "end" };
}

export function PillarRadar({ radar }: { radar: RadarRead }) {
  const axes = ORDER.map((id) => radar.axes.find((a) => a.id === id)).filter((a): a is AxisScore => Boolean(a));
  const poly = axes.map((a, i) => pt(i, scoreT(a.score))).join(" ");
  const tape = axes[0]?.score ?? 50;
  const hot = tape >= 55;

  return (
    <section className="rounded-xl border border-border bg-surface p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium">The four reads</h2>
        <p className="text-xs text-subtle">Shape moves as the tape does</p>
      </div>
      <div className="mt-3 grid gap-4 md:grid-cols-[minmax(0,240px)_1fr] md:items-center">
        <svg viewBox="0 0 240 240" className="mx-auto h-56 w-56 text-fg" role="img" aria-label={radar.sentence}>
          {[0.25, 0.5, 0.75, 1].map((t) => (
            <polygon
              key={t}
              points={ANGLES.map((_, i) => pt(i, t)).join(" ")}
              fill="none"
              className="stroke-border"
              strokeWidth={1}
            />
          ))}
          {ANGLES.map((_, i) => (
            <line
              key={i}
              x1={CX}
              y1={CY}
              x2={Number(pt(i, 1).split(",")[0])}
              y2={Number(pt(i, 1).split(",")[1])}
              className="stroke-border"
              strokeWidth={1}
            />
          ))}
          <polygon
            points={poly}
            className={hot ? "radar-fill" : "radar-fill-down"}
            strokeWidth={1.8}
          />
          {axes.map((a, i) => {
            const [x, y] = pt(i, scoreT(a.score)).split(",").map(Number);
            return (
              <circle
                key={`d-${a.id}`}
                cx={x}
                cy={y}
                r={3.2}
                className={hot ? "fill-up" : "fill-down"}
              />
            );
          })}
          {axes.map((a, i) => {
            const p = labelPos(i);
            return (
              <text
                key={a.id}
                x={p.x}
                y={p.y}
                textAnchor={p.anchor}
                className="fill-muted"
                fontSize={11}
                fontFamily="IBM Plex Sans, sans-serif"
              >
                {a.label}
              </text>
            );
          })}
        </svg>
        <ol className="space-y-3">
          {axes.map((a) => (
            <li key={a.id}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm text-fg">{a.label}</span>
                <span className="font-mono text-sm tabular-nums text-muted">
                  {a.score == null ? "—" : a.score}
                </span>
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-border">
                <div
                  className={cn("h-full rounded-full bg-accent transition-[width] duration-(--motion-fast)")}
                  style={{ width: `${a.score ?? 0}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-muted">{a.meaning}</p>
            </li>
          ))}
        </ol>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-fg">{radar.sentence}</p>
    </section>
  );
}
