import assert from "node:assert/strict";
import test from "node:test";
import { CATCH_UP_MS, RAIN_COOLDOWN_MS, getDueScheduledAlerts, localDateKey, shouldShowRainAlert } from "./schedule";
import type { ScheduledAlert } from "./types";

const schedule: ScheduledAlert[] = [
  { id: "morning", title: "Breakfast", hour: 10, minute: 0 },
  { id: "evening", title: "Dinner", hour: 20, minute: 0 },
];
const at = (hour: number, minute = 0, second = 0) => new Date(2026, 8, 10, hour, minute, second);

test("delivers delayed ticks once without suppressing the next scheduled alert", () => {
  const delivered = new Set<string>();
  const morning = getDueScheduledAlerts(schedule, at(10, 0, 17), delivered);
  assert.equal(morning.length, 1);
  assert.equal(morning[0].title, "Breakfast");
  delivered.add(morning[0].id);
  assert.deepEqual(getDueScheduledAlerts(schedule, at(10, 1), delivered), []);
  assert.equal(getDueScheduledAlerts(schedule, at(20, 0, 2), delivered)[0].title, "Dinner");
});

test("catches up within five minutes, including the boundary, but never before the due time", () => {
  const due = at(10).getTime();
  for (const delay of [0, 61_000, CATCH_UP_MS]) {
    assert.equal(getDueScheduledAlerts(schedule, new Date(due + delay), new Set()).length, 1);
  }
  for (const delay of [-1, CATCH_UP_MS + 1]) {
    assert.deepEqual(getDueScheduledAlerts(schedule, new Date(due + delay), new Set()), []);
  }
});

test("occurrence IDs survive storage round trips and reset on the next local day", () => {
  const morning = getDueScheduledAlerts(schedule, at(10), new Set())[0];
  const restored = new Set<string>(JSON.parse(JSON.stringify([morning.id])));
  assert.deepEqual(getDueScheduledAlerts(schedule, at(10, 2), restored), []);
  const tomorrow = new Date(2026, 8, 11, 10);
  assert.equal(getDueScheduledAlerts(schedule, tomorrow, restored).length, 1);
  assert.equal(localDateKey(tomorrow), "2026-09-11");
  assert.deepEqual(getDueScheduledAlerts(schedule, new Date(2026, 8, 11, 0), restored), []);
});

test("simultaneous scheduled alerts have independent occurrence IDs", () => {
  const both = getDueScheduledAlerts([schedule[0], { ...schedule[0], id: "second" }], at(10), new Set());
  assert.equal(both.length, 2);
  assert.notEqual(both[0].id, both[1].id);
});

test("rain alerts respect weather codes and local quiet hours", () => {
  for (const hour of [0, 6, 21, 23]) assert.equal(shouldShowRainAlert(61, null, at(hour)), false);
  for (const hour of [7, 12, 20]) assert.equal(shouldShowRainAlert(61, null, at(hour)), true);
  for (const code of [0, 3, 71, undefined]) assert.equal(shouldShowRainAlert(code, null, at(12)), false);
  for (const code of [51, 56, 65, 67, 82, 99]) assert.equal(shouldShowRainAlert(code, null, at(12)), true);
});

test("rain cooldown expires six hours after delivery and ignores corrupt timestamps", () => {
  const now = at(14);
  assert.equal(shouldShowRainAlert(61, now.getTime() - RAIN_COOLDOWN_MS + 1, now), false);
  assert.equal(shouldShowRainAlert(61, now.getTime() - RAIN_COOLDOWN_MS, now), true);
  assert.equal(shouldShowRainAlert(61, Number.NaN, now), true);
});
