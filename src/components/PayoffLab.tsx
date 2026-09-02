import { useMemo, useState } from "react";
import { Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { calculateBlackScholes } from "@/lib/quant/blackScholes";
import { formatMoney } from "@/lib/format";
import type { Quote } from "@/lib/market/types";

type Structure = "long-call" | "bull-call" | "long-put";

export function PayoffLab({ quote, iv }: { quote: Quote; iv: number | null }) {
  const [kind, setKind] = useState<Structure>("long-call");
  const [dte, setDte] = useState(30);
  const sigma = iv && iv > 0.03 ? iv : 0.3;
  const S = quote.price;
  const k1 = Math.round(S);
  const k2 = Math.round(S * 1.05);
  const T = Math.max(dte, 1) / 365;

  const model = useMemo(() => {
    const longCall = calculateBlackScholes("call", S, k1, T, 0.045, sigma);
    const shortCall = calculateBlackScholes("call", S, k2, T, 0.045, sigma);
    const longPut = calculateBlackScholes("put", S, k1, T, 0.045, sigma);
    const debit =
      kind === "long-call"
        ? longCall.theoreticalPrice
        : kind === "long-put"
          ? longPut.theoreticalPrice
          : Math.max(0.01, longCall.theoreticalPrice - shortCall.theoreticalPrice);
    const points = [];
    const lo = S * 0.8;
    const hi = S * 1.2;
    for (let i = 0; i <= 40; i++) {
      const spot = lo + ((hi - lo) * i) / 40;
      let payoff = 0;
      if (kind === "long-call") payoff = Math.max(0, spot - k1) - debit;
      else if (kind === "long-put") payoff = Math.max(0, k1 - spot) - debit;
      else payoff = Math.max(0, spot - k1) - Math.max(0, spot - k2) - debit;
      points.push({ spot: Number(spot.toFixed(2)), pnl: Number((payoff * 100).toFixed(2)) });
    }
    const greeks = kind === "long-put" ? longPut.greeks : longCall.greeks;
    return { debit, points, greeks, k1, k2 };
  }, [S, T, kind, k1, k2, sigma]);

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-fg">Payoff lab</h2>
          <p className="text-xs text-subtle">Spot delayed. One contract = 100 shares.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["long-call", "bull-call", "long-put"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={
                kind === k
                  ? "h-8 rounded-md bg-accent px-2.5 text-xs text-bg"
                  : "h-8 rounded-md border border-border px-2.5 text-xs text-muted"
              }
            >
              {k.replace("-", " ")}
            </button>
          ))}
        </div>
      </div>
      <label className="mt-4 flex items-center gap-3 text-xs text-muted">
        DTE
        <input
          type="range"
          min={7}
          max={90}
          value={dte}
          onChange={(e) => setDte(Number(e.target.value))}
          className="w-40"
        />
        <span className="font-mono tabular-nums text-fg">{dte}</span>
      </label>
      <div className="mt-3 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={model.points}>
            <XAxis dataKey="spot" tick={{ fill: "#8b909a", fontSize: 11 }} />
            <YAxis tick={{ fill: "#8b909a", fontSize: 11 }} />
            <ReferenceLine y={0} stroke="#262a32" />
            <Tooltip
              contentStyle={{ background: "#111318", border: "1px solid #262a32", fontSize: 12 }}
              formatter={(v: number) => [`$${v.toFixed(0)} / contract`, "P&L"]}
            />
            <Line type="monotone" dataKey="pnl" stroke="#d6dbe3" dot={false} strokeWidth={1.6} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
        <div>
          <dt className="text-subtle">Net debit / share</dt>
          <dd className="font-mono tabular-nums">{formatMoney(model.debit)}</dd>
        </div>
        <div>
          <dt className="text-subtle">Delta</dt>
          <dd className="font-mono tabular-nums">{model.greeks.delta.toFixed(3)}</dd>
        </div>
        <div>
          <dt className="text-subtle">Theta / day</dt>
          <dd className="font-mono tabular-nums">{model.greeks.theta.toFixed(3)}</dd>
        </div>
        <div>
          <dt className="text-subtle">Vega / 1% IV</dt>
          <dd className="font-mono tabular-nums">{model.greeks.vega.toFixed(3)}</dd>
        </div>
      </dl>
    </div>
  );
}
