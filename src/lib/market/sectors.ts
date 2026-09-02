export type CapSize = "small" | "mid" | "large";
export type SectorId =
  | "tape"
  | "bio"
  | "quantum"
  | "ai"
  | "tech"
  | "electric"
  | "energy"
  | "defense";

export interface SectorName {
  symbol: string;
  capHint: CapSize;
  tag: string;
  watch: string;
}

export interface SectorDef {
  id: SectorId;
  label: string;
  blurb: string;
  queueTitle: string;
  newsQuery: string;
  newsFilter?: RegExp;
  names: SectorName[];
}

export const CAP_BREAKS = {
  small: 2_000_000_000,
  mid: 10_000_000_000,
} as const;

export function capFromMarketCap(marketCap: number | null | undefined, fallback?: CapSize): CapSize | null {
  if (marketCap != null && Number.isFinite(marketCap) && marketCap > 0) {
    if (marketCap < CAP_BREAKS.small) return "small";
    if (marketCap < CAP_BREAKS.mid) return "mid";
    return "large";
  }
  return fallback ?? null;
}

export const SECTORS: Record<SectorId, SectorDef> = {
  tape: {
    id: "tape",
    label: "Tape",
    blurb: "House names. One call each.",
    queueTitle: "Tape",
    newsQuery: "stock market",
    names: [
      { symbol: "AAPL", capHint: "large", tag: "Core", watch: "Consumer hardware and services." },
      { symbol: "MSFT", capHint: "large", tag: "Core", watch: "Cloud and software." },
      { symbol: "NVDA", capHint: "large", tag: "Core", watch: "Data-center GPUs." },
      { symbol: "AMZN", capHint: "large", tag: "Core", watch: "AWS and retail." },
      { symbol: "META", capHint: "large", tag: "Core", watch: "Ads and apps." },
      { symbol: "GOOGL", capHint: "large", tag: "Core", watch: "Search and cloud." },
      { symbol: "TSLA", capHint: "large", tag: "Core", watch: "EV deliveries." },
      { symbol: "AMD", capHint: "large", tag: "Core", watch: "CPU and GPU." },
      { symbol: "PLTR", capHint: "large", tag: "Core", watch: "Gov and commercial software." },
      { symbol: "JPM", capHint: "large", tag: "Core", watch: "Money-center bank." },
      { symbol: "AVGO", capHint: "large", tag: "Core", watch: "Networking silicon." },
      { symbol: "NFLX", capHint: "large", tag: "Core", watch: "Streaming." },
    ],
  },
  bio: {
    id: "bio",
    label: "Bio",
    blurb: "Large, mid, and small cap. Queue is FDA / data / label — not a live FDA feed.",
    queueTitle: "FDA & data queue",
    newsQuery: "FDA PDUFA biotech approval",
    newsFilter: /\b(FDA|PDUFA|AdCom|CRL|BLA|NDA|approval|Phase\s*3|Phase\s*III)\b/i,
    names: [
      { symbol: "LLY", capHint: "large", tag: "PDUFA / label", watch: "Incretin franchise. Next labels and obesity follow-ons." },
      { symbol: "VRTX", capHint: "large", tag: "Pipeline", watch: "Non-opioid pain and kidney. CF cash funds it." },
      { symbol: "REGN", capHint: "large", tag: "Label", watch: "Dupixent plus oncology. Watch new indications." },
      { symbol: "AMGN", capHint: "large", tag: "Phase 3", watch: "MariTide obesity. Biosimilar cash." },
      { symbol: "GILD", capHint: "large", tag: "Label", watch: "HIV franchise and oncology build." },
      { symbol: "ALNY", capHint: "mid", tag: "Launch", watch: "RNAi launches. Rare-disease cash." },
      { symbol: "ARGX", capHint: "mid", tag: "Label", watch: "FcRn (Vyvgart). More indications in queue." },
      { symbol: "BMRN", capHint: "mid", tag: "Rare disease", watch: "Enzyme replacement. Pipeline is thin vs cash." },
      { symbol: "MRNA", capHint: "mid", tag: "Data", watch: "Flu / RSV / oncology reset after COVID." },
      { symbol: "INCY", capHint: "mid", tag: "Label", watch: "Jakafi plus inflammation pipeline." },
      { symbol: "VKTX", capHint: "small", tag: "Phase 3", watch: "Oral obesity (VK2735). Data is the whole tape." },
      { symbol: "MDGL", capHint: "small", tag: "Launch", watch: "MASH (Rezdiffra). Uptake vs next data." },
      { symbol: "CYTK", capHint: "small", tag: "FDA", watch: "Aficamten in HCM. Regulatory path is the trade." },
      { symbol: "CRSP", capHint: "small", tag: "Data", watch: "Ex vivo CRISPR. Next programs vs Casgevy." },
      { symbol: "ACLX", capHint: "small", tag: "Launch", watch: "CAR-T (anito-cel). Competitive myeloma field." },
      { symbol: "IMVT", capHint: "small", tag: "Phase 3", watch: "FcRn (batoclimab / IMVT-1402)." },
    ],
  },
  quantum: {
    id: "quantum",
    label: "Quantum",
    blurb: "Pure-plays plus big-cap exposure. Queue is systems, contracts, and roadmaps.",
    queueTitle: "Systems & contracts",
    newsQuery: "quantum computing",
    newsFilter: /\b(quantum|qubit|ion trap|superconduct)/i,
    names: [
      { symbol: "IBM", capHint: "large", tag: "Roadmap", watch: "Utility-scale roadmap. Hardware plus services." },
      { symbol: "GOOGL", capHint: "large", tag: "Research", watch: "Willow / Sycamore line. Not the P&L yet." },
      { symbol: "MSFT", capHint: "large", tag: "Cloud", watch: "Azure Quantum. Software seat more than boxes." },
      { symbol: "HON", capHint: "large", tag: "Trapped ion", watch: "Quantinuum stake. Industrial parent." },
      { symbol: "IONQ", capHint: "mid", tag: "Systems", watch: "Trapped-ion systems and government contracts." },
      { symbol: "RGTI", capHint: "small", tag: "Superconducting", watch: "Superconducting qubits. Dilution is the risk." },
      { symbol: "QBTS", capHint: "small", tag: "Annealing", watch: "D-Wave annealing vs gate-model story." },
      { symbol: "QUBT", capHint: "small", tag: "Photonic", watch: "Photonic / cubit story. Treat as a flyer." },
      { symbol: "QSI", capHint: "small", tag: "Measurement", watch: "Quantum measurement. Not a computer vendor." },
    ],
  },
  ai: {
    id: "ai",
    label: "AI",
    blurb: "Picks-and-shovels first, then software. Queue is demand, not demos.",
    queueTitle: "Demand queue",
    newsQuery: "AI chips data center",
    names: [
      { symbol: "NVDA", capHint: "large", tag: "GPUs", watch: "Data-center GPUs. The whole tape still keys off this." },
      { symbol: "AVGO", capHint: "large", tag: "Networking", watch: "Custom ASICs and switches around the GPU." },
      { symbol: "TSM", capHint: "large", tag: "Foundry", watch: "Leading-edge wafers. Geopolitics sits on the print." },
      { symbol: "AMD", capHint: "large", tag: "GPUs", watch: "MI300/MI350 share vs NVIDIA." },
      { symbol: "MSFT", capHint: "large", tag: "Cloud", watch: "Azure OpenAI spend and Copilot attach." },
      { symbol: "GOOGL", capHint: "large", tag: "TPUs", watch: "TPU vs GPU. Search plus Gemini." },
      { symbol: "PLTR", capHint: "large", tag: "Software", watch: "AIP in gov and commercial." },
      { symbol: "SMCI", capHint: "mid", tag: "Servers", watch: "Rack assembler. Margins swing with supply." },
      { symbol: "ARM", capHint: "large", tag: "IP", watch: "CPU IP into AI devices and servers." },
      { symbol: "SNOW", capHint: "mid", tag: "Data", watch: "Data cloud. AI features vs consumption growth." },
      { symbol: "SOUN", capHint: "small", tag: "Voice", watch: "Voice AI. Revenue quality is the check." },
      { symbol: "AI", capHint: "small", tag: "Apps", watch: "C3.ai. Enterprise pipeline vs spend." },
    ],
  },
  tech: {
    id: "tech",
    label: "Tech",
    blurb: "Platforms and software. Queue is earnings and guidance, not slogans.",
    queueTitle: "Earnings & guidance",
    newsQuery: "technology earnings guidance",
    names: [
      { symbol: "AAPL", capHint: "large", tag: "Hardware", watch: "iPhone cycle plus services mix." },
      { symbol: "MSFT", capHint: "large", tag: "Cloud", watch: "Azure growth vs capex." },
      { symbol: "GOOGL", capHint: "large", tag: "Ads", watch: "Search ads plus YouTube plus cloud." },
      { symbol: "AMZN", capHint: "large", tag: "Cloud", watch: "AWS margin and retail mix." },
      { symbol: "META", capHint: "large", tag: "Ads", watch: "Ad pricing vs Reality Labs burn." },
      { symbol: "ORCL", capHint: "large", tag: "Cloud", watch: "Cloud RPO and remaining performance." },
      { symbol: "CRM", capHint: "large", tag: "Software", watch: "cRPO and AI attach." },
      { symbol: "NOW", capHint: "large", tag: "Software", watch: "Workflow software. Expansion vs new logos." },
      { symbol: "ADBE", capHint: "large", tag: "Software", watch: "Creative cloud vs Firefly." },
      { symbol: "INTU", capHint: "large", tag: "Software", watch: "TurboTax / QuickBooks seasonality." },
      { symbol: "SHOP", capHint: "large", tag: "Commerce", watch: "GMV and take rate." },
      { symbol: "MDB", capHint: "mid", tag: "Data", watch: "Atlas consumption. AI features vs growth." },
      { symbol: "NET", capHint: "mid", tag: "Edge", watch: "Cloudflare. Workers and security mix." },
      { symbol: "PATH", capHint: "small", tag: "Automation", watch: "UiPath. Automation spend cycle." },
      { symbol: "TOST", capHint: "mid", tag: "Software", watch: "Restaurant software. Unit economics." },
    ],
  },
  electric: {
    id: "electric",
    label: "Electric",
    blurb: "Autos, charging, batteries, lithium. Queue is deliveries, cost, and policy.",
    queueTitle: "Deliveries & materials",
    newsQuery: "electric vehicle battery lithium",
    names: [
      { symbol: "TSLA", capHint: "large", tag: "Deliveries", watch: "Deliveries, energy storage, and robotaxi talk." },
      { symbol: "RIVN", capHint: "mid", tag: "Production", watch: "R2 path and cash burn." },
      { symbol: "LCID", capHint: "small", tag: "Production", watch: "Volume vs cash. Treat as binary." },
      { symbol: "NIO", capHint: "mid", tag: "China", watch: "China EV. Battery-swap story." },
      { symbol: "LI", capHint: "mid", tag: "China", watch: "Extended-range. Profitability vs peers." },
      { symbol: "CHPT", capHint: "small", tag: "Charging", watch: "Network utilization. Policy sensitive." },
      { symbol: "QS", capHint: "small", tag: "Solid state", watch: "Solid-state. Calendar, not current sales." },
      { symbol: "ALB", capHint: "mid", tag: "Lithium", watch: "Lithium price. Cycle stock, not a car." },
      { symbol: "MP", capHint: "small", tag: "Rare earths", watch: "NdPr supply. Policy and offtake." },
      { symbol: "BE", capHint: "mid", tag: "Fuel cells", watch: "Bloom servers / hydrogen. Project timing." },
      { symbol: "PLUG", capHint: "small", tag: "Hydrogen", watch: "Green hydrogen. Dilution risk." },
      { symbol: "ENVX", capHint: "small", tag: "Anode", watch: "Silicon anode. Customer qualification." },
    ],
  },
  energy: {
    id: "energy",
    label: "Energy",
    blurb: "Oil, power, uranium, solar. Queue is price, watts, and policy.",
    queueTitle: "Power & fuel",
    newsQuery: "oil uranium nuclear solar power",
    names: [
      { symbol: "XOM", capHint: "large", tag: "Oil", watch: "Integrated oil. Capital returns." },
      { symbol: "CVX", capHint: "large", tag: "Oil", watch: "Integrated oil. Hess integration." },
      { symbol: "CEG", capHint: "large", tag: "Nuclear", watch: "Merchant nuclear. AI power demand." },
      { symbol: "NEE", capHint: "large", tag: "Utility", watch: "Regulated plus renewables." },
      { symbol: "VST", capHint: "large", tag: "Power", watch: "ERCOT / PJM power. Data-center contracts." },
      { symbol: "FSLR", capHint: "mid", tag: "Solar", watch: "US solar manufacturing. Policy." },
      { symbol: "ENPH", capHint: "mid", tag: "Solar", watch: "Microinverters. Residential cycle." },
      { symbol: "CCJ", capHint: "mid", tag: "Uranium", watch: "Cameco. Fuel contracting cycle." },
      { symbol: "LEU", capHint: "small", tag: "Enrichment", watch: "US enrichment. Policy name." },
      { symbol: "OKLO", capHint: "small", tag: "SMR", watch: "Small modular reactor. Pre-revenue." },
      { symbol: "SMR", capHint: "small", tag: "SMR", watch: "NuScale. Order book vs timeline." },
    ],
  },
  defense: {
    id: "defense",
    label: "Defense",
    blurb: "Primes plus space and drones. Queue is budgets, awards, and delays.",
    queueTitle: "Awards & budgets",
    newsQuery: "defense contract Pentagon space",
    names: [
      { symbol: "LMT", capHint: "large", tag: "Prime", watch: "F-35 and missiles. Budget cadence." },
      { symbol: "RTX", capHint: "large", tag: "Prime", watch: "Raytheon plus Pratt. Engine shop visits." },
      { symbol: "NOC", capHint: "large", tag: "Prime", watch: "B-21 and classified." },
      { symbol: "GD", capHint: "large", tag: "Prime", watch: "Ships, Gulfstream, IT." },
      { symbol: "BA", capHint: "large", tag: "Aero", watch: "Commercial plus defense. Execution is the tape." },
      { symbol: "LHX", capHint: "large", tag: "Prime", watch: "Radios and night vision." },
      { symbol: "KTOS", capHint: "small", tag: "Drones", watch: "Unmanned systems. Award timing." },
      { symbol: "AVAV", capHint: "mid", tag: "Drones", watch: "Loitering munitions and UAS." },
      { symbol: "RKLB", capHint: "mid", tag: "Launch", watch: "Small launch plus space systems." },
      { symbol: "PLTR", capHint: "large", tag: "Software", watch: "Maven / Army software. Same name, defense book." },
    ],
  },
};

export const SECTOR_MENU: SectorId[] = [
  "tape",
  "bio",
  "quantum",
  "ai",
  "tech",
  "electric",
  "energy",
  "defense",
];

export function isSectorId(v: unknown): v is SectorId {
  return typeof v === "string" && v in SECTORS;
}

export function isCapSize(v: unknown): v is CapSize {
  return v === "small" || v === "mid" || v === "large";
}

export function getSector(id: string | undefined): SectorDef {
  if (id && isSectorId(id)) return SECTORS[id];
  return SECTORS.tape;
}

export function filterNews<T extends { title: string }>(items: T[], re?: RegExp): T[] {
  if (!re) return items;
  const hit = items.filter((t) => re.test(t.title));
  return hit.length ? hit : items;
}
