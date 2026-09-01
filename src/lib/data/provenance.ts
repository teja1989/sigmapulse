/**
 * Data provenance — every number the terminal renders must declare where it came from.
 *
 * The terminal previously displayed live quotes, hash-derived placeholders, simulated
 * ticks and hardcoded constants in identical typography, so a user could not tell which
 * numbers to trust. Provenance makes that distinction explicit and machine-checkable.
 */

export type Provenance =
  /** Fetched from a market data provider within the freshness window. */
  | 'LIVE'
  /** Fetched from a provider, but delayed (typically 15 minutes). */
  | 'DELAYED'
  /** Computed by our own models from inputs of the stated quality. */
  | 'MODEL'
  /** Hardcoded sample content shipped with the app. Not market data. */
  | 'SAMPLE'
  /** Deterministically derived from the ticker string because no feed was reachable. */
  | 'PLACEHOLDER';

export interface Sourced<T> {
  value: T;
  provenance: Provenance;
  /** ISO timestamp of when the underlying observation was made. */
  asOf: string | null;
  /** Provider identifier, when the value came from one. */
  source?: string;
}

export function sourced<T>(
  value: T,
  provenance: Provenance,
  asOf: string | null = null,
  source?: string
): Sourced<T> {
  return { value, provenance, asOf, source };
}

/** Whether a provenance is safe to base a trading decision on. */
export function isDecisionGrade(p: Provenance): boolean {
  return p === 'LIVE' || p === 'DELAYED';
}

export const PROVENANCE_LABEL: Record<Provenance, string> = {
  LIVE: 'Live',
  DELAYED: 'Delayed',
  MODEL: 'Model',
  SAMPLE: 'Sample data',
  PLACEHOLDER: 'No feed',
};

export const PROVENANCE_NOTE: Record<Provenance, string> = {
  LIVE: 'Fetched from the market data provider.',
  DELAYED: 'Fetched from the provider on a delayed feed.',
  MODEL: 'Computed by SigmaPulse from the inputs shown. Not an observed market price.',
  SAMPLE: 'Illustrative sample content shipped with the app. Not market data — do not trade on it.',
  PLACEHOLDER: 'No market feed was reachable. This value is derived from the ticker symbol itself and carries no market information.',
};

/**
 * Confidence in a computed signal, given the worst provenance among its inputs.
 * A model output can never be more trustworthy than the data underneath it.
 */
export type SignalConfidence = 'HIGH' | 'MODERATE' | 'LOW' | 'UNUSABLE';

export function confidenceFromInputs(inputs: Provenance[]): SignalConfidence {
  if (inputs.length === 0) return 'UNUSABLE';
  if (inputs.includes('PLACEHOLDER')) return 'UNUSABLE';
  if (inputs.includes('SAMPLE')) return 'LOW';
  if (inputs.every((p) => p === 'LIVE')) return 'HIGH';
  if (inputs.every((p) => isDecisionGrade(p) || p === 'MODEL')) return 'MODERATE';
  return 'LOW';
}
