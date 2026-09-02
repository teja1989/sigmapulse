import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Quote } from "@/lib/market/types";
import { formatMoney } from "@/lib/format";

export function QuoteChart({ quote }: { quote: Quote }) {
  const data = quote.closes.map((close, i) => ({
    i,
    close,
    t: quote.timestamps[i]
      ? new Date(quote.timestamps[i] * 1000).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      : String(i),
  }));
  if (data.length < 2) {
    return <div className="rounded-xl border border-border bg-surface p-6 text-sm text-muted">No chart series.</div>;
  }
  const up = quote.change >= 0;
  return (
    <div className="h-64 rounded-xl border border-border bg-surface p-3">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <XAxis dataKey="t" hide />
          <YAxis domain={["auto", "auto"]} hide />
          <Tooltip
            contentStyle={{
              background: "#111318",
              border: "1px solid #262a32",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(v: number) => formatMoney(v)}
          />
          <Area
            type="monotone"
            dataKey="close"
            stroke={up ? "#3dba7a" : "#e05252"}
            fill={up ? "rgba(61,186,122,0.15)" : "rgba(224,82,82,0.15)"}
            strokeWidth={1.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
