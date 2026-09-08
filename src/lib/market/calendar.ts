import { fetchJson, fetchText, mapPool, NASDAQ_HEADERS } from "./http.ts";
import type { DateKind, DateRead, DateStatus, DateWhen, DatedEvent, NewsItem, Provenance } from "./types.ts";

const MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
  may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8,
  sep: 9, sept: 9, september: 9, oct: 10, october: 10, nov: 11, november: 11,
  dec: 12, december: 12,
};

const STOP = new Set([
  "inc", "corp", "corporation", "company", "companies", "the", "and", "common",
  "stock", "class", "ltd", "plc", "holdings", "group", "limited", "therapeutics",
  "pharmaceuticals", "pharma", "biosciences", "biotech",
]);

const CATALYST_RE =
  /\b(PDUFA|AdCom|advisory committee|CRL|BLA|NDA|FDA (?:approval|approves|clearance)|Phase\s*3|Phase\s*III)\b/i;

const NASDAQ_TTL = 6 * 60 * 60_000;
const NASDAQ_MISS_TTL = 30 * 60_000;
const FDA_TTL = 30 * 60_000;

interface NasdaqEarningsDate {
  data?: {
    reportText?: string;
    announcement?: string;
    heading?: string;
  } | null;
  status?: { rCode?: number };
}

interface NasdaqSurprise {
  data?: {
    earningsSurpriseTable?: {
      rows?: Array<{
        dateReported?: string;
        eps?: number | string;
        consensusForecast?: string;
        percentageSurprise?: string;
      }>;
    };
  } | null;
}

interface NasdaqCalendar {
  data?: {
    rows?: Array<{
      symbol?: string;
      time?: string;
      name?: string;
      epsForecast?: string;
    }>;
  } | null;
}

interface FdaItem {
  title: string;
  url: string;
  publishedAt: string | null;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function ymd(year: number, month: number, day: number): string | null {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (dt.getUTCFullYear() !== year || dt.getUTCMonth() !== month - 1 || dt.getUTCDate() !== day) return null;
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function etYmd(now: Date = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

export function daysAway(dateYmd: string, now: Date = new Date()): number {
  const today = etYmd(now);
  const a = Date.parse(`${dateYmd}T00:00:00Z`);
  const b = Date.parse(`${today}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return NaN;
  return Math.round((a - b) / 86_400_000);
}

export function parseLooseDate(raw: string, now: Date = new Date()): string | null {
  const s = raw.replace(/\u00a0/g, " ").trim();
  const slash = s.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
  if (slash) return ymd(Number(slash[3]), Number(slash[1]), Number(slash[2]));
  const iso = s.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (iso) return ymd(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  const named = s.match(
    /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(20\d{2}))?\b/i,
  );
  if (!named) return null;
  const month = MONTHS[named[1].toLowerCase().replace(/\./g, "")];
  if (!month) return null;
  const day = Number(named[2]);
  let year = named[3] ? Number(named[3]) : Number(etYmd(now).slice(0, 4));
  let out = ymd(year, month, day);
  if (!named[3] && out) {
    if (daysAway(out, now) < -3) {
      out = ymd(year + 1, month, day);
    }
  }
  return out;
}

export function parseWhen(text: string): DateWhen {
  if (/before (the )?market open|pre-?market|time-pre-market|prior to the open/i.test(text)) return "bmo";
  if (/after (the )?(market )?close|after[- ]hours|time-after-hours|after the bell/i.test(text)) return "amc";
  return "unknown";
}

function nasdaqProv(asOf: string | null): Provenance {
  return { kind: "nasdaq-calendar", label: "Nasdaq / Zacks calendar", asOf };
}

function fdaProv(asOf: string | null): Provenance {
  return { kind: "fda-rss", label: "FDA press RSS", asOf };
}

function newsProv(asOf: string | null): Provenance {
  return { kind: "news-date", label: "Date named in a headline", asOf };
}

function whenLabel(when: DateWhen): string {
  if (when === "bmo") return "before the open";
  if (when === "amc") return "after the close";
  return "time not given";
}

export function formatYmd(dateYmd: string): string {
  const [y, m, d] = dateYmd.split("-").map(Number);
  if (!y || !m || !d) return dateYmd;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function awayLabel(days: number): string {
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  if (days > 1 && days <= 7) return `in ${days} days`;
  if (days < -1 && days >= -7) return `${Math.abs(days)} days ago`;
  if (days > 7) return `in ${days} days`;
  return `${Math.abs(days)} days ago`;
}

function statusFromText(text: string): DateStatus {
  if (/hasn't provided|not provided|no upcoming/i.test(text)) return "unconfirmed";
  if (/derived from an algorithm|estimated to report|expected\*/i.test(text)) return "estimated";
  return "estimated";
}

function parseEps(text: string): number | null {
  const m = text.match(/consensus EPS[^\d$]{0,40}\$?(-?\d+(?:\.\d+)?)/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function nameTokens(name: string | undefined): string[] {
  if (!name) return [];
  return name
    .replace(/,.*$/, "")
    .split(/[\s/&.-]+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 4 && !STOP.has(w.toLowerCase()));
}

export function pickEvent(events: DatedEvent[], preferFda = false, now: Date = new Date()): DatedEvent | null {
  if (!events.length) return null;
  const printed = events.filter((e) => e.status === "printed" && e.daysAway >= -2 && e.daysAway <= 0);
  if (printed.length) {
    return printed.sort((a, b) => b.daysAway - a.daysAway)[0];
  }
  const future = events.filter((e) => e.daysAway >= 0 && e.daysAway <= 400);
  if (!future.length) return null;
  future.sort((a, b) => {
    if (preferFda && a.kind === "fda" && b.kind !== "fda" && a.daysAway <= 14) return -1;
    if (preferFda && b.kind === "fda" && a.kind !== "fda" && b.daysAway <= 14) return 1;
    if (a.daysAway !== b.daysAway) return a.daysAway - b.daysAway;
    if (a.status === "confirmed" && b.status !== "confirmed") return -1;
    if (b.status === "confirmed" && a.status !== "confirmed") return 1;
    return 0;
  });
  void now;
  return future[0];
}

export function scoreDate(event: DatedEvent | null, news: NewsItem[], feedOk: boolean): DateRead {
  if (event) {
    const when = whenLabel(event.when);
    const day = formatYmd(event.date);
    const kind = event.kind === "fda" ? "FDA" : event.kind === "earnings" ? "Earnings" : "Headline date";
    let score: number;
    let meaning: string;
    if (event.status === "printed") {
      score = 16;
      meaning = `${kind} already printed ${awayLabel(event.daysAway)}. The date is behind you.`;
    } else if (event.daysAway === 0) {
      score = event.status === "confirmed" ? 94 : 78;
      meaning = `${kind} is today, ${when}. ${event.status === "estimated" ? "Estimated, not company-confirmed." : "On the calendar."}`;
    } else if (event.daysAway === 1) {
      score = event.status === "confirmed" ? 86 : 70;
      meaning = `${kind} is tomorrow, ${when}.`;
    } else if (event.daysAway <= 5) {
      score = event.status === "confirmed" ? 74 : 58;
      meaning = `${kind} ${day} (${awayLabel(event.daysAway)}), ${when}.`;
    } else if (event.daysAway <= 14) {
      score = event.status === "confirmed" ? 56 : 42;
      meaning = `${kind} ${day}, ${awayLabel(event.daysAway)}.`;
    } else if (event.daysAway <= 45) {
      score = event.status === "confirmed" ? 40 : 30;
      meaning = `${kind} ${day}, ${awayLabel(event.daysAway)}. Far enough that Quiet still matters more.`;
    } else {
      score = 18;
      meaning = `${kind} ${day} — too far to act on the date.`;
    }
    if (event.status === "estimated" && event.daysAway >= 0) {
      meaning += " Zacks estimate — the company may not have confirmed.";
    }
    return {
      event,
      others: [],
      feedOk,
      score,
      meaning,
      sentence: meaning,
    };
  }

  const fresh = news.filter((n) => {
    if (!n.publishedAt) return false;
    const age = (Date.now() - new Date(n.publishedAt).getTime()) / 36e5;
    return Number.isFinite(age) && age <= 72 && CATALYST_RE.test(n.title);
  });
  const recent = news.filter((n) => {
    if (!n.publishedAt) return false;
    const age = (Date.now() - new Date(n.publishedAt).getTime()) / 36e5;
    return Number.isFinite(age) && age <= 24 * 7;
  });
  if (!feedOk) {
    return {
      event: null,
      others: [],
      feedOk: false,
      score: 0,
      meaning: "Calendar didn't answer. We won't guess a date.",
      sentence: "Calendar didn't answer. We won't guess a date.",
    };
  }
  if (fresh.length) {
    return {
      event: null,
      others: [],
      feedOk,
      score: 24,
      meaning: "A catalyst is in the headlines, but nobody named a date we can put on a calendar.",
      sentence: "A catalyst is in the headlines, but nobody named a date we can put on a calendar.",
    };
  }
  if (recent.length) {
    return {
      event: null,
      others: [],
      feedOk,
      score: 12,
      meaning: "Headlines this week, but no date we can see.",
      sentence: "Headlines this week, but no date we can see.",
    };
  }
  return {
    event: null,
    others: [],
    feedOk,
    score: 0,
    meaning: "No date we can see.",
    sentence: "No date we can see.",
  };
}

function eventFromEarnings(opts: {
  symbol: string;
  ymd: string;
  status: DateStatus;
  when: DateWhen;
  text: string;
  now: Date;
  asOf: string;
}): DatedEvent {
  const days = daysAway(opts.ymd, opts.now);
  return {
    kind: "earnings",
    status: opts.status,
    when: opts.when,
    date: opts.ymd,
    daysAway: days,
    label: `Earnings ${formatYmd(opts.ymd)}`,
    detail: `${opts.status === "estimated" ? "Estimated" : "Confirmed"} · ${whenLabel(opts.when)}`,
    consensusEps: parseEps(opts.text),
    surprisePct: null,
    provenance: nasdaqProv(opts.asOf),
  };
}

export function eventsFromEarningsPayload(
  symbol: string,
  payload: NasdaqEarningsDate | null,
  now: Date = new Date(),
): { events: DatedEvent[]; feedOk: boolean } {
  if (!payload) return { events: [], feedOk: false };
  const code = payload.status?.rCode ?? 200;
  if (code >= 400 || !payload.data) return { events: [], feedOk: code < 500 };
  const text = `${payload.data.announcement ?? ""} ${payload.data.reportText ?? ""}`;
  if (/hasn't provided|not provided/i.test(text)) return { events: [], feedOk: true };
  const date = parseLooseDate(payload.data.announcement ?? "") ?? parseLooseDate(payload.data.reportText ?? "", now);
  if (!date) return { events: [], feedOk: true };
  const days = daysAway(date, now);
  if (!Number.isFinite(days) || days > 400 || days < -60) return { events: [], feedOk: true };
  const status = days < 0 ? "printed" : statusFromText(text);
  return {
    events: [
      eventFromEarnings({
        symbol,
        ymd: date,
        status,
        when: parseWhen(text),
        text,
        now,
        asOf: now.toISOString(),
      }),
    ],
    feedOk: true,
  };
}

export function eventsFromSurprise(payload: NasdaqSurprise | null, now: Date = new Date()): DatedEvent[] {
  const row = payload?.data?.earningsSurpriseTable?.rows?.[0];
  if (!row?.dateReported) return [];
  const date = parseLooseDate(row.dateReported, now);
  if (!date) return [];
  const days = daysAway(date, now);
  if (!Number.isFinite(days) || days < -14 || days > 1) return [];
  const surprise = row.percentageSurprise != null ? Number(String(row.percentageSurprise).replace(/%/g, "")) : null;
  return [
    {
      kind: "earnings",
      status: "printed",
      when: "unknown",
      date,
      daysAway: days,
      label: `Earnings printed ${formatYmd(date)}`,
      detail: surprise != null && Number.isFinite(surprise) ? `Surprise ${surprise.toFixed(1)}%` : "Already reported.",
      consensusEps: row.consensusForecast != null ? Number(row.consensusForecast) : null,
      surprisePct: surprise != null && Number.isFinite(surprise) ? surprise : null,
      provenance: nasdaqProv(now.toISOString()),
    },
  ];
}

export function eventsFromNews(items: NewsItem[], now: Date = new Date()): DatedEvent[] {
  const out: DatedEvent[] = [];
  for (const n of items) {
    if (!CATALYST_RE.test(n.title)) continue;
    const date = parseLooseDate(n.title, now);
    if (!date) continue;
    const days = daysAway(date, now);
    if (!Number.isFinite(days) || days > 400 || days < -7) continue;
    const kind: DateKind = /PDUFA|AdCom|advisory|CRL|BLA|NDA|FDA/i.test(n.title) ? "fda" : "headline";
    out.push({
      kind,
      status: days < 0 ? "printed" : "unconfirmed",
      when: parseWhen(n.title),
      date,
      daysAway: days,
      label: kind === "fda" ? `FDA ${formatYmd(date)}` : `Date in headline ${formatYmd(date)}`,
      detail: n.title,
      consensusEps: null,
      surprisePct: null,
      provenance: newsProv(n.publishedAt),
    });
  }
  return out;
}

export function eventsFromFdaRss(items: FdaItem[], name: string | undefined, now: Date = new Date()): DatedEvent[] {
  const tokens = nameTokens(name).map((t) => t.toLowerCase());
  if (!tokens.length) return [];
  const out: DatedEvent[] = [];
  for (const it of items) {
    const title = it.title.toLowerCase();
    if (!tokens.some((t) => title.includes(t.toLowerCase()))) continue;
    const pub = it.publishedAt ? etYmd(new Date(it.publishedAt)) : etYmd(now);
    const days = daysAway(pub, now);
    if (!Number.isFinite(days) || days < -7 || days > 14) continue;
    out.push({
      kind: "fda",
      status: days <= 0 ? "printed" : "confirmed",
      when: "unknown",
      date: pub,
      daysAway: days,
      label: days <= 0 ? `FDA release ${formatYmd(pub)}` : `FDA ${formatYmd(pub)}`,
      detail: it.title,
      consensusEps: null,
      surprisePct: null,
      provenance: fdaProv(it.publishedAt),
    });
  }
  return out;
}

function parseRssItems(xml: string): FdaItem[] {
  const items: FdaItem[] = [];
  const blocks = xml.split(/<item[\s>]/i).slice(1);
  for (const block of blocks) {
    const title = block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim();
    const link = block.match(/<link>([\s\S]*?)<\/link>/i)?.[1]?.trim();
    const pub = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim();
    if (!title) continue;
    items.push({
      title: title.replace(/&/g, "&").replace(/</g, "<"),
      url: link ?? "",
      publishedAt: pub ? new Date(pub).toISOString() : null,
    });
  }
  return items;
}

export async function fetchEarningsDate(symbol: string): Promise<NasdaqEarningsDate | null> {
  const sym = symbol.toUpperCase();
  return fetchJson<NasdaqEarningsDate>(
    [`https://api.nasdaq.com/api/analyst/${encodeURIComponent(sym)}/earnings-date`],
    NASDAQ_TTL,
    5_000,
    NASDAQ_HEADERS,
  );
}

export async function fetchEarningsSurprise(symbol: string): Promise<NasdaqSurprise | null> {
  const sym = symbol.toUpperCase();
  return fetchJson<NasdaqSurprise>(
    [`https://api.nasdaq.com/api/company/${encodeURIComponent(sym)}/earnings-surprise`],
    NASDAQ_TTL,
    5_000,
    NASDAQ_HEADERS,
  );
}

export async function fetchDayCalendar(dateYmd: string): Promise<NasdaqCalendar | null> {
  return fetchJson<NasdaqCalendar>(
    [`https://api.nasdaq.com/api/calendar/earnings?date=${encodeURIComponent(dateYmd)}`],
    NASDAQ_MISS_TTL,
    5_000,
    NASDAQ_HEADERS,
  );
}

export async function fetchFdaRss(): Promise<FdaItem[]> {
  const xml = await fetchText(
    ["https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/press-releases/rss.xml"],
    FDA_TTL,
    6_000,
  );
  if (!xml) return [];
  return parseRssItems(xml);
}

function applyCalendarConfirm(event: DatedEvent, cal: NasdaqCalendar | null, symbol: string): DatedEvent {
  const row = cal?.data?.rows?.find((r) => (r.symbol ?? "").toUpperCase() === symbol.toUpperCase());
  if (!row) return event;
  const when = row.time ? parseWhen(row.time) : event.when;
  return {
    ...event,
    status: event.status === "printed" ? "printed" : "confirmed",
    when: when === "unknown" ? event.when : when,
    detail: `On Nasdaq's ${formatYmd(event.date)} list · ${whenLabel(when === "unknown" ? event.when : when)}`,
  };
}

export async function resolveDates(opts: {
  symbol: string;
  name?: string;
  news: NewsItem[];
  preferFda?: boolean;
  now?: Date;
}): Promise<DateRead> {
  const now = opts.now ?? new Date();
  const symbol = opts.symbol.toUpperCase();
  const [earnPayload, surprisePayload, fdaItems] = await Promise.all([
    fetchEarningsDate(symbol),
    fetchEarningsSurprise(symbol),
    fetchFdaRss(),
  ]);
  const parsed = eventsFromEarningsPayload(symbol, earnPayload, now);
  let events = [
    ...parsed.events,
    ...eventsFromSurprise(surprisePayload, now),
    ...eventsFromNews(opts.news, now),
    ...eventsFromFdaRss(fdaItems, opts.name, now),
  ];
  const future = events.find((e) => e.kind === "earnings" && e.daysAway >= 0 && e.daysAway <= 21);
  if (future) {
    const cal = await fetchDayCalendar(future.date);
    events = events.map((e) => (e === future ? applyCalendarConfirm(e, cal, symbol) : e));
  }
  const event = pickEvent(events, opts.preferFda ?? false, now);
  const read = scoreDate(event, opts.news, parsed.feedOk);
  read.others = events.filter((e) => e !== event);
  return read;
}

export async function resolveDatesForSymbols(
  rows: Array<{ symbol: string; name?: string; preferFda?: boolean }>,
  now: Date = new Date(),
): Promise<Map<string, DateRead>> {
  const fdaItems = await fetchFdaRss();
  const payloads = await mapPool(rows, 8, async (row) => {
    const earn = await fetchEarningsDate(row.symbol);
    return { row, earn };
  });
  const needCal = new Set<string>();
  const staged = payloads.map(({ row, earn }) => {
    const parsed = eventsFromEarningsPayload(row.symbol, earn, now);
    const events = [
      ...parsed.events,
      ...eventsFromFdaRss(fdaItems, row.name, now),
    ];
    for (const e of events) {
      if (e.kind === "earnings" && e.daysAway >= 0 && e.daysAway <= 21) needCal.add(e.date);
    }
    return { row, events, feedOk: parsed.feedOk };
  });
  const cals = new Map<string, NasdaqCalendar | null>();
  await mapPool([...needCal], 6, async (date) => {
    cals.set(date, await fetchDayCalendar(date));
    return date;
  });
  const out = new Map<string, DateRead>();
  for (const { row, events, feedOk } of staged) {
    const confirmed = events.map((e) => {
      if (e.kind !== "earnings" || e.daysAway < 0) return e;
      return applyCalendarConfirm(e, cals.get(e.date) ?? null, row.symbol);
    });
    const event = pickEvent(confirmed, row.preferFda ?? false, now);
    const read = scoreDate(event, [], feedOk);
    read.others = confirmed.filter((e) => e !== event);
    out.set(row.symbol.toUpperCase(), read);
  }
  return out;
}
