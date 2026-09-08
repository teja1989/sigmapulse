import type { CorrelateRow, Quote } from "./types";

function dayKey(ts: number): string {
  return new Date(ts * 1000).toISOString().slice(0, 10);
}

function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function pearson(a: number[], b: number[]): number | null {
  const n = Math.min(a.length, b.length);
  if (n < 10) return null;
  const x = a.slice(-n);
  const y = b.slice(-n);
  const mx = mean(x);
  const my = mean(y);
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const da = x[i] - mx;
    const db = y[i] - my;
    num += da * db;
    dx += da * da;
    dy += db * db;
  }
  if (dx <= 0 || dy <= 0) return null;
  return num / Math.sqrt(dx * dy);
}

export function alignedReturns(a: Quote, b: Quote): { ra: number[]; rb: number[] } {
  const mapB = new Map<string, number>();
  for (let i = 0; i < b.timestamps.length; i++) {
    const px = b.closes[i];
    if (px > 0) mapB.set(dayKey(b.timestamps[i]), px);
  }
  const ra: number[] = [];
  const rb: number[] = [];
  let prevA: number | null = null;
  let prevB: number | null = null;
  for (let i = 0; i < a.timestamps.length; i++) {
    const ca = a.closes[i];
    const cb = mapB.get(dayKey(a.timestamps[i]));
    if (!(ca > 0) || cb == null || !(cb > 0)) continue;
    if (prevA != null && prevB != null && prevA > 0 && prevB > 0) {
      ra.push(Math.log(ca / prevA));
      rb.push(Math.log(cb / prevB));
    }
    prevA = ca;
    prevB = cb;
  }
  return { ra, rb };
}

export function corrMeaning(corr: number): string {
  const a = Math.abs(corr);
  if (a >= 0.75) return corr > 0 ? "Usually moves together" : "Usually moves opposite";
  if (a >= 0.45) return corr > 0 ? "Often moves with it" : "Often moves against it";
  return "Goes its own way";
}

export function correlate(quote: Quote, peers: Quote[]): CorrelateRow[] {
  const rows: CorrelateRow[] = [];
  for (const peer of peers) {
    if (peer.symbol === quote.symbol) continue;
    const { ra, rb } = alignedReturns(quote, peer);
    const corr = pearson(ra, rb);
    rows.push({
      symbol: peer.symbol,
      name: peer.name,
      corr: corr == null ? null : Number(corr.toFixed(2)),
      changePct: peer.changePct,
      meaning: corr == null ? "Not enough overlapping days." : corrMeaning(corr),
    });
  }
  rows.sort((a, b) => Math.abs(b.corr ?? 0) - Math.abs(a.corr ?? 0));
  return rows;
}
