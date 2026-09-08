import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ENGINE_VERSION,
  MIN_CLOSED_BUYS,
  barsFromSeries,
  canStamp,
  closeMark,
  draftFromQuote,
  draftMark,
  etHour,
  outcomeSentence,
  pathAfter,
  pctChange,
  planExit,
  regimeOf,
  reportCardCopy,
  sessionDateFromBars,
  stampSessionReady,
  type HouseMark,
} from "./book.ts";

const SESSION = "2026-09-04";

function mark(partial: Partial<HouseMark> = {}): HouseMark {
  return {
    id: "m1",
    symbol: "TEST",
    sessionDate: SESSION,
    source: "auto",
    engineVersion: ENGINE_VERSION,
    stance: "buy",
    setup: "coil",
    entryPrint: 100,
    spyPrint: 500,
    stopPct: 2,
    stopKind: "atr",
    takePct: 5,
    timeHorizonTd: 10,
    eventDate: null,
    eventLabel: null,
    regime: "index_up",
    confidenceScore: 75,
    confidenceAgreed: 3,
    radarTape: 60,
    radarQuiet: 70,
    radarDate: 18,
    radarGap: 50,
    why: "Quiet coil.",
    status: "open",
    outcome: null,
    closeReason: null,
    closedAt: null,
    closePrint: null,
    closeSessionDate: null,
    fwd5dPct: null,
    fwd10dPct: null,
    vsSpy5d: null,
    vsSpy10d: null,
    vsSpyClose: null,
    sentence: "open",
    createdAt: "2026-09-04T20:00:00.000Z",
    ...partial,
  };
}

function weekdayPath(start: string, closes: number[]): { dates: string[]; closes: number[] } {
  const [y, m, d] = start.split("-").map(Number);
  const dates: string[] = [];
  const cur = new Date(Date.UTC(y!, m! - 1, d!));
  while (dates.length < closes.length) {
    const dow = cur.getUTCDay();
    if (dow !== 0 && dow !== 6) {
      dates.push(cur.toISOString().slice(0, 10));
    }
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return { dates, closes };
}

test("refuses a zero or non-finite print", () => {
  assert.equal(canStamp(0, "AAPL"), false);
  assert.equal(canStamp(Number.NaN, "AAPL"), false);
  assert.equal(canStamp(100, ""), false);
  assert.equal(canStamp(100, "AAPL"), true);
});

test("event tomorrow shortens the time fuse to 1 day", () => {
  const exit = planExit({
    stance: "buy",
    price: 100,
    ema20: 98,
    atrPct: 1.2,
    roomPct: 12,
    eventDate: "2026-09-05",
    eventLabel: "Earnings",
    sessionDate: SESSION,
  });
  assert.equal(exit.timeHorizonTd, 1);
  assert.equal(exit.eventDate, "2026-09-05");
});

test("event today still waits one trading day through the print", () => {
  const exit = planExit({
    stance: "buy",
    price: 100,
    ema20: 98,
    atrPct: 1.2,
    roomPct: 12,
    eventDate: SESSION,
    eventLabel: "Earnings",
    sessionDate: SESSION,
  });
  assert.equal(exit.timeHorizonTd, 1);
});

test("event 50 days out is ignored — time stays 10", () => {
  const exit = planExit({
    stance: "buy",
    price: 100,
    ema20: 98,
    atrPct: 1.2,
    roomPct: 12,
    eventDate: "2026-10-29",
    eventLabel: "Earnings",
    sessionDate: SESSION,
  });
  assert.equal(exit.eventDate, null);
  assert.equal(exit.timeHorizonTd, 10);
});

test("printed event yesterday is not a fuse", () => {
  const exit = planExit({
    stance: "buy",
    price: 100,
    ema20: 98,
    atrPct: 1.2,
    roomPct: 8,
    eventDate: "2026-09-03",
    eventLabel: "Earnings",
    sessionDate: SESSION,
  });
  assert.equal(exit.eventDate, null);
});

test("stop uses 20-day when price is above it, else a typical day", () => {
  const ema = planExit({
    stance: "buy",
    price: 100,
    ema20: 97,
    atrPct: 1.5,
    roomPct: 10,
    eventDate: null,
    eventLabel: null,
    sessionDate: SESSION,
  });
  assert.equal(ema.stopKind, "ema20");
  assert.equal(ema.stopPct, 3);
  const atr = planExit({
    stance: "buy",
    price: 100,
    ema20: 101,
    atrPct: 1.5,
    roomPct: 10,
    eventDate: null,
    eventLabel: null,
    sessionDate: SESSION,
  });
  assert.equal(atr.stopKind, "atr");
  assert.equal(atr.takePct, 3.35); // 1.5 * sqrt(5) ≈ 3.35, under room 10
});

test("take is capped by room to the high", () => {
  const exit = planExit({
    stance: "buy",
    price: 100,
    ema20: 99,
    atrPct: 4,
    roomPct: 2,
    eventDate: null,
    eventLabel: null,
    sessionDate: SESSION,
  });
  assert.equal(exit.takePct, 2);
});

test("Watch has no stop or take", () => {
  const exit = planExit({
    stance: "watch",
    price: 100,
    ema20: 98,
    atrPct: 1.2,
    roomPct: 12,
    eventDate: null,
    eventLabel: null,
    sessionDate: SESSION,
  });
  assert.equal(exit.stopPct, null);
  assert.equal(exit.takePct, null);
  assert.equal(exit.timeHorizonTd, 10);
});

test("tiny stop is dropped rather than written as noise", () => {
  const exit = planExit({
    stance: "buy",
    price: 100,
    ema20: 99.95,
    atrPct: 0.1,
    roomPct: 8,
    eventDate: null,
    eventLabel: null,
    sessionDate: SESSION,
  });
  assert.equal(exit.stopPct, null);
});

test("pathAfter skips the entry session and weekends stay out of weekdayPath", () => {
  const p = weekdayPath("2026-09-04", [100, 101, 102, 103]);
  assert.equal(p.dates[0], "2026-09-04");
  assert.ok(!p.dates.includes("2026-09-05")); // Saturday
  const after = pathAfter(p, "2026-09-04");
  assert.deepEqual(after.closes, [101, 102, 103]);
});

test("take hits before stop — paid", () => {
  const p = weekdayPath("2026-09-04", [100, 101, 106, 90]);
  const spy = weekdayPath("2026-09-04", [500, 501, 502, 503]);
  const closed = closeMark(mark(), p, spy);
  assert.equal(closed.status, "closed");
  assert.equal(closed.outcome, "paid");
  assert.equal(closed.closeReason, "take");
  assert.equal(closed.closeSessionDate, "2026-09-08");
});

test("stop is checked before take on the same close", () => {
  const p = weekdayPath("2026-09-04", [100, 90]);
  const closed = closeMark(mark({ stopPct: 5, takePct: 5 }), p, null);
  assert.equal(closed.outcome, "failed");
  assert.equal(closed.closeReason, "stop");
});

test("horizon: ahead of print and SPY is paid", () => {
  const name = weekdayPath("2026-09-04", [100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110]);
  const spy = weekdayPath("2026-09-04", [500, 501, 501, 502, 502, 503, 503, 504, 504, 505, 505]);
  const closed = closeMark(mark({ takePct: null, stopPct: null }), name, spy);
  assert.equal(closed.status, "closed");
  assert.equal(closed.outcome, "paid");
  assert.equal(closed.closeReason, "time");
  assert.ok((closed.fwd10dPct ?? 0) > 0);
  assert.ok((closed.vsSpyClose ?? 0) > 0);
});

test("horizon: +2% vs SPY +4% is failed — wrong vs the index", () => {
  const name = weekdayPath("2026-09-04", [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 102]);
  const spy = weekdayPath("2026-09-04", [500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 520]);
  const closed = closeMark(mark({ takePct: null, stopPct: null }), name, spy);
  assert.equal(closed.outcome, "failed");
  assert.match(outcomeSentence(closed), /behind SPY/i);
});

test("horizon with no SPY: ahead of the print is paid, market unobserved", () => {
  const name = weekdayPath("2026-09-04", [100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110]);
  const closed = closeMark(mark({ spyPrint: null, takePct: null, stopPct: null }), name, null);
  assert.equal(closed.outcome, "paid");
  assert.equal(closed.vsSpyClose, null);
  assert.match(closed.sentence, /will not call the market/i);
});

test("Watch expires — never paid or failed", () => {
  const name = weekdayPath("2026-09-04", [100, 90, 90, 90, 90, 90, 90, 90, 90, 90, 80]);
  const closed = closeMark(mark({ stance: "watch", stopPct: null, takePct: null }), name, null);
  assert.equal(closed.outcome, "expired");
  assert.match(closed.sentence, /not a trade/i);
});

test("Avoid expires even if the print dropped", () => {
  const name = weekdayPath("2026-09-04", [100, 99, 98, 97, 96, 95, 94, 93, 92, 91, 90]);
  const closed = closeMark(mark({ stance: "avoid", stopPct: null, takePct: null }), name, null);
  assert.equal(closed.outcome, "expired");
});

test("not enough bars stays open", () => {
  const name = weekdayPath("2026-09-04", [100, 101, 102]);
  const closed = closeMark(mark(), name, null);
  assert.equal(closed.status, "open");
  assert.equal(closed.outcome, null);
});

test("event fuse closes on the event date and scores the print", () => {
  const name = weekdayPath("2026-09-04", [100, 101, 102]);
  const spy = weekdayPath("2026-09-04", [500, 500, 500]);
  const closed = closeMark(
    mark({ eventDate: "2026-09-08", timeHorizonTd: 2, takePct: null, stopPct: null }),
    name,
    spy,
  );
  assert.equal(closed.closeReason, "event");
  assert.equal(closed.closeSessionDate, "2026-09-08");
  assert.equal(closed.status, "closed");
});

test("early take still fills 5d and 10d when those bars exist", () => {
  const closes = [100, 106, 101, 101, 101, 101, 101, 101, 101, 101, 120];
  const name = weekdayPath("2026-09-04", closes);
  const closed = closeMark(mark({ takePct: 5, stopPct: 20 }), name, null);
  assert.equal(closed.closeReason, "take");
  assert.ok(closed.fwd5dPct != null);
  assert.ok(closed.fwd10dPct != null);
  assert.equal(closed.fwd10dPct, pctChange(100, 120));
});

test("closed mark only fills forwards, does not rewrite the outcome", () => {
  const name = weekdayPath("2026-09-04", [100, 106, 101, 101, 101, 101]);
  const already: HouseMark = {
    ...mark({ takePct: 5 }),
    status: "closed",
    outcome: "paid",
    closeReason: "take",
    closePrint: 106,
    closeSessionDate: "2026-09-08",
    sentence: "Hit the written take.",
  };
  const next = closeMark(already, name, null);
  assert.equal(next.outcome, "paid");
  assert.equal(next.closeReason, "take");
  assert.ok(next.fwd5dPct != null);
});

test("draft carries engine version and refuses a bad print", () => {
  const good = draftMark({
    symbol: "aapl",
    price: 320,
    spyPrice: 500,
    sessionDate: SESSION,
    source: "auto",
    stance: "buy",
    setup: "coil",
    why: "Quiet.",
    ema20: 310,
    atrPct: 1.2,
    roomPct: 8,
    eventDate: null,
    eventLabel: null,
    spyCloses: Array.from({ length: 30 }, (_, i) => 400 + i),
  });
  assert.ok(good);
  assert.equal(good.engineVersion, "desk-v4");
  assert.equal(good.symbol, "AAPL");
  assert.equal(good.regime, "index_up");
  assert.equal(
    draftMark({
      symbol: "AAPL",
      price: 0,
      spyPrice: 500,
      sessionDate: SESSION,
      source: "auto",
      stance: "buy",
      setup: "coil",
      why: "x",
      ema20: 1,
      atrPct: 1,
      roomPct: 1,
      eventDate: null,
      eventLabel: null,
    }),
    null,
  );
});

test("index regime is unknown without 20 days of SPY", () => {
  assert.equal(regimeOf([1, 2, 3]), "unknown");
  assert.equal(regimeOf(Array.from({ length: 21 }, (_, i) => 100 - i)), "index_down");
});

test("report card refuses a hit rate under 20 closed Buys", () => {
  assert.match(reportCardCopy(0), /20 closed Buys/);
  assert.match(reportCardCopy(19), /We have 19/);
  assert.match(reportCardCopy(MIN_CLOSED_BUYS), /Closed Buys: 20/);
});

test("barsFromSeries drops non-finite closes", () => {
  const bars = barsFromSeries([1, 2, 3], [10, Number.NaN, 12]);
  assert.equal(bars.closes.length, 2);
});

test("session date is the last bar, not the wall clock", () => {
  const mondayClose = Date.parse("2026-09-07T16:00:00-04:00") / 1000;
  const tuesdayNight = new Date("2026-09-08T00:55:00-04:00");
  assert.equal(sessionDateFromBars([mondayClose], tuesdayNight), "2026-09-07");
  const draft = draftFromQuote({
    symbol: "AAPL",
    price: 100,
    closes: [100],
    timestamps: [mondayClose],
    high52: 120,
    spyPrice: 500,
    spyCloses: Array.from({ length: 30 }, (_, i) => 400 + i),
    stance: "buy",
    setup: "coil",
    why: "Quiet.",
    source: "auto",
    now: tuesdayNight,
  });
  assert.ok(draft);
  assert.equal(draft.sessionDate, "2026-09-07");
});

test("house only writes after the close, or for a finished prior session", () => {
  const tuesdayMorning = new Date("2026-09-08T11:00:00-04:00");
  const tuesdayEvening = new Date("2026-09-08T22:00:00-04:00");
  assert.equal(etHour(tuesdayMorning) < 16, true);
  assert.equal(stampSessionReady("2026-09-08", tuesdayMorning), false);
  assert.equal(stampSessionReady("2026-09-08", tuesdayEvening), true);
  assert.equal(stampSessionReady("2026-09-07", tuesdayMorning), true);
  assert.equal(stampSessionReady("2026-09-09", tuesdayEvening), false);
});
