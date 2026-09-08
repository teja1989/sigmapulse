import { ema, realizedVol, rsi14 } from "./pillars.ts";
import type { Potential } from "./setup.ts";
import type { CoilHistory, ConfidenceRead, ConfidenceVote, Quote, RsiMood } from "./types.ts";

const FWD = 10;
const COIL_RATIO = 0.65;
const RSI_TIRED = 70;
const RSI_WASHED = 30;
const RSI_HEALTHY_LO = 40;
const RSI_HEALTHY_HI = 68;

export function rsiMood(rsi: number): RsiMood {
  if (rsi >= RSI_TIRED) return "tired";
  if (rsi <= RSI_WASHED) return "washed";
  if (rsi >= RSI_HEALTHY_LO && rsi <= RSI_HEALTHY_HI) return "healthy";
  return "soft";
}

export function rsiMoodLabel(mood: RsiMood): string {
  if (mood === "tired") return "Tired";
  if (mood === "washed") return "Washed";
  if (mood === "healthy") return "Healthy";
  return "Soft";
}

function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function retN(closes: number[], n: number): number | null {
  if (closes.length < n + 1) return null;
  const last = closes[closes.length - 1];
  const prev = closes[closes.length - 1 - n];
  if (!last || !prev || prev <= 0) return null;
  return ((last - prev) / prev) * 100;
}

export function isCompressed(closes: number[]): boolean {
  const rv10 = realizedVol(closes, 10);
  const rv40 = realizedVol(closes, 40);
  return rv10 != null && rv40 != null && rv40 > 0 && rv10 < rv40 * COIL_RATIO;
}

function rsiSlope(closes: number[]): "lifting" | "fading" | "flat" {
  if (closes.length < 22) return "flat";
  const now = rsi14(closes);
  const then = rsi14(closes.slice(0, -5));
  if (now == null || then == null) return "flat";
  if (now - then >= 6) return "lifting";
  if (then - now >= 6) return "fading";
  return "flat";
}

function signedPct(n: number): string {
  const v = n.toFixed(1);
  return n > 0 ? `+${v}%` : `${v}%`;
}

export function coilHistory(closes: number[], fwd = FWD): CoilHistory {
  const fwds: number[] = [];
  const start = 45;
  const end = closes.length - 1 - fwd;
  let i = start;
  while (i <= end) {
    const slice = closes.slice(0, i + 1);
    if (isCompressed(slice)) {
      const now = closes[i];
      const later = closes[i + fwd];
      if (now > 0 && later > 0) fwds.push(((later - now) / now) * 100);
      i += fwd;
    } else {
      i += 1;
    }
  }
  const hits = fwds.filter((x) => x > 1).length;
  const fails = fwds.filter((x) => x < 0);
  const samples = fwds.length;
  const hitRate = samples ? Number(((hits / samples) * 100).toFixed(0)) : null;
  const medianFwd = median(fwds);
  const failMedian = median(fails);
  let sentence: string;
  if (samples === 0) {
    sentence = "No past coils in this window — no hit rate yet.";
  } else if (samples < 3) {
    sentence = `Only ${samples} past coil${samples === 1 ? "" : "s"} in this window. Too few to trust a hit rate.`;
  } else {
    const failBit =
      failMedian != null ? ` When it failed, median ${signedPct(failMedian)}.` : "";
    sentence = `${hits} of ${samples} past coils paid. Median ${signedPct(medianFwd ?? 0)} in 10 days.${failBit}`;
  }
  return {
    samples,
    hits,
    hitRate,
    medianFwd: medianFwd == null ? null : Number(medianFwd.toFixed(1)),
    failMedian: failMedian == null ? null : Number(failMedian.toFixed(1)),
    sentence,
  };
}

function groupMoved(quote: Quote, peers: Quote[]): boolean {
  const name20 = retN(quote.closes, 20);
  if (name20 == null || !peers.length) return false;
  const peerRets = peers
    .map((p) => retN(p.closes, 20))
    .filter((x): x is number => x != null);
  if (!peerRets.length) return false;
  const peerMed = median(peerRets);
  if (peerMed == null) return false;
  return peerMed - name20 >= 4;
}

function vote(id: ConfidenceVote["id"], yes: boolean, label: string, detail: string): ConfidenceVote {
  return { id, yes, label, detail };
}

export function scoreConfidence(
  quote: Quote,
  setup: Potential,
  index?: Quote | null,
  peers: Quote[] = [],
): ConfidenceRead {
  const rsi = rsi14(quote.closes);
  const e20 = ema(quote.closes, 20);
  const e50 = ema(quote.closes, 50);
  const history = coilHistory(quote.closes);
  const mood = rsi == null ? null : rsiMood(rsi);
  const slope = rsiSlope(quote.closes);
  const up = e20 != null && e50 != null && e20 > e50;
  const down = e20 != null && e50 != null && e20 < e50 * 0.995;
  const coiled = isCompressed(quote.closes);
  const lagging = setup.kind === "lag" || groupMoved(quote, peers.length ? peers : index ? [index] : []);

  const rsiLabel = mood == null ? "RSI n/a" : rsiMoodLabel(mood);
  let rsiDetail: string;
  if (rsi == null || mood == null) {
    rsiDetail = "Not enough history for RSI.";
  } else if (mood === "tired") {
    rsiDetail = `RSI ${rsi.toFixed(0)} — tired. Don't chase.`;
  } else if (mood === "washed" && slope === "lifting") {
    rsiDetail = `RSI ${rsi.toFixed(0)} — washed, but lifting. Wait for a hold of the 20-day.`;
  } else if (mood === "washed") {
    rsiDetail = `RSI ${rsi.toFixed(0)} — washed. Wait for a hold.`;
  } else if (mood === "healthy" && slope === "lifting") {
    rsiDetail = `RSI ${rsi.toFixed(0)} — healthy and lifting.`;
  } else if (mood === "healthy") {
    rsiDetail = `RSI ${rsi.toFixed(0)} — healthy, not tired.`;
  } else {
    rsiDetail = `RSI ${rsi.toFixed(0)} — ${mood}. Not a clean read.`;
  }

  const votes: ConfidenceVote[] = [
    vote(
      "trend",
      up,
      up ? "Trend is up" : down ? "Trend is down" : "No trend",
      e20 == null || e50 == null
        ? "Need about 50 sessions for a 20/50-day trend."
        : up
          ? "20-day average is above the 50-day."
          : down
            ? "20-day average is below the 50-day."
            : "20-day and 50-day averages are flat.",
    ),
    vote(
      "rsi",
      mood === "healthy",
      mood === "healthy" ? "RSI is healthy" : mood === "tired" ? "RSI is tired" : mood === "washed" ? "RSI is washed" : "RSI is not clean",
      rsiDetail,
    ),
    vote(
      "quiet",
      coiled || lagging,
      coiled ? "Range is quiet" : lagging ? "Group already moved" : "Not coiled",
      coiled
        ? "10-day range is quieter than the 40-day — energy is stored."
        : lagging
          ? "Peers already ran. This name is still behind."
          : "No coil, and the group isn't leaving this name behind.",
    ),
    vote(
      "history",
      history.samples >= 3 && (history.hitRate ?? 0) >= 50,
      history.samples >= 3 ? `${history.hits} of ${history.samples} coils paid` : "No hit rate yet",
      history.sentence,
    ),
  ];

  const agreed = votes.filter((v) => v.yes).length;
  let score = Math.round((agreed / votes.length) * 100);
  if (mood === "tired") score = Math.min(score, 50);
  if (down) score = Math.min(score, 45);

  let sentence: string;
  if (mood === "tired" && up) {
    sentence = `The current is right. The move is tired. Wait. ${history.sentence}`;
  } else if (mood === "washed" && down) {
    sentence = `Washed, not a Buy. Wait for a hold of the 20-day. ${history.sentence}`;
  } else if (agreed === 4) {
    sentence =
      "Trend is up, it isn't tired, the range is quiet, and last times this coil paid. That's a jump, not a chase.";
  } else if (agreed === 0) {
    sentence = `None of the four agree. Stand aside. ${history.sentence}`;
  } else {
    const missing = votes.filter((v) => !v.yes).map((v) => v.label.toLowerCase());
    sentence = `${agreed} of 4 agree. Missing: ${missing.join(", ")}.`;
  }

  return {
    score,
    agreed,
    of: votes.length,
    rsi: { value: rsi == null ? null : Number(rsi.toFixed(0)), mood, label: rsiLabel },
    history,
    votes,
    sentence,
  };
}
