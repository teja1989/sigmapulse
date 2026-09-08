# Recommendation engine — plan and progress

House book of our own calls. Delayed prints. English for a non-finance reader.
Engine version frozen as **desk-v4**. Later rules do not rewrite old marks.

Read this before touching stamps, the Book, Paid/Failed, the closer, or hit rate.
The agent skill that enforces it is `.grok/skills/sigma-desk/SKILL.md`.

## Why

A Buy without an exit is a slogan. We stamp the call **with** the exit, wait for
time or the written levels, then say whether we were right — in one sentence.
The first honest hit rate is after **20 closed Buys**. Until then the report
card stays empty on purpose.

## The Mark (frozen)

One object, version `desk-v4`:

| Field | Rule |
|---|---|
| Print | Delayed last print we actually saw. Never a live SIP print. |
| Stance | Buy / Watch / Wait / Avoid |
| Setup | coil / lag / room / spent / wash / none |
| Exit | Time = 10 **trading** days, unless a dated event is sooner (≤14 days). Stop = 20-day average if price is above it, else one typical day. Take = typical week, capped by room to the 52-week high. |
| Event fuse | Earnings/FDA today or tomorrow shortens the clock. Flatten into that print. Dates 50 days out are ignored. |
| SPY | Frozen at stamp. A Buy that beats our print but loses to SPY is **failed**. Missing SPY → dollars only, do not call the market. |
| Regime | SPY 20-day up / down / unknown, frozen. |
| Confidence + radar | Snapshot only. Do not recompute on close. |
| Idempotency | One **auto** mark per ticker per ET session. Manual stamp is a second source. Refresh does not duplicate. |
| Bad print | Price ≤ 0 or non-finite → do not stamp. |

Watch / Wait / Avoid are **notes**, not trades. They expire. They are never paid or failed.

## Who writes the book

Visitors do **not** stamp. Opening Pulse or a ticker only **reads** the house mark
and may **settle** an open one if the stop/take/clock already hit.

The house writes after the US close:

1. GitHub Action `desk-session.yml` — weeknights ~21:00–22:00 ET, POST `/api/desk-session`
2. Same job from the Book page (**Write tonight's book**) when you need to run it now
3. Session date is the **last daily bar**, not the wall clock (a 12:55am Tuesday run stamps Monday)
4. Too early (same session, before 16:00 ET) → close open marks, **do not** stamp
5. One `auto` row per ticker per session. Refresh is not a new call
6. Every visitor sees the same book

Header `x-desk-job` must match `DESK_JOB_SECRET` when that env is set on Cloud Run.
Add the GitHub secret `DESK_JOB_SECRET` (and `DATABASE_URL` on Cloud Run) so the
nightly write survives scale-to-zero.

## Scoring (frozen)

Scored on the **delayed daily close**, not the day's high/low.

| Path | Outcome |
|---|---|
| Close through the stop (checked before take on the same bar) | **Failed** |
| Close through the take, stop never hit | **Paid** |
| Horizon: ahead of entry **and** ahead of SPY (or SPY unobserved) | **Paid** |
| Horizon: behind entry, or ahead of entry but behind SPY | **Failed** |
| Watch / Wait / Avoid at horizon | **Expired** |
| Not enough trading days yet | Stay **open** |
| Early take/stop still fills 5d and 10d when those bars arrive | Outcome does not change |

## Phases

| Phase | Status | What |
|---|---|---|
| **0 — Contract** | **Done** | Schema, exit rules, Paid/Failed, `desk-v4`. Tests in `src/lib/market/book.test.ts`. |
| **1 — Ledger + session job** | **Done** | `house_marks` table. Nightly job writes the universe after the close. `/book` Open / Closed. Empty report card (20-mark rule). Visitors do not stamp. |
| **2 — Closer** | **Done** | On load, close marks that hit stop / take / time / event. Fill 5d and 10d vs entry and vs SPY. Closed row in English. |
| **3 — Report card** | **Not started** | After 20 closed Buys: hit rate by setup, by regime, vs SPY. Still no number before 20. |
| **4 — Replay lab** | **Not started** | Walk the same rules over 6–12 months of daily closes. Same object, `source: replay`. Not mixed into the live hit rate until we say so. |
| **5 — Hold / Trim / Exit** | **Not started** | Open mark on a later visit becomes Hold / Trim / Exit. Same book, new row type. |
| **SPY card** | **Explored, not built** | Ticker card: moves with the market / beta / 20-day ahead-or-behind / down-day rhyme. See below. |
| Auth on the book | **Off** | House book is unowned. Do not add `user_id` until sign-in is an explicit product choice. |

## Code map

| Path | Role |
|---|---|
| `src/lib/market/book.ts` | Pure contract. `planExit`, `draftMark`, `closeMark`. No DB. |
| `src/lib/market/book.test.ts` | Edge cases. Add a test here before changing a rule. |
| `src/lib/market/ledger.server.ts` | Postgres. Server-only (`.server.ts`). Never import from a client component. |
| `src/lib/market/session-job.ts` | Nightly universe close + stamp. `source: auto`. |
| `src/routes/api.desk-session.ts` | POST for GitHub Actions. |
| `src/routes/book.tsx` | Open / Closed / report card. Operator **Write tonight's book**. |
| `src/components/MarkCard.tsx` | Read-only house mark on the ticker. |
| `migrations/0002_house_marks.sql` | Applied. Do not edit. New columns → `0003_*.sql`. |

## SPY metrics (explored 2026-09-08, not in the UI yet)

Three different questions. Do not collapse them into one “correlation” number.

1. **Moves with the market?** Pearson of daily log returns vs SPY (we show 6 months on **Moves with**).
2. **Moves more than the market?** Beta. Missing from the UI. NVDA ~1.9×, TSLA ~3.2×, NFLX ~0.2×, JPM ~0.4×.
3. **Ahead or behind right now?** 20-day excess vs SPY. Already used for **Lag** (−4%) and for Book scoring.

Useful extra, still not built: 20-day corr vs 6-month corr (did the rhyme break?), down-day corr (does it fall with SPY?).

A non-finance SPY card, when we build it, is four English lines — not an oscillator.

## Honesty

- Delayed Yahoo prints. Stamp the print we had.
- No SIP real-time, no paid flow, no Form 4, no guaranteed PDUFA calendar.
- Cloud Run without `DATABASE_URL` uses in-process PGLite: stamps die on scale-to-zero. Set `DATABASE_URL` (Neon) on the service for a durable book.
- Preview DB is also PGLite: wiped on dev restart.

## How to resume

1. Read this file and `.grok/skills/sigma-desk/SKILL.md`.
2. Do not change Paid/Failed or `desk-v4` without a new engine version and new tests.
3. Next build, pick one: Phase 3 (report card after 20), the SPY card, or Phase 4 replay. Not all three.
