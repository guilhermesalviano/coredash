import assert from "node:assert/strict";
import test from "node:test";

import { buildWishlistUpdateStatus } from "./get-wishlist-update-status";

const timezone = "America/Sao_Paulo";

test("reports a snapshot from the same local day as up to date", () => {
  const status = buildWishlistUpdateStatus(
    new Date("2026-09-10T11:00:00Z"),
    timezone,
    new Date("2026-09-10T23:00:00Z"),
  );

  assert.deepEqual(status, {
    lastUpdatedAt: "2026-09-10T11:00:00.000Z",
    updatedToday: true,
    timezone,
  });
});

test("compares calendar days in the configured timezone, not UTC", () => {
  // 2026-09-11T01:00Z is still 2026-09-10 22:00 in São Paulo.
  assert.equal(
    buildWishlistUpdateStatus(new Date("2026-09-10T11:00:00Z"), timezone, new Date("2026-09-11T01:00:00Z")).updatedToday,
    true,
  );
  // 2026-09-10T02:00Z is still 2026-09-09 in São Paulo.
  assert.equal(
    buildWishlistUpdateStatus(new Date("2026-09-10T02:00:00Z"), timezone, new Date("2026-09-10T12:00:00Z")).updatedToday,
    false,
  );
});

test("reports stale or missing snapshots as not up to date", () => {
  assert.equal(
    buildWishlistUpdateStatus(new Date("2026-09-08T11:00:00Z"), timezone, new Date("2026-09-10T12:00:00Z")).updatedToday,
    false,
  );
  assert.deepEqual(buildWishlistUpdateStatus(null, timezone), {
    lastUpdatedAt: null,
    updatedToday: false,
    timezone,
  });
});
