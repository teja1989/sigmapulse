import assert from "node:assert/strict";
import { test } from "node:test";
import { deskJobAuthorized } from "./job-auth.ts";

test("job secret is required only when set", () => {
  const prev = process.env.DESK_JOB_SECRET;
  delete process.env.DESK_JOB_SECRET;
  assert.equal(deskJobAuthorized(new Request("http://x/api/desk-session")), true);
  process.env.DESK_JOB_SECRET = "house";
  assert.equal(deskJobAuthorized(new Request("http://x/api/desk-session")), false);
  assert.equal(
    deskJobAuthorized(
      new Request("http://x/api/desk-session", { headers: { "x-desk-job": "house" } }),
    ),
    true,
  );
  if (prev == null) delete process.env.DESK_JOB_SECRET;
  else process.env.DESK_JOB_SECRET = prev;
});
