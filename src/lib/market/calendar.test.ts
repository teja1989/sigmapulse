import assert from "node:assert/strict";
import { test } from "node:test";
import {
  daysAway,
  etYmd,
  eventsFromEarningsPayload,
  eventsFromNews,
  parseLooseDate,
  parseWhen,
  pickEvent,
  scoreDate,
  ymd,
} from "./calendar.ts";
import type { DatedEvent, NewsItem } from "./types.ts";

const NOW = new Date("2026-09-08T15:00:00-04:00");

function event(partial: Partial<DatedEvent>): DatedEvent {
  return {
    kind: "earnings",
    status: "estimated",
    when: "unknown",
    date: "2026-10-29",
    daysAway: 51,
    label: "Earnings",
    detail: "",
    consensusEps: null,
    surprisePct: null,
    provenance: { kind: "nasdaq-calendar", label: "t", asOf: null },
    ...partial,
  };
}

test("rejects impossible civil dates", () => {
  assert.equal(ymd(2026, 2, 30), null);
  assert.equal(ymd(2026, 13, 1), null);
  assert.equal(ymd(2026, 9, 8), "2026-09-08");
});

test("parses slash, named, ISO, and yearless dates", () => {
  assert.equal(parseLooseDate("10/29/2026", NOW), "2026-10-29");
  assert.equal(parseLooseDate("Oct 29, 2026", NOW), "2026-10-29");
  assert.equal(parseLooseDate("2026-10-29", NOW), "2026-10-29");
  assert.equal(parseLooseDate("October 15", NOW), "2026-10-15");
  assert.equal(parseLooseDate("January 5", NOW), "2027-01-05");
  assert.equal(parseLooseDate("Feb 30, 2026", NOW), null);
});

test("ET today is the New York calendar date", () => {
  assert.equal(etYmd(NOW), "2026-09-08");
  assert.equal(daysAway("2026-09-08", NOW), 0);
  assert.equal(daysAway("2026-09-09", NOW), 1);
  assert.equal(daysAway("2026-09-07", NOW), -1);
});

test("session when from English and Nasdaq tokens", () => {
  assert.equal(parseWhen("expected to report before market open"), "bmo");
  assert.equal(parseWhen("time-after-hours"), "amc");
  assert.equal(parseWhen("time-not-supplied"), "unknown");
});

test("vendor miss is not a date", () => {
  const { events, feedOk } = eventsFromEarningsPayload("NVDA", {
    data: {
      announcement: "Earnings announcement* for NVDA:  ",
      reportText: "Our vendor, Zacks Investment Research, hasn't provided us with the upcoming earnings report date.",
    },
    status: { rCode: 200 },
  }, NOW);
  assert.equal(feedOk, true);
  assert.equal(events.length, 0);
});

test("estimated earnings date is parsed with BMO", () => {
  const { events, feedOk } = eventsFromEarningsPayload("LLY", {
    data: {
      announcement: "Earnings announcement* for LLY: Oct 29, 2026",
      reportText:
        "Eli Lilly and Company Common Stock is expected* to report earnings on  10/29/2026 before market open. According to Zacks Investment Research, based on  4 analysts' forecasts, the consensus EPS forecast for the quarter is $7.10.",
    },
    status: { rCode: 200 },
  }, NOW);
  assert.equal(feedOk, true);
  assert.equal(events[0]?.date, "2026-10-29");
  assert.equal(events[0]?.status, "estimated");
  assert.equal(events[0]?.when, "bmo");
  assert.equal(events[0]?.consensusEps, 7.1);
});

test("bad symbol is a feed miss, not a fake date", () => {
  const { events, feedOk } = eventsFromEarningsPayload("ZZZZ", {
    data: null,
    status: { rCode: 400 },
  }, NOW);
  assert.equal(feedOk, true);
  assert.equal(events.length, 0);
});

test("network miss is feedOk false", () => {
  const { feedOk } = eventsFromEarningsPayload("AAPL", null, NOW);
  assert.equal(feedOk, false);
});

test("headline PDUFA with a named date becomes an FDA event", () => {
  const news: NewsItem[] = [
    {
      id: "1",
      title: "CYTK PDUFA date set for October 15, 2026",
      publisher: "Test",
      url: "https://example.com",
      publishedAt: NOW.toISOString(),
      related: ["CYTK"],
      provenance: { kind: "yahoo-news", label: "t", asOf: null },
    },
  ];
  const ev = eventsFromNews(news, NOW);
  assert.equal(ev[0]?.kind, "fda");
  assert.equal(ev[0]?.date, "2026-10-15");
  assert.equal(ev[0]?.status, "unconfirmed");
});

test("printed yesterday beats a date 50 days out", () => {
  const picked = pickEvent(
    [
      event({ date: "2026-10-29", daysAway: 51, status: "estimated" }),
      event({ date: "2026-09-07", daysAway: -1, status: "printed", label: "printed" }),
    ],
    false,
    NOW,
  );
  assert.equal(picked?.status, "printed");
});

test("nearer FDA wins over later earnings when preferFda", () => {
  const picked = pickEvent(
    [
      event({ kind: "earnings", date: "2026-10-29", daysAway: 51 }),
      event({ kind: "fda", date: "2026-09-18", daysAway: 10, status: "unconfirmed" }),
    ],
    true,
    NOW,
  );
  assert.equal(picked?.kind, "fda");
});

test("confirmed today scores high; estimated is haircut; none is zero", () => {
  const today = scoreDate(event({ date: "2026-09-08", daysAway: 0, status: "confirmed", when: "amc" }), [], true);
  const est = scoreDate(event({ date: "2026-09-08", daysAway: 0, status: "estimated", when: "amc" }), [], true);
  const none = scoreDate(null, [], true);
  assert.ok(today.score >= 90, String(today.score));
  assert.ok(est.score < today.score);
  assert.equal(none.score, 0);
  assert.match(none.meaning, /no date/i);
});

test("feed down does not invent a date", () => {
  const read = scoreDate(null, [], false);
  assert.equal(read.score, 0);
  assert.match(read.meaning, /won't guess/i);
});

test("catalyst headline without a date stays weak", () => {
  const news: NewsItem[] = [
    {
      id: "1",
      title: "FDA approval rumors swirl for CYTK",
      publisher: "Test",
      url: "https://example.com",
      publishedAt: NOW.toISOString(),
      related: ["CYTK"],
      provenance: { kind: "yahoo-news", label: "t", asOf: null },
    },
  ];
  const read = scoreDate(null, news, true);
  assert.ok(read.score > 0 && read.score < 40);
  assert.match(read.meaning, /nobody named a date/i);
});
