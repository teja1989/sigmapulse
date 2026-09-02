export type ProvenanceKind =
  | "yahoo-delayed"
  | "yahoo-options"
  | "yahoo-news"
  | "derived"
  | "unobserved";

export interface Provenance {
  kind: ProvenanceKind;
  label: string;
  asOf: string | null;
}

export interface Quote {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  price: number;
  prevClose: number;
  change: number;
  changePct: number;
  volume: number | null;
  avgVolume: number | null;
  high52: number | null;
  low52: number | null;
  marketCap: number | null;
  cap: "small" | "mid" | "large" | null;
  marketState: string;
  sparkline: number[];
  closes: number[];
  timestamps: number[];
  provenance: Provenance;
}

export interface OptionContract {
  contractSymbol: string;
  type: "call" | "put";
  strike: number;
  expiration: string;
  last: number | null;
  bid: number | null;
  ask: number | null;
  mid: number | null;
  volume: number;
  openInterest: number;
  iv: number | null;
  inTheMoney: boolean;
  unusualScore: number;
}

export interface OptionSnapshot {
  symbol: string;
  expiration: string | null;
  expirations: string[];
  calls: OptionContract[];
  puts: OptionContract[];
  unusual: OptionContract[];
  atmIv: number | null;
  provenance: Provenance;
}

export interface NewsItem {
  id: string;
  title: string;
  publisher: string;
  url: string;
  publishedAt: string | null;
  related: string[];
  provenance: Provenance;
}

export interface Pillar {
  id: string;
  name: string;
  weight: number;
  score: number | null;
  layman: string;
  detail: string;
  observed: boolean;
}

export type Action = "buy" | "watch" | "wait" | "avoid";

export interface ActionCall {
  action: Action;
  label: string;
  why: string;
  reasons: string[];
}

export interface DeskAudit {
  symbol: string;
  composite: number | null;
  verdict: string;
  call: ActionCall;
  pillars: Pillar[];
  provenanceNotes: string[];
}

export const INDEX_UNIVERSE = ["SPY", "QQQ", "IWM", "DIA"] as const;
export const PULSE_UNIVERSE = [
  "AAPL",
  "MSFT",
  "NVDA",
  "AMZN",
  "META",
  "GOOGL",
  "TSLA",
  "AMD",
  "PLTR",
  "JPM",
  "AVGO",
  "NFLX",
] as const;
