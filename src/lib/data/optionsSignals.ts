import { 
  buildLongCallStrategy, 
  buildBullCallSpread, 
  buildIronCondor, 
  buildLongStraddle, 
  OptionsStrategyStructure 
} from '../quant/optionsEngine';

export function getCuratedOptionsSignals(): OptionsStrategyStructure[] {
  return [
    // 1. Tech / AI: NVDA Bull Call Spread
    buildBullCallSpread(
      'NVDA',
      138.40,
      45,
      0.46,
      0.08,
      'Sovereign AI export clearances and hyperscaler Blackwell ramp',
      94
    ),

    // 2. Quantum: IONQ Long Call (High Gamma Speculative Breakout)
    buildLongCallStrategy(
      'IONQ',
      24.80,
      60,
      0.86,
      0.08,
      'Photonic quantum optical interconnect breakthrough & 64 AQ roadmap delivery',
      91
    ),

    // 3. Biotech: LLY Bull Call Spread (High Conviction FDA Catalyst)
    buildBullCallSpread(
      'LLY',
      942.00,
      35,
      0.38,
      0.05,
      'FDA Advisory Committee 14-1 vote on Retatrutide metabolic expansion',
      96
    ),

    // 4. Politician Trades: PLTR Long Call (Following Congressional STOCK Act LEAPS flow)
    buildLongCallStrategy(
      'PLTR',
      43.50,
      60,
      0.62,
      0.05,
      'Multiple Congressional Armed Services members purchasing OTM calls ahead of DoD CJADC2 award',
      92
    ),

    // 5. Tech / AI: MSFT Iron Condor (Vol Crush / Rangebound theta play)
    buildIronCondor(
      'MSFT',
      445.80,
      30,
      0.26,
      0.06,
      'Consolidation around enterprise Copilot adoption milestones with high IV crush',
      87
    ),

    // 6. Biotech: VRTX Long Straddle (Binary Regulatory / Clinical trial catalyst)
    buildLongStraddle(
      'VRTX',
      486.20,
      28,
      0.35,
      'Upcoming PDUFA commercial rollout decision on VX-548 non-opioid pain therapeutic',
      89
    ),

    // 7. Tech / AI: AMD Bull Call Spread
    buildBullCallSpread(
      'AMD',
      168.25,
      45,
      0.52,
      0.07,
      'MI350X cluster adoption taking cloud provider compute allocation',
      88
    ),

    // 8. Quantum: RGTI Long Call
    buildLongCallStrategy(
      'RGTI',
      3.42,
      45,
      1.04,
      0.12,
      'DOE National Labs 84-qubit on-premises installation milestone',
      83
    )
  ];
}
