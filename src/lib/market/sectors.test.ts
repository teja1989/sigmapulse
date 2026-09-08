import assert from "node:assert/strict";
import { test } from "node:test";
import {
  capFromMarketCap,
  deskUniverse,
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

test("newsForTicker prefers a title match", () => {
  const items = [
    { title: "Uber misses", related: ["NVDA"] },
    { title: "NVDA wins a data-center deal", related: [] },
  ];
  const out = newsForTicker(items, "NVDA", "NVIDIA Corporation");
  assert.equal(out.length, 1);
  assert.match(out[0].title, /NVDA/);
});

test("peersOf stays inside the sector", () => {
  const peers = peersOf("NVDA", 4);
  assert.ok(peers.length > 0);
  assert.ok(!peers.includes("NVDA"));
});

test("isSectorId rejects junk", () => {
  assert.equal(isSectorId("bio"), true);
  assert.equal(isSectorId("nope"), false);
});

test("filterNews drops non-matching titles", () => {
  const re = /\bFDA\b/;
  assert.equal(filterNews([{ title: "FDA approves" }, { title: "Weather" }], re).length, 1);
});

test("sectorOf maps a bio name and a tape-menu name", () => {
  assert.equal(sectorOf("LLY"), "bio");
  assert.ok(isSectorId(sectorOf("AAPL")));
});

test("desk universe is unique across sectors", () => {
  const u = deskUniverse();
  assert.equal(u.length, new Set(u).size);
  assert.ok(u.includes("AAPL"));
  assert.ok(u.includes("LLY"));
  assert.ok(u.length >= 70);
});
