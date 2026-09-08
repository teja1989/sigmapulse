# Sigma Pulse — architecture

TanStack Start (Vite + Nitro) serves the desk. Cloud Run uses `NITRO_PRESET=node-server`.

The **recommendation engine** (house book, stamps, Paid/Failed, remaining phases)
is documented in [RECOMMENDATION_ENGINE.md](./RECOMMENDATION_ENGINE.md).
Agent standard: `.grok/skills/sigma-desk/SKILL.md`.

## Feeds (honest)

| Surface | Source | Note |
| --- | --- | --- |
| Quotes / charts | Yahoo Finance chart v8 | Delayed last print |
| Live tape poll | Yahoo 1m chart | Last print, stamped delayed |
| Options / unusual | Yahoo options v7 | Nearest expiry; unusual = volume / OI |
| News | Yahoo search | Ticker-scoped headlines |
| Earnings date | Nasdaq earnings-date / calendar | Estimated vs confirmed; free |
| FDA date | Headline / RSS parse | Only with a civil date |
| IV rank | Unobserved | No 1-year IV history |
| STOCK Act / Form 4 | Unobserved | Pillar stays blank |
| SIP real-time / paid flow | Unobserved | Do not fake |

## Call, not a composite essay

1. **Action** — Buy / Watch / Wait / Avoid, with reasons (trend, RSI, range, day).
2. **Setup** — coil / lag / room / spent / wash. Coil and lag are the earlier read.
3. **Radar** — Tape, Quiet, Date, Gap. English on each spoke.
4. **Confidence** — RSI mood, trend, coil, history. Capped when tired or downtrend.
5. **Date** — Next dated event if we have one. Fuse on the stamp.
6. **Book** — Stamp with an exit. Close later. Paid / Failed / Expired.

## House ledger

`house_marks` (see `migrations/0002_house_marks.sql`). Auth off: unowned rows.
Durable only when `DATABASE_URL` is set (Neon). Preview and Cloud Run without it
use PGLite and lose rows on restart / scale-to-zero.

Engine version **desk-v4**. Do not rewrite old marks in place.
