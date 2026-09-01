import { 
  buildLongCallStrategy, 
  buildBullCallSpread, 
  buildIronCondor, 
  buildLongStraddle, 
  OptionsStrategyStructure 
} from '../quant/optionsEngine';

export function getCuratedOptionsSignals(): OptionsStrategyStructure[] {
  return [
    // 1. Tech / AI: NVDA Bull Call Spread (Spot: $219.63)
    buildBullCallSpread(
      'NVDA',
      219.63,
      45,
      0.46,
      0.08,
      'Sovereign AI export clearances and hyperscaler Blackwell ramp',
      94
    ),

    // 2. Politician Trades: PLTR Long Call (Spot: $186.38)
    buildLongCallStrategy(
      'PLTR',
      186.38,
      60,
      0.58,
      0.04,
      'Multiple Congressional Armed Services members purchasing OTM calls ahead of DoD CJADC2 award',
      95
    ),

    // 3. Quantum: IONQ Long Call (Spot: $39.31)
    buildLongCallStrategy(
      'IONQ',
      39.31,
      60,
      0.82,
      0.08,
      'Photonic quantum optical interconnect breakthrough & 64 AQ roadmap delivery',
      92
    ),

    // 4. Biotech: LLY Bull Call Spread (Spot: $1,156.73)
    buildBullCallSpread(
      'LLY',
      1156.73,
      35,
      0.36,
      0.05,
      'FDA Advisory Committee 14-1 vote on Retatrutide metabolic expansion',
      96
    ),

    // 5. Tech / AI: MSFT Iron Condor (Spot: $512.40)
    buildIronCondor(
      'MSFT',
      512.40,
      30,
      0.24,
      0.06,
      'Consolidation around enterprise Copilot adoption milestones with high IV crush',
      87
    ),

    // 6. Biotech: VRTX Long Straddle (Spot: $514.20)
    buildLongStraddle(
      'VRTX',
      514.20,
      28,
      0.34,
      'Upcoming PDUFA commercial rollout decision on VX-548 non-opioid pain therapeutic',
      89
    ),

    // 7. Tech / AI: AMD Bull Call Spread (Spot: $204.80)
    buildBullCallSpread(
      'AMD',
      204.80,
      45,
      0.48,
      0.07,
      'MI350X cluster adoption taking cloud provider compute allocation',
      88
    ),

    // 8. Quantum: RGTI Long Call (Spot: $5.85)
    buildLongCallStrategy(
      'RGTI',
      5.85,
      45,
      0.95,
      0.12,
      'DOE National Labs 84-qubit on-premises installation milestone',
      83
    )
  ];
}
