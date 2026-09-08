---
name: sigma-desk
description: >
  Sigma Pulse house recommendation engine (desk-v4). Use when changing stamps,
  the Book, Paid/Failed scoring, the closer, hit rate, report card, replay,
  Hold/Trim/Exit, vs-SPY scoring, or recommendation copy. Enforces the frozen
  contract, English for a non-finance reader, honest delayed provenance, and
  tests-before-rules. Triggers on "book", "stamp", "recommendation", "hit rate",
  "paid", "failed", "desk-v4", "closer", "report card", "replay lab".
metadata:
  short-description: "House book: desk-v4 stamps, exits, Paid/Failed, English, no fake tape"
user-invocable: false
---

# Sigma desk — recommendation engine

The house book is **our** calls, scored later against delayed prints. A Buy
without an exit is a slogan. We do not ship slogans.

**Read `docs/RECOMMENDATION_ENGINE.md` before writing code.** It is the plan,
progress, and remaining phases. This skill is the standard you may not break.

## Frozen contract (desk-v4)

Do **not** silently change these. A real rule change is a new `ENGINE_VERSION`
(`desk-v5`), new tests, and a note in the doc. Old rows keep `desk-v4`.

- Stance: Buy / Watch / Wait / Avoid. One word on the chip.
- Only **Buy** can be Paid or Failed. Watch / Wait / Avoid **expire**.
- Exit is written at stamp: 10 **trading** days (not calendar), stop (20-day if
  above it, else one typical day), take (typical week, capped by room to the high).
- Event in the next 14 days shortens the clock. Event 50 days out is ignored.
- Stop is checked **before** take on the same daily close.
- **Paid** = hit take without stop, **or** at horizon ahead of entry **and**
  ahead of SPY (SPY missing → dollars only, do not claim the market).
- **Failed** = hit stop, **or** behind entry, **or** ahead of entry but behind SPY.
- Score the **delayed daily close we had**, not the day's high/low.
- One auto mark per ticker per ET session. Refresh is not a new call.
- Price ≤ 0 or non-finite → do not stamp.
- Hit rate is **blank** until 20 closed Buys. Never invent one.

Implementation lives in `src/lib/market/book.ts` (pure) and
`src/lib/market/ledger.server.ts` (DB, server-only). Tests:
`src/lib/market/book.test.ts`. Add a failing test **before** changing a rule.

## English, not desk jargon

Copy a non-finance person can read aloud.

| Ban | Use |
|---|---|
| Alpha, R:R, IV rank, z-score | Ahead of the print. Behind SPY. Quiet range. |
| “High conviction Buy” | “3 of 4 agree” or the actual reason |
| Emoji, banners, job ads, disclaimers as wallpaper | One quiet line: delayed prints. Not a broker. |
| “Real-time” | “Yahoo last print” / “delayed” |

A closed row is **one sentence**: paid or failed, by how much, vs SPY or not.

## Honesty

- Yahoo delayed chart is the tape. Never fake a print, a flow, a Form 4, or a PDUFA.
- Unobserved stays unobserved. Do not fill it with a proxy and call it the thing.
- Ledger import is **dynamic**, from a `createServerFn` handler, of
  `ledger.server.ts`. Never static-import `@/lib/db` into a client module.
- Auth stays **off** for the house book. No `user_id` until they ask for accounts.
- Cloud Run without `DATABASE_URL` is ephemeral PGLite. Do not pretend stamps survive scale-to-zero. Say it.

## What is in vs what is next

**In (do not regress):** Phase 0–2 — contract, stamp, Book, closer, English outcomes.

**Not in — do not start unless the user names it:**

- Phase 3 report card (needs 20 closed Buys)
- Phase 4 replay lab
- Phase 5 Hold / Trim / Exit
- SPY card (beta, 20d vs 6m corr, down-day rhyme) — explored, not built

Pick **one** of those when they resume. Not a bundle.

## Tests you must not break

`book.test.ts` covers: zero print, event tomorrow / today / 50d / yesterday,
stop vs take order, vs-SPY fail, missing SPY, Watch/Avoid expire, open if
short path, early take still fills 5d/10d, closed marks do not rewrite
outcome, 20-Buy report-card silence.

If a new edge appears, add it there first.

## UI

- Book is a first-class nav item. `/book` must 200 in deploy smoke.
- Stamp control is `h-11`. No emoji. No purple/gold.
- Chart ticks mark entry (and exit when closed) on the 6-month series only.
- Pulse/Jump may show `Open buy · 10d` — not a second scoring system.

## Finish checklist

- [ ] `ENGINE_VERSION` still `desk-v4` unless this is an intentional v5
- [ ] `npm test` includes `book.test.ts` and it passes
- [ ] No client import of `ledger.server.ts` / `@/lib/db`
- [ ] No hit rate on screen if closed Buys < 20
- [ ] Closed copy is English, vs entry and vs SPY
- [ ] `/book` and `/ticker/AAPL` smoke 200
