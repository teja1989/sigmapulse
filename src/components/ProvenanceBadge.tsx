'use client';

import React from 'react';
import { AlertTriangle, Radio, Clock, Calculator, FlaskConical } from 'lucide-react';
import { Provenance, PROVENANCE_LABEL, PROVENANCE_NOTE } from '@/lib/data/provenance';

interface ProvenanceBadgeProps {
  provenance: Provenance;
  asOf?: string | null;
  className?: string;
}

const STYLES: Record<Provenance, string> = {
  LIVE: 'text-emerald-400 bg-emerald-950/60 border-emerald-700/60',
  DELAYED: 'text-sky-400 bg-sky-950/60 border-sky-700/60',
  MODEL: 'text-slate-300 bg-slate-800/60 border-slate-600/60',
  SAMPLE: 'text-amber-300 bg-amber-950/60 border-amber-600/70',
  PLACEHOLDER: 'text-rose-300 bg-rose-950/70 border-rose-600/70',
};

function icon(p: Provenance) {
  switch (p) {
    case 'LIVE': return <Radio className="w-3 h-3" />;
    case 'DELAYED': return <Clock className="w-3 h-3" />;
    case 'MODEL': return <Calculator className="w-3 h-3" />;
    case 'SAMPLE': return <FlaskConical className="w-3 h-3" />;
    case 'PLACEHOLDER': return <AlertTriangle className="w-3 h-3" />;
  }
}

/**
 * Declares where a displayed number came from. Every panel that renders something other
 * than a live quote must carry one, so a user can tell at a glance which figures are
 * safe to act on.
 */
export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({ provenance, asOf, className = '' }) => (
  <span
    title={PROVENANCE_NOTE[provenance]}
    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-mono font-bold uppercase tracking-wide ${STYLES[provenance]} ${className}`}
  >
    {icon(provenance)}
    <span>{PROVENANCE_LABEL[provenance]}</span>
    {asOf && <span className="opacity-70 normal-case font-normal">· {asOf}</span>}
  </span>
);

/**
 * Full-width banner for panels whose entire contents are non-tradeable sample data.
 */
export const SampleDataBanner: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-amber-600/50 bg-amber-950/40 text-amber-200 text-[11px] font-sans leading-relaxed">
    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
    <span>{children}</span>
  </div>
);
