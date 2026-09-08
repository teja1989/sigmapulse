import { useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { HouseMark } from "@/lib/market/book";
import type { LivePrint, Quote } from "@/lib/market/types";
import { etYmd } from "@/lib/market/calendar";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export function QuoteChart({
  quote,
  live,
  marks = [],
}: {
  quote: Quote;
  live?: LivePrint | null;
  marks?: HouseMark[];
}) {
  const hasToday = Boolean(live && live.sparkline.length > 2);
  const [range, setRange] = useState<"today" | "6m">(hasToday ? "today" : "6m");
  const today = range === "today" && hasToday;
  const stampAt = new Map<string, { kind: "entry" | "exit"; tone: string }>();
  for (const m of marks) {
    stampAt.set(m.sessionDate, { kind: "entry", tone: "var(--color-accent)" });
    if (m.closeSessionDate) {
      stampAt.set(m.closeSessionDate, {
        kind: "exit",
        tone: m.outcome === "paid" ? "var(--color-up)" : m.outcome === "failed" ? "var(--color-down)" : "var(--color-muted)",
      });
    }
  }
  const series = today
    ? live!.sparkline.map((close, i) => ({
        i,
        close,
        t: live!.timestamps[i]
          ? new Date(live!.timestamps[i] * 1000).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              timeZone: "America/New_York",
            })
          : String(i),
        stamp: undefined as string | undefined,
      }))
    : quote.closes.map((close, i) => {
        const ymd = quote.timestamps[i] ? etYmd(new Date(quote.timestamps[i] * 1000)) : "";
        const stamp = stampAt.get(ymd);
        return {
          i,
          close,
          t: quote.timestamps[i]
            ? new Date(quote.timestamps[i] * 1000).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            : String(i),
          stamp: stamp?.kind,
          stampTone: stamp?.tone,
        };
      });
  if (series.length < 2) {
    return <div className="rounded-xl border border-border bg-surface p-6 text-sm text-muted">No chart series.</div>;
  }
  const up = (today ? (live?.changePct ?? quote.changePct) : quote.changePct) >= 0;
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <div className="mb-2 flex gap-1 px-1">
        {hasToday && (
          <button
            type="button"
            onClick={() => setRange("today")}
            className={cn(
              "h-8 rounded-md px-3 text-xs",
              range === "today" ? "bg-surface-2 text-fg" : "text-muted",
            )}
          >
            Today
          </button>
        )}
        <button
          type="button"
          onClick={() => setRange("6m")}
          className={cn(
            "h-8 rounded-md px-3 text-xs",
            range === "6m" ? "bg-surface-2 text-fg" : "text-muted",
          )}
        >
          6 months
        </button>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series}>
            <XAxis dataKey="t" hide />
            <YAxis domain={["auto", "auto"]} hide />
            <Tooltip
              contentStyle={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(v: number) => formatMoney(v)}
            />
            <Area
              type="monotone"
              dataKey="close"
              stroke={up ? "var(--color-up)" : "var(--color-down)"}
              fill={up ? "color-mix(in oklab, var(--color-up) 18%, transparent)" : "color-mix(in oklab, var(--color-down) 18%, transparent)"}
              strokeWidth={1.5}
              dot={(props: {
                cx?: number;
                cy?: number;
                index?: number;
                payload?: { stamp?: string; stampTone?: string };
              }) => {
                const { cx, cy, payload, index } = props;
                if (cx == null || cy == null || !payload?.stamp) {
                  return <g key={`d-${index ?? 0}`} />;
                }
                return (
                  <circle
                    key={`d-${index ?? 0}`}
                    cx={cx}
                    cy={cy}
                    r={payload.stamp === "exit" ? 4.5 : 3.5}
                    fill={payload.stampTone ?? "var(--color-accent)"}
                    stroke="var(--color-bg)"
                    strokeWidth={1}
                  />
                );
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}