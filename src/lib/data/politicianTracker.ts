export interface PoliticianTradeEntry {
  id: string;
  politician: string;
  party: 'DEMOCRAT' | 'REPUBLICAN' | 'INDEPENDENT';
  chamber: 'HOUSE' | 'SENATE';
  state: string;
  committee: string;
  ticker: string;
  assetName: string;
  transactionType: 'PURCHASE' | 'SALE' | 'OPTION_CALL_BUY' | 'OPTION_PUT_BUY';
  amountRange: string;
  estimatedValue: number;
  transactionDate: string;
  filingDate: string;
  daysToDisclose: number;
  priceAtPurchase: number;
  currentPrice: number;
  unrealizedReturnPercent: number;
  historicalPoliticianWinRate: number; // e.g. 82%
  conflictScore: number; // 0 - 100
  notableCommitteeConflict: string;
  recommendedOptionFollow: string;
}

export const POLITICIAN_TRADES: PoliticianTradeEntry[] = [
  {
    id: 'pol-trade-1',
    politician: 'Nancy Pelosi (Spouse)',
    party: 'DEMOCRAT',
    chamber: 'HOUSE',
    state: 'CA',
    committee: 'House Democratic Leadership / High Tech Caucus',
    ticker: 'NVDA',
    assetName: 'NVIDIA Corporation',
    transactionType: 'OPTION_CALL_BUY',
    amountRange: '$1,000,001 - $5,000,000',
    estimatedValue: 2500000,
    transactionDate: '2026-06-15',
    filingDate: '2026-07-02',
    daysToDisclose: 17,
    priceAtPurchase: 178.50,
    currentPrice: 219.63,
    unrealizedReturnPercent: 23.04,
    historicalPoliticianWinRate: 84.5,
    conflictScore: 92,
    notableCommitteeConflict: 'Federal AI infrastructure appropriations & high-bandwidth memory tariff exemption bills.',
    recommendedOptionFollow: 'NVDA $225 Call (60 DTE) / Bull Call Spread $220/$240',
  },
  {
    id: 'pol-trade-2',
    politician: 'Tommy Tuberville',
    party: 'REPUBLICAN',
    chamber: 'SENATE',
    state: 'AL',
    committee: 'Senate Armed Services & Agriculture',
    ticker: 'PLTR',
    assetName: 'Palantir Technologies',
    transactionType: 'PURCHASE',
    amountRange: '$250,001 - $500,000',
    estimatedValue: 350000,
    transactionDate: '2026-07-10',
    filingDate: '2026-07-28',
    daysToDisclose: 18,
    priceAtPurchase: 138.40,
    currentPrice: 186.38,
    unrealizedReturnPercent: 34.67,
    historicalPoliticianWinRate: 79.2,
    conflictScore: 95,
    notableCommitteeConflict: 'Direct oversight on US Army tactical edge intelligence contract awards and CJADC2 program.',
    recommendedOptionFollow: 'PLTR $190 Long Call (60 DTE) or $185/$205 Debit Spread',
  },
  {
    id: 'pol-trade-3',
    politician: 'Michael McCaul',
    party: 'REPUBLICAN',
    chamber: 'HOUSE',
    state: 'TX',
    committee: 'House Foreign Affairs & Homeland Security',
    ticker: 'TSM',
    assetName: 'Taiwan Semiconductor Mfg.',
    transactionType: 'PURCHASE',
    amountRange: '$500,001 - $1,000,000',
    estimatedValue: 750000,
    transactionDate: '2026-05-20',
    filingDate: '2026-06-12',
    daysToDisclose: 23,
    priceAtPurchase: 188.00,
    currentPrice: 228.40,
    unrealizedReturnPercent: 21.49,
    historicalPoliticianWinRate: 81.0,
    conflictScore: 88,
    notableCommitteeConflict: 'Authored Indo-Pacific maritime deterrence and allied semiconductor supply chain resilience pact.',
    recommendedOptionFollow: 'TSM $230 Call (45 DTE)',
  },
  {
    id: 'pol-trade-4',
    politician: 'Ro Khanna',
    party: 'DEMOCRAT',
    chamber: 'HOUSE',
    state: 'CA',
    committee: 'House Armed Services - Cyber, Innovative Tech & Info Systems',
    ticker: 'IONQ',
    assetName: 'IonQ, Inc.',
    transactionType: 'PURCHASE',
    amountRange: '$100,001 - $250,000',
    estimatedValue: 175000,
    transactionDate: '2026-07-05',
    filingDate: '2026-07-22',
    daysToDisclose: 17,
    priceAtPurchase: 26.50,
    currentPrice: 39.31,
    unrealizedReturnPercent: 48.34,
    historicalPoliticianWinRate: 77.4,
    conflictScore: 90,
    notableCommitteeConflict: 'Direct jurisdiction over Quantum National Initiative Reauthorization and DARPA quantum funding.',
    recommendedOptionFollow: 'IONQ $42 Long Call (60 DTE)',
  },
  {
    id: 'pol-trade-5',
    politician: 'Dan Crenshaw',
    party: 'REPUBLICAN',
    chamber: 'HOUSE',
    state: 'TX',
    committee: 'House Energy and Commerce (Health Subcommittee)',
    ticker: 'LLY',
    assetName: 'Eli Lilly and Company',
    transactionType: 'PURCHASE',
    amountRange: '$100,001 - $250,000',
    estimatedValue: 180000,
    transactionDate: '2026-06-02',
    filingDate: '2026-06-25',
    daysToDisclose: 23,
    priceAtPurchase: 980.00,
    currentPrice: 1156.73,
    unrealizedReturnPercent: 18.03,
    historicalPoliticianWinRate: 83.1,
    conflictScore: 86,
    notableCommitteeConflict: 'House oversight on FDA accelerated drug review pathways and Medicare Part D obesity coverage legislation.',
    recommendedOptionFollow: 'LLY $1180 Bull Call Vertical (45 DTE)',
  }
];
