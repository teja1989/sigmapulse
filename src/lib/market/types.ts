export type ProvenanceKind =
  | "yahoo-delayed"
  | "yahoo-options"
  | "yahoo-news"
  | "nasdaq-calendar"
  | "fda-rss"
  | "news-date"
  | "derived"
  | "unobserved";

export interface Provenance {
  kind: ProvenanceKind;
  label: string;
  asOf: string | null;
}

export type Session = "pre" | "open" | "post" | "closed";

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

export interface LivePrint {
  symbol: string;
  price: number;
  prevClose: number;
  change: number;
  changePct: number;
  asOf: string;
  asOfUnix: number;
  session: Session;
  sessionLabel: string;
  delayed: boolean;
  sparkline: number[];
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

export type AxisId = "tape" | "quiet" | "date" | "gap";

export interface AxisScore {
  id: AxisId;
  label: string;
  score: number | null;
  observed: boolean;
  meaning: string;
}

export interface RadarRead {
  axes: AxisScore[];
  sentence: string;
}

export type DateKind = "earnings" | "fda" | "headline";
export type DateStatus = "confirmed" | "estimated" | "printed" | "unconfirmed";
export type DateWhen = "bmo" | "amc" | "unknown";

export interface DatedEvent {
  kind: DateKind;
  status: DateStatus;
  when: DateWhen;
  date: string;
  daysAway: number;
  label: string;
  detail: string;
  consensusEps: number | null;
  surprisePct: number | null;
  provenance: Provenance;
}

export interface DateRead {
  event: DatedEvent | null;
  others: DatedEvent[];
  feedOk: boolean;
  score: number;
  meaning: string;
  sentence: string;
}

export interface CorrelateRow {
  symbol: string;
  name: string;
  corr: number | null;
  changePct: number;
  meaning: string;
}

export type Action = "buy" | "watch" | "wait" | "avoid";

export interface ActionCall {
  action: Action;
  label: string;
  why: string;
  reasons: string[];
}

export type RsiMood = "tired" | "healthy" | "washed" | "soft";

export type VoteId = "trend" | "rsi" | "quiet" | "history";

export interface ConfidenceVote {
  id: VoteId;
  yes: boolean;
  label: string;
  detail: string;
}

export interface CoilHistory {
  samples: number;
  hits: number;
  hitRate: number | null;
  medianFwd: number | null;
  failMedian: number | null;
  sentence: string;
}

export interface ConfidenceRead {
  score: number;
  agreed: number;
  of: number;
  rsi: { value: number | null; mood: RsiMood | null; label: string };
  history: CoilHistory;
  votes: ConfidenceVote[];
  sentence: string;
}

export interface DeskAudit {
  symbol: string;
  composite: number | null;
  verdict: string;
  call: ActionCall;
  pillars: Pillar[];
  radar: RadarRead;
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
