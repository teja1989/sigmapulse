import assert from "node:assert/strict";
import { test } from "node:test";
import {
  capFromMarketCap,
  filterNews,
  getSector,
  isSectorId,
  newsForTicker,
  peersOf,
  sectorOf,
  SECTOR_MENU,
  SECTORS,
} from "./sectors.ts";

test("cap buckets split at 2B and 10B", () => {
  assert.equal(capFromMarketCap(500_000_000), "small");
  assert.equal(capFromMarketCap(2_000_000_000), "mid");
  assert.equal(capFromMarketCap(9_999_999_999), "mid");
  assert.equal(capFromMarketCap(10_000_000_000), "large");
  assert.equal(capFromMarketCap(null, "small"), "small");
});

test("every menu sector has mixed cap hints and a queue", () => {
  for (const id of SECTOR_MENU) {
    const s = SECTORS[id];
    assert.ok(s.names.length >= 8, id);
    assert.ok(s.queueTitle.length > 0, id);
    if (id !== "tape") {
      const caps = new Set(s.names.map((n) => n.capHint));
      assert.ok(caps.has("small") && caps.has("large"), `${id} missing cap mix`);
    }
  }
});

test("bio has an FDA filter and more than one small cap", () => {
  const bio = getSector("bio");
  assert.ok(bio.newsFilter);
  assert.ok(bio.names.filter((n) => n.capHint === "small").length >= 3);
  assert.ok(bio.names.some((n) => /FDA|PDUFA|Phase 3/i.test(n.tag)));
});

test("unknown sector falls back to tape", () => {
  assert.equal(getSector("nope").id, "tape");
  assert.equal(isSectorId("bio"), true);
});

test("news filter dumps unmatched headlines instead of filling with noise", () => {
  const bio = getSector("bio");
  const kept = filterNews([{ title: "Uber beats" }, { title: "FDA approves CYTK" }], bio.newsFilter);
  assert.deepEqual(
    kept.map((k) => k.title),
    ["FDA approves CYTK"],
  );
});

test("peers of NVDA come from AI, not the whole tape", () => {
  const peers = peersOf("NVDA", 4);
  assert.equal(peers.length, 4);
  assert.ok(!peers.includes("NVDA"));
  assert.equal(sectorOf("NVDA"), "ai");
});

test("news for a ticker prefers the name in the headline", () => {
  const rows = newsForTicker(
    [
      { title: "Uber beats on rides", related: ["UBER"] },
      { title: "NVIDIA unveils next GPU", related: ["NVDA", "AMD"] },
      { title: "Chip stocks rally", related: ["NVDA"] },
    ],
    "NVDA",
    "NVIDIA Corporation",
  );
  assert.deepEqual(
    rows.map((r) => r.title),
    ["NVIDIA unveils next GPU"],
  );
});

